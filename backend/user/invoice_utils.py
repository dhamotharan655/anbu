"""
Invoice Utility Functions

This module provides utility functions for proper invoice number generation.
It fixes the issue with alphabetical sorting vs numeric sorting.

The Problem:
    order_by('-invoice_number') in MongoDB sorts strings alphabetically, not numerically.
    Example: "INV-2026-10" comes before "INV-2026-2" in string order (because '1' < '2')
    
The Solution:
    Use numeric extraction and sorting instead of string-based sorting.

Usage:
    from user.invoice_utils import get_next_invoice_number, fix_invoice_sequence
    
    # Get next invoice number for new invoices
    next_number = get_next_invoice_number()
    
    # Fix existing invoice sequence in database
    fix_invoice_sequence()
"""

from user.time_utils import get_ist_now
from user.models import BookServiceComplaint
from datetime import datetime


def extract_numeric_part(invoice_str):
    """
    Extract numeric part from invoice number for proper sorting.
    Handles both formats: INV-2026-1 and INV-2026-0001
    
    Args:
        invoice_str: Invoice number string (e.g., "INV-2026-1" or "INV-2026-001")
    
    Returns:
        int: The numeric part of the invoice number, or None if invalid
    """
    if not invoice_str:
        return None
    try:
        # Extract the numeric part after the year
        parts = invoice_str.split('-')
        if len(parts) >= 3:
            return int(parts[-1])
    except (ValueError, IndexError):
        pass
    return None


def get_next_invoice_number(year=None):
    """
    Get the next correct invoice number to use.
    
    This function properly handles numeric sorting instead of string sorting,
    preventing duplicate invoice numbers and gaps in the sequence.
    
    Args:
        year: Year to generate invoice for (defaults to current year)
    
    Returns:
        str: The next invoice number in format "INV-YYYY-N"
    
    Example:
        >>> get_next_invoice_number()
        'INV-2026-9'
    """
    if year is None:
        year = get_ist_now().year
    
    # Get all invoices for current year
    all_invoices = BookServiceComplaint.objects(
        invoice_number__startswith=f"INV-{year}-"
    )
    
    # Find max numeric part using proper numeric sorting
    max_num = 0
    for inv in all_invoices:
        num = extract_numeric_part(inv.invoice_number)
        if num and num > max_num:
            max_num = num
    
    next_num = max_num + 1
    return f"INV-{year}-{next_num}"


def fix_invoice_sequence(year=None, dry_run=False):
    """
    Fix invoice numbering sequence in the database.
    
    This function identifies and fixes invoice numbers that are out of sequence
    due to the string-based sorting issue.
    
    Args:
        year: Year to fix invoices for (defaults to current year)
        dry_run: If True, only show what would be fixed without making changes
    
    Returns:
        dict: Summary of fixes applied
    
    Example:
        >>> result = fix_invoice_sequence()
        >>> print(result)
        {'fixed': 5, 'issues': [...], 'success': True}
    """
    if year is None:
        year = get_ist_now().year
    
    # Get all invoices for the year
    all_invoices = BookServiceComplaint.objects(
        invoice_number__startswith=f"INV-{year}-"
    )
    
    # Convert to list with numeric extraction
    invoice_list = []
    for inv in all_invoices:
        numeric_part = extract_numeric_part(inv.invoice_number)
        invoice_list.append({
            'complaint': inv,
            'invoice_number': inv.invoice_number,
            'pdf_url': inv.invoice_pdf_url,
            'numeric_part': numeric_part
        })
    
    # Sort by numeric part
    invoice_list.sort(key=lambda x: x['numeric_part'] or 0)
    
    if not invoice_list:
        return {
            'fixed': 0,
            'issues': [],
            'success': True,
            'message': 'No invoices found'
        }
    
    # Find issues
    issues = []
    expected_num = 1
    for item in invoice_list:
        if item['numeric_part'] != expected_num:
            new_number = f"INV-{year}-{expected_num}"
            issues.append({
                'old': item['invoice_number'],
                'new': new_number,
                'complaint': item['complaint']
            })
        expected_num += 1
    
    if not issues:
        return {
            'fixed': 0,
            'issues': [],
            'success': True,
            'message': 'No numbering issues found'
        }
    
    if dry_run:
        return {
            'fixed': len(issues),
            'issues': [{'old': i['old'], 'new': i['new']} for i in issues],
            'success': True,
            'message': f'Would fix {len(issues)} invoices (dry run)'
        }
    
    # Apply fixes
    fixed = 0
    for issue in issues:
        complaint = issue['complaint']
        old_number = issue['old']
        new_number = issue['new']
        
        # Update complaint
        complaint.invoice_number = new_number
        complaint.save()
        fixed += 1
    
    return {
        'fixed': fixed,
        'issues': [{'old': i['old'], 'new': i['new']} for i in issues],
        'success': True,
        'message': f'Fixed {fixed} invoices'
    }


def validate_invoice_sequence(year=None):
    """
    Validate invoice numbering sequence.
    
    Args:
        year: Year to validate invoices for (defaults to current year)
    
    Returns:
        dict: Validation results including duplicates, gaps, and other issues
    
    Example:
        >>> result = validate_invoice_sequence()
        >>> print(result)
        {'valid': True, 'duplicates': [], 'gaps': [], 'count': 8}
    """
    if year is None:
        year = get_ist_now().year
    
    # Get all invoices for the year
    all_invoices = BookServiceComplaint.objects(
        invoice_number__startswith=f"INV-{year}-"
    )
    
    invoice_list = []
    for inv in all_invoices:
        numeric_part = extract_numeric_part(inv.invoice_number)
        invoice_list.append({
            'invoice_number': inv.invoice_number,
            'numeric_part': numeric_part
        })
    
    # Sort by numeric part
    invoice_list.sort(key=lambda x: x['numeric_part'] or 0)
    
    # Check for duplicates
    numbers = [item['invoice_number'] for item in invoice_list]
    duplicates = set([n for n in numbers if numbers.count(n) > 1])
    
    # Check for gaps
    numeric_values = [item['numeric_part'] for item in invoice_list if item['numeric_part']]
    if numeric_values:
        expected = set(range(1, max(numeric_values) + 1))
        actual = set(numeric_values)
        gaps = expected - actual
    else:
        gaps = set()
    
    return {
        'valid': len(duplicates) == 0 and len(gaps) == 0,
        'duplicates': list(duplicates),
        'gaps': sorted(list(gaps)),
        'count': len(invoice_list),
        'invoices': [item['invoice_number'] for item in invoice_list]
    }
