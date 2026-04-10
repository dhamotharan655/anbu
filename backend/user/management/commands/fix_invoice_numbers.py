"""
Django Management Command to Fix Invoice Numbering

This command fixes the invoice numbering issue caused by alphabetical sorting
instead of numeric sorting in the invoice generation logic.

Usage:
    python manage.py fix_invoice_numbers

The issue: order_by('-invoice_number') sorts strings alphabetically, not numerically.
Example: "INV-2026-10" comes before "INV-2026-2" in string order (because '1' < '2')

This causes duplicate invoice numbers and gaps in the sequence.
"""

from django.core.management.base import BaseCommand
from user.models import BookServiceComplaint
from datetime import datetime


class Command(BaseCommand):
    help = 'Fix invoice numbering sequence in database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be fixed without making changes',
        )
        parser.add_argument(
            '--year',
            type=int,
            default=None,
            help='Fix invoices for specific year only',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        year = options['year']
        
        if year is None:
            year = datetime.now().year
        
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('INVOICE NUMBERING FIX COMMAND'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS(f'\nYear: {year}'))
        self.stdout.write(self.style.SUCCESS(f'Dry run: {dry_run}'))
        
        # Get all invoices for the year
        all_invoices = BookServiceComplaint.objects(
            invoice_number__startswith=f"INV-{year}-"
        )
        
        # Convert to list with numeric extraction
        invoice_list = []
        for inv in all_invoices:
            try:
                # Extract numeric part
                parts = inv.invoice_number.split('-')
                if len(parts) >= 3:
                    numeric_part = int(parts[-1])
                else:
                    numeric_part = None
            except (ValueError, IndexError):
                numeric_part = None
            
            invoice_list.append({
                'complaint': inv,
                'invoice_number': inv.invoice_number,
                'numeric_part': numeric_part
            })
        
        # Sort by numeric part
        invoice_list.sort(key=lambda x: x['numeric_part'] or 0)
        
        self.stdout.write(self.style.SUCCESS(f'\nFound {len(invoice_list)} invoices for year {year}'))
        
        if not invoice_list:
            self.stdout.write(self.style.WARNING('No invoices found to fix.'))
            return
        
        # Show current state
        self.stdout.write(self.style.SUCCESS('\nCurrent invoice numbers (before fix):'))
        for item in invoice_list:
            self.stdout.write(f'  {item["invoice_number"]}')
        
        # Find issues
        issues = []
        expected_num = 1
        for item in invoice_list:
            if item['numeric_part'] != expected_num:
                issues.append({
                    'old': item['invoice_number'],
                    'new': f"INV-{year}-{expected_num}",
                    'complaint': item['complaint']
                })
            expected_num += 1
        
        if not issues:
            self.stdout.write(self.style.SUCCESS('\n✓ No numbering issues found! Invoice sequence is correct.'))
            return
        
        self.stdout.write(self.style.WARNING(f'\n⚠ Found {len(issues)} numbering issues:'))
        for issue in issues:
            self.stdout.write(f'  {issue["old"]} -> {issue["new"]}')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('\n⚠ DRY RUN - No changes made'))
            return
        
        # Apply fixes
        self.stdout.write(self.style.SUCCESS('\nApplying fixes...'))
        for issue in issues:
            complaint = issue['complaint']
            old_number = issue['old']
            new_number = issue['new']
            
            # Update complaint
            complaint.invoice_number = new_number
            complaint.save()
            
            self.stdout.write(self.style.SUCCESS(f'  ✓ Updated: {old_number} -> {new_number}'))
        
        self.stdout.write(self.style.SUCCESS('\n' + '=' * 60))
        self.stdout.write(self.style.SUCCESS('FIX COMPLETE'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        
        # Verify fix
        self.stdout.write(self.style.SUCCESS('\nVerifying fixes...'))
        all_invoices_fixed = BookServiceComplaint.objects(
            invoice_number__startswith=f"INV-{year}-"
        )
        
        invoice_list_fixed = []
        for inv in all_invoices_fixed:
            try:
                parts = inv.invoice_number.split('-')
                if len(parts) >= 3:
                    numeric_part = int(parts[-1])
                else:
                    numeric_part = None
            except (ValueError, IndexError):
                numeric_part = None
            
            invoice_list_fixed.append({
                'invoice_number': inv.invoice_number,
                'numeric_part': numeric_part
            })
        
        invoice_list_fixed.sort(key=lambda x: x['numeric_part'] or 0)
        
        self.stdout.write(self.style.SUCCESS('\nFixed invoice numbers:'))
        for item in invoice_list_fixed:
            self.stdout.write(f'  {item["invoice_number"]}')
        
        # Check for duplicates
        numbers = [item['invoice_number'] for item in invoice_list_fixed]
        duplicates = set([n for n in numbers if numbers.count(n) > 1])
        
        if duplicates:
            self.stdout.write(self.style.WARNING(f'\n⚠ Warning: Duplicate invoice numbers still exist: {duplicates}'))
        else:
            self.stdout.write(self.style.SUCCESS('\n✓ No duplicate invoice numbers!'))
        
        # Check for gaps
        expected = set(range(1, len(numbers) + 1))
        actual = set(item['numeric_part'] for item in invoice_list_fixed if item['numeric_part'])
        gaps = expected - actual
        
        if gaps:
            self.stdout.write(self.style.WARNING(f'⚠ Warning: Gaps in invoice sequence: {sorted(gaps)}'))
        else:
            self.stdout.write(self.style.SUCCESS('✓ No gaps in invoice sequence!'))


def get_next_invoice_number():
    """
    Get the next correct invoice number to use.
    This function should be called by the invoice generation logic instead of the buggy logic.
    """
    current_year = datetime.now().year
    
    # Get all invoices for current year
    all_invoices = BookServiceComplaint.objects(
        invoice_number__startswith=f"INV-{current_year}-"
    )
    
    # Find max numeric part using proper numeric sorting
    max_num = 0
    for inv in all_invoices:
        try:
            parts = inv.invoice_number.split('-')
            if len(parts) >= 3:
                num = int(parts[-1])
                if num > max_num:
                    max_num = num
        except (ValueError, IndexError):
            pass
    
    next_num = max_num + 1
    return f"INV-{current_year}-{next_num}"
