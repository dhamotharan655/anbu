"""
Django management command to fix total_amount = grand_total in database.
This fixes the mismatch between total_amount and grand_total fields.
"""
from django.core.management.base import BaseCommand
from user.models import BookServiceComplaint, PaymentDetails


class Command(BaseCommand):
    help = 'Fix total_amount to match grand_total in database'

    def handle(self, *args, **options):
        self.stdout.write('Starting database fix...')
        
        # Step 1: Fix BookServiceComplaint
        self.fix_book_service_complaints()
        
        # Step 2: Fix PaymentDetails
        self.fix_payment_details()
        
        self.stdout.write(self.style.SUCCESS('Database fix completed!'))
    
    def fix_book_service_complaints(self):
        """Fix total_amount in BookServiceComplaint collection"""
        self.stdout.write('Fixing BookServiceComplaint records...')
        
        # Get all complaints with grand_total set
        complaints = BookServiceComplaint.objects(grand_total__ne=None)
        
        fixed_count = 0
        for complaint in complaints:
            # Only fix if grand_total has a valid value
            if complaint.grand_total and complaint.grand_total > 0:
                # Check if total_amount needs fixing
                needs_fix = False
                
                if complaint.total_amount is None:
                    needs_fix = True
                elif complaint.total_amount != complaint.grand_total:
                    needs_fix = True
                
                if needs_fix:
                    old_total = complaint.total_amount
                    complaint.total_amount = complaint.grand_total
                    complaint.save()
                    fixed_count += 1
                    self.stdout.write(f'  Fixed complaint {complaint.complaint_no}: {old_total} -> {complaint.grand_total}')
        
        self.stdout.write(self.style.SUCCESS(f'Fixed {fixed_count} BookServiceComplaint records'))
    
    def fix_payment_details(self):
        """Check PaymentDetails collection - no fix needed as it only has total_amount"""
        self.stdout.write('Checking PaymentDetails records...')
        
        payments = PaymentDetails.objects.all()
        
        self.stdout.write(f'  Found {payments.count()} PaymentDetails records')
        self.stdout.write(self.style.SUCCESS('PaymentDetails check completed - no fix needed'))
