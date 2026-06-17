"""
Invoice Generation Module

This module provides a clean, stable invoice generation function that:
1. Fetches complaint data by complaint_id
2. Handles products, motor_sales, and labour charges
3. Generates a properly formatted PDF invoice

Usage:
    from user.invoice_generator import generate_invoice_pdf
    
    result = generate_invoice_pdf(complaint, request)
    # Returns dict with invoice_number, pdf_url, pdf_path
"""

from user.time_utils import get_ist_now
import os
import re
import json
from datetime import datetime
from django.conf import settings


def parse_numeric_value(value):
    """
    Parse a numeric value from various formats:
    - Pure number: 5.0
    - String with ₹: "₹500" or "₹500.00"
    - String with discount format: "5.0 (₹85)" - extracts just the percentage
    - Returns float or 0 if invalid
    """
    if value is None or value == '':
        return 0
    
    if isinstance(value, (int, float)):
        return float(value)
    
    if isinstance(value, str):
        # Try to extract the percentage from format like "5.0 (₹85)"
        # Match patterns like "5.0 (₹85)" or "5%" or "₹500"
        
        # First try to extract just the number before any ₹ or % symbols
        match = re.match(r'^([\d.]+)', value.strip())
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                pass
        
        # Try to extract number from string with ₹ symbol
        match = re.search(r'([\d.]+)', value)
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                pass
        
        return 0
    
    return 0


def number_to_words(n):
    """Convert number to words"""
    if n == 0:
        return "Zero"
    
    units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
             "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
             "Seventeen", "Eighteen", "Nineteen"]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
    
    def _convert(num):
        if num < 20:
            return units[num]
        elif num < 100:
            return tens[num // 10] + (" " + units[num % 10] if num % 10 else "")
        elif num < 1000:
            return units[num // 100] + " Hundred" + (" " + _convert(num % 100) if num % 100 else "")
        elif num < 100000:
            return _convert(num // 1000) + " Thousand" + (" " + _convert(num % 1000) if num % 1000 else "")
        elif num < 10000000:
            return _convert(num // 100000) + " Lakh" + (" " + _convert(num % 100000) if num % 100000 else "")
        else:
            return _convert(num // 10000000) + " Crore" + (" " + _convert(num % 10000000) if num % 10000000 else "")
    
    return _convert(int(n))


def parse_products_for_invoice(product_field, quantity_field=None, default_price=0, StockItem=None):
    """Parse product field and return list of dicts with name, qty, price, discount, final_price"""
    from .models import calculate_discounted_price
    
    if not product_field:
        return []
    
    try:
        parsed = json.loads(product_field) if isinstance(product_field, str) else product_field
        
        if isinstance(parsed, list):
            result = []
            for p in parsed:
                product_name = p.get('productName') or p.get('name') or p.get('product_name', '')
                motor_brand = p.get('motor_brand') or p.get('brand')
                quantity = int(p.get('quantity') or p.get('qty') or 1)
                
                # Get selling_price and buying_price from product or StockItem
                # Use parse_numeric_value to handle strings like "₹500" or "5.0 (₹85)"
                selling_price = parse_numeric_value(p.get('selling_price'))
                buying_price = parse_numeric_value(p.get('buying_price'))
                # Handle both camelCase and snake_case for discount_percent
                discount_percent = parse_numeric_value(p.get('discount_percent') or p.get('discountPercent') or p.get('discount'))
                
                # ⭐ CRITICAL: If product has final_price stored, use it directly
                # This ensures complaint-specific pricing is used
                # Use parse_numeric_value to handle strings like "₹500" or "5.0 (₹85)"
                final_price_from_product = parse_numeric_value(p.get('final_price'))
                
                # Look up price from StockItem ONLY if not provided in product
                if product_name and StockItem:
                    stock_item = StockItem.objects(name=product_name).first()
                    if stock_item:
                        if not selling_price:
                            selling_price = float(stock_item.selling_price) if stock_item.selling_price else 0
                        if not buying_price:
                            buying_price = float(stock_item.buying_price) if stock_item.buying_price else 0
                
                # Calculate final price with discount - allow discount without buying_price
                # Use stored final_price if available, otherwise calculate
                if final_price_from_product > 0:
                    final_price = final_price_from_product
                else:
                    final_price = selling_price
                    if discount_percent > 0 and selling_price > 0:
                        # Calculate discount based on selling price
                        discount_amount = (selling_price * discount_percent) / 100
                        final_price = selling_price - discount_amount
                
                # If no price from StockItem, use default
                if selling_price == 0 and default_price > 0:
                    selling_price = default_price / len(parsed)
                    final_price = selling_price
                
                result.append({
                    'name': product_name,
                    'motor_brand': motor_brand,
                    'quantity': quantity,
                    'selling_price': selling_price,
                    'buying_price': buying_price,
                    'discount_percent': discount_percent,
                    'final_price': final_price
                })
            return result
    except:
        pass
    
    # Return single product
    product_name = str(product_field) if product_field else ''
    quantity = int(quantity_field) if quantity_field else 1
    
    # Look up price from StockItem
    selling_price = 0
    buying_price = 0
    if product_name and StockItem:
        stock_item = StockItem.objects(name=product_name).first()
        if stock_item:
            selling_price = float(stock_item.selling_price) if stock_item.selling_price else 0
            buying_price = float(stock_item.buying_price) if stock_item.buying_price else 0
    
    # If still no price, use default
    if selling_price == 0 and default_price > 0:
        selling_price = default_price
    
    return [{'name': product_name, 'quantity': quantity, 'selling_price': selling_price, 'buying_price': buying_price, 'discount_percent': 0, 'final_price': selling_price}]


def generate_invoice_pdf(complaint, request=None):
    """
    Generate invoice PDF for a completed complaint
    
    Args:
        complaint: BookServiceComplaint object
        request: Django request object (optional)
    
    Returns:
        dict with keys: invoice_number, pdf_url, pdf_path
    """
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
    from reportlab.lib.units import inch
    
    # Import models
    from user.models import StockItem

    # Get amounts for calculation - with error handling
    try:
        client_amount = float(complaint.client_amount or 0)
    except (ValueError, TypeError):
        client_amount = 0
    
    try:
        amount_field = float(complaint.amount or 0)
    except (ValueError, TypeError):
        amount_field = 0
    
    # ⭐ NEW: Define labour_charges for the items table
    labour_charges = client_amount
    
    # Parse main products
    try:
        all_products = parse_products_for_invoice(
            complaint.product_name, 
            complaint.product_quantity, 
            client_amount,
            StockItem
        ) or []
    except Exception as e:
        print(f"Error parsing main products: {str(e)}")
        all_products = []
    
    # Parse additional products
    try:
        additional_prods = parse_products_for_invoice(
            complaint.additional_product, 
            complaint.additional_product_quantity, 
            amount_field,
            StockItem
        ) or []
        all_products.extend(additional_prods)
    except Exception as e:
        print(f"Error parsing additional products: {str(e)}")
    
    job_type = getattr(complaint, 'job_type', None)
    
    # For motor service jobs, the motor string is the item being serviced, not a purchased product
    if job_type in ['motor_service', 'motor_rewinding']:
        all_products = [p for p in all_products if not p.get('name', '').lower().startswith('motor:')]

    # ==================== END MOTOR HANDLING ====================
    
    # Calculate products total (with discount) for the items table subtotal
    products_total = sum(parse_numeric_value(prod.get('final_price', prod.get('price', 0))) * prod.get('quantity', 1) for prod in all_products)

    # ⭐ CRITICAL: Use the model's centralized calculation logic
    try:
        grand_total = complaint.calculate_grand_total()
    except Exception as e:
        print(f"Error calling calculate_grand_total in invoice generator: {e}")
        grand_total = products_total + client_amount
    
    # Update the stored grand_total in the database if it's different
    if complaint.grand_total != grand_total:
        complaint.grand_total = grand_total
        complaint.save()
    
    # Generate invoice number
    from user.invoice_utils import get_next_invoice_number
    invoice_number = get_next_invoice_number()
    year = get_ist_now().year
    
    # Create invoices directory if not exists
    invoices_dir = os.path.join(settings.MEDIA_ROOT, 'invoices')
    os.makedirs(invoices_dir, exist_ok=True)
    
    # Generate PDF filename
    invoice_num_for_file = invoice_number.split('-')[-1]
    pdf_filename = f"Invoice_INV-{year}-{invoice_num_for_file}.pdf"
    pdf_path = os.path.join(invoices_dir, pdf_filename)
    
    # Generate PDF URL
    request_host = request.get_host() if request else 'localhost:8000'
    pdf_url = f"https://{request_host}{settings.MEDIA_URL}invoices/{pdf_filename}"
    
    # Build invoice items data
    items_data = []
    try:
        # Ensure all_products is a list
        if not all_products:
            all_products = []
        
        for prod in all_products:
            if not prod:
                continue
            prod_name = prod.get('name', '') or 'Unknown Product'
            motor_brand = prod.get('motor_brand')
            if motor_brand:
                # If brand is already in name (for motor_sale jobs handled specially), don't duplicate
                if motor_brand.lower() not in prod_name.lower():
                    prod_name = f"{prod_name} ({motor_brand})"
            prod_qty = int(prod.get('quantity', 1) or 1)
            # Use final_price (with discount) for calculation, but show selling_price
            # Use parse_numeric_value to handle strings like "₹500" or "5.0 (₹85)"
            prod_selling_price = parse_numeric_value(prod.get('selling_price', prod.get('price', 0)))
            prod_final_price = parse_numeric_value(prod.get('final_price')) or prod_selling_price
            prod_discount = parse_numeric_value(prod.get('discount_percent', 0))
            # Line total should be based on final_price
            line_total = prod_final_price * prod_qty
            
            # Calculate discount amount in rupees
            discount_amount = 0
            if prod_discount > 0:
                discount_amount = prod_selling_price - prod_final_price
            
            # Format discount column to show both percentage and amount
            discount_display = f"{prod_discount}%"
            if discount_amount > 0:
                discount_display = f"{prod_discount}% (₹{discount_amount:.0f})"
            
            items_data.append([
                str(len(items_data) + 1),
                prod_name,
                "9987",  # HSN/SAC code
                f"{prod_selling_price:.2f}",  # Show selling price
                str(prod_qty),
                discount_display,  # Show discount percentage and amount
                f"{line_total:.2f}"   # Amount based on final price
            ])
    except Exception as e:
        print(f"Error building items_data: {str(e)}")
        # Continue with empty items if error
        items_data = []
    
    # If no items, add placeholder
    if len(items_data) == 0:
        items_data.append(["1", "Service", "9987", "0.00", "1", "0%", "0.00"])
    
    # Create PDF document with consistent width
    # A4 width is 8.27 inches = 595 points
    # With 0.5 inch margins (72 points each), usable width = 7.27 inches = ~523 points
    # We'll use 7.5 inches = 540 points for consistency
    usable_width = 7.5 * inch
    
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=0.3*inch,
        rightMargin=0.3*inch,
        topMargin=0.3*inch,
        bottomMargin=0.3*inch
    )
    elements = []

    # Styles
    styles = getSampleStyleSheet()

    normal_style = ParagraphStyle(
        'NormalCustom', parent=styles['Normal'],
        fontSize=8, leading=11, textColor=colors.black
    )
    bold_style = ParagraphStyle(
        'BoldCustom', parent=styles['Normal'],
        fontSize=8, leading=11, fontName='Helvetica-Bold', textColor=colors.black
    )
    small_style = ParagraphStyle(
        'SmallCustom', parent=styles['Normal'],
        fontSize=7, leading=9, textColor=colors.black
    )
    center_bold = ParagraphStyle(
        'CenterBold', parent=styles['Normal'],
        fontSize=8, leading=11, fontName='Helvetica-Bold',
        alignment=1, textColor=colors.black
    )
    right_style = ParagraphStyle(
        'RightCustom', parent=styles['Normal'],
        fontSize=8, leading=11, alignment=2, textColor=colors.black
    )
    footer_style = ParagraphStyle(
        'Footer', parent=styles['Normal'],
        fontSize=7, alignment=1, textColor=colors.black
    )

    BORDER_COLOR = colors.HexColor('#333333')  # Dark gray for clean, professional look
    THIN = 1  # Consistent border thickness for all tables
    
    # Define consistent column widths
    # Total width: 7.5 inches = 540 points
    # Header: 2fr (3.75 inch) | 1fr (3.75 inch) = 7.5 inch total
    # Customer/Bank: 1fr (3.75 inch) | 1fr (3.75 inch) = 7.5 inch total
    # Items: SlNo 8% | Desc 35% | HSN 12% | UnitCost 12% | Qty 8% | Disc 8% | Amount 17%
    #       = 0.6" | 2.625" | 0.9" | 0.9" | 0.6" | 0.6" | 1.275" = 7.545" ≈ 7.5"
    
    half_width = 3.75 * inch
    header_col_widths = [half_width, half_width]  # 2 columns, equal width
    customer_bank_col_widths = [half_width, half_width]  # 2 columns, equal width
    
    # Items table column widths - proportional to match total width
    item_col_widths = [
        0.6 * inch,    # Sl.No - 8%
        2.625 * inch,  # Description - 35%
        0.9 * inch,    # HSN/SAC - 12%
        0.9 * inch,    # Unit Cost - 12%
        0.6 * inch,    # Qty - 8%
        0.6 * inch,    # Disc - 8%
        1.275 * inch   # Amount - 17%
    ]
    
    full_width = [7.5 * inch]  # Full width for single column sections

    # ==================== ROW 1: HEADER - Two Equal Columns ====================
    # Left Column: Company Logo + Info
    logo_path = os.path.join(settings.MEDIA_ROOT, 'anbu_logo.png')
    if os.path.exists(logo_path):
        try:
            logo_cell = Image(logo_path, width=1.2*inch, height=0.9*inch)
        except Exception:
            logo_cell = Paragraph('', normal_style)
    else:
        logo_cell = Paragraph('', normal_style)

    complaint_no_display = complaint.complaint_no or "N/A"
    invoice_date = get_ist_now().strftime('%d-%m-%Y')
    staff_name = complaint.staff_name or "N/A"

    # Left column content
    left_col_content = [
        [logo_cell],
        [Paragraph("<b>ANBU ENTERPRISES</b>", bold_style)],
        [Paragraph("Office-Phone: +91 9876543210", normal_style)],
        [Paragraph("Land-Line: 044 2345 6789", normal_style)],
        [Paragraph("Address: No 12, Main Road, Chennai", normal_style)],
        [Paragraph("Email: contact@anbuenterprises.com", normal_style)],
    ]
    left_col_table = Table(left_col_content, colWidths=[half_width])
    left_col_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
    ]))

    # Right column content - Estimate details
    right_col_content = [
        [Paragraph(f"<b>Estimate No.</b>  {invoice_number}", normal_style)],
        [Paragraph(f"<b>Date:</b>  {invoice_date}", normal_style)],
        [Paragraph(f"<b>Anbu Employee:</b>  {staff_name}", normal_style)],
        [Paragraph("<b>Purpose:</b>  Service", normal_style)],
    ]
    right_col_table = Table(right_col_content, colWidths=[half_width])
    right_col_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
    ]))

    # Header row with two equal columns
    header_row = Table(
        [[left_col_table, right_col_table]],
        colWidths=header_col_widths
    )
    header_row.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), THIN, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), THIN, BORDER_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(header_row)

    # ==================== ROW 2: CUSTOMER INFO | BANK DETAILS ====================
    customer_name = complaint.customer_name or "N/A"
    customer_phone = complaint.phone or "N/A"
    customer_address = complaint.address or "N/A"

    # Left column - Customer Address
    customer_cell_content = [
        [Paragraph("<b>Customer Address</b>", bold_style)],
        [Paragraph(customer_name, normal_style)],
        [Paragraph(customer_address, normal_style)],
        [Paragraph(f"<b>Mobile:</b>  {customer_phone}", normal_style)],
    ]
    customer_cell_table = Table(customer_cell_content, colWidths=[half_width])
    customer_cell_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
    ]))

    # Right column - Bank Details
    bank_cell_content = [
        [Paragraph("<b>Company Bank Details</b>", bold_style)],
        [Paragraph("Name: Anbu Enterprises", normal_style)],
        [Paragraph("Bank: HDFC Bank", normal_style)],
        [Paragraph("Branch: Anna Nagar Branch", normal_style)],
        [Paragraph("Acc No: 50100234567890", normal_style)],
        [Paragraph("IFSC Code: HDFC0001234", normal_style)],
    ]
    bank_cell_table = Table(bank_cell_content, colWidths=[half_width])
    bank_cell_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
    ]))

    # Customer/Bank row with two equal columns
    customer_bank_row = Table(
        [[customer_cell_table, bank_cell_table]],
        colWidths=customer_bank_col_widths
    )
    customer_bank_row.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), THIN, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), THIN, BORDER_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(customer_bank_row)
    elements.append(Spacer(1, 4))

    # ==================== ITEMS TABLE ====================
    # Full width table matching container width
    table_header = [
        Paragraph('<b>Sl.No.</b>', center_bold),
        Paragraph('<b>Description of Goods</b>', center_bold),
        Paragraph('<b>HSN/SAC</b>', center_bold),
        Paragraph('<b>Unit Cost</b>', center_bold),
        Paragraph('<b>Qty</b>', center_bold),
        Paragraph('<b>Disc.</b>', center_bold),
        Paragraph('<b>Amount</b>', center_bold),
    ]

    # Build item rows from items_data
    item_rows = []
    for row in items_data:
        item_rows.append([
            Paragraph(str(row[0]), normal_style),
            Paragraph(str(row[1]), normal_style),
            Paragraph(str(row[2]), normal_style),
            Paragraph(str(row[3]), right_style),
            Paragraph(str(row[4]), center_bold),
            Paragraph(str(row[5]), right_style),
            Paragraph(str(row[6]), right_style),
        ])

    # Total row (products total)
    n_item_rows = len(item_rows)
    total_discount = sum(
        parse_numeric_value(row[5]) for row in items_data
    )
    total_row = [
        Paragraph('', normal_style),
        Paragraph('<b>Total</b>', center_bold),
        Paragraph('', normal_style),
        Paragraph(f'{products_total:.2f}', right_style),
        Paragraph(f'{sum(parse_numeric_value(r[4]) for r in items_data):.0f}', right_style) if items_data else Paragraph('0', right_style),
        Paragraph(f'{total_discount:.2f}%', right_style),
        Paragraph(f'{products_total:.2f}', right_style),
    ]

    # Labour charges row
    labour_row = [
        Paragraph('', normal_style),
        Paragraph('', normal_style),
        Paragraph('', normal_style),
        Paragraph('', normal_style),
        Paragraph('LABOUR CHARGES', normal_style),
        Paragraph('', normal_style),
        Paragraph(f'{labour_charges:.2f}', right_style),
    ]

    # Grand total row
    grand_row = [
        Paragraph('', normal_style),
        Paragraph('', normal_style),
        Paragraph('', normal_style),
        Paragraph('', normal_style),
        Paragraph('', normal_style),
        Paragraph('<b>Grand Total</b>', bold_style),
        Paragraph(f'<b>{grand_total:.2f}</b>', right_style),
    ]

    all_rows = [table_header] + item_rows + [total_row, labour_row, grand_row]

    items_table = Table(all_rows, colWidths=item_col_widths, repeatRows=1)
    items_table.setStyle(TableStyle([
        # Header
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e8e8e8')),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#333333')),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 2),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2),
        # Total row light bg
        ('BACKGROUND', (0, 1 + n_item_rows), (-1, 1 + n_item_rows), colors.HexColor('#f5f5f5')),
        # Grand total bold bg
        ('BACKGROUND', (0, 3 + n_item_rows), (-1, 3 + n_item_rows), colors.HexColor('#e0e0e0')),
        ('FONTNAME', (5, 3 + n_item_rows), (6, 3 + n_item_rows), 'Helvetica-Bold'),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 3))

    # ==================== AMOUNT IN WORDS ====================
    amount_in_words = number_to_words(int(grand_total))
    words_table = Table([
        [Paragraph(f'<b>Amount in words:</b>  Rs. {amount_in_words} Only', normal_style)],
    ], colWidths=full_width)
    words_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), THIN, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(words_table)
    elements.append(Spacer(1, 2))

    # ==================== NOTE ====================
    note_table = Table([
        [Paragraph('<b>Note:</b> <i>if you have any clarification please contact - 9994390097</i>', normal_style)],
    ], colWidths=full_width)
    note_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), THIN, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(note_table)

    # ==================== TERMS & CONDITIONS ====================
    terms_table = Table([
        [Paragraph('<b>Terms & Conditions</b>', bold_style)],
        [Paragraph('1. Payment to be made within 15 days of invoice date.', small_style)],
        [Paragraph('2. Warranty does not cover physical damage or burnouts.', small_style)],
        [Paragraph('3. All disputes subject to Chennai jurisdiction.', small_style)],
    ], colWidths=full_width)
    terms_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), THIN, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(terms_table)

    # ==================== SIGNATURE ROW ====================
    sig_row = Table([
        [
            Paragraph('<b>Customer Signature</b>', bold_style),
            Paragraph('<b>Authorised Signatory</b>', bold_style),
        ],
        [
            Paragraph('', normal_style),
            Paragraph('', normal_style),
        ],
    ], colWidths=[half_width, half_width])
    sig_row.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), THIN, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), THIN, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(sig_row)
    elements.append(Spacer(1, 4))

    # ==================== FOOTER ====================
    footer_table = Table([
        [Paragraph('This is computer generated invoice. No signature required.', footer_style)],
    ], colWidths=full_width)
    footer_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), THIN, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(footer_table)

    # Build PDF
    doc.build(elements)

    return {
        'invoice_number': invoice_number,
        'pdf_url': pdf_url,
        'pdf_path': pdf_path,
        'grand_total': grand_total
    }


