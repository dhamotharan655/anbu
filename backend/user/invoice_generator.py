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


def generate_invoice_pdf(complaint, request=None, is_estimation=False):
    """
    Generate invoice PDF or Estimation PDF for a completed complaint
    
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
    if getattr(complaint, 'invoice_number', None):
        invoice_number = complaint.invoice_number
    else:
        from user.invoice_utils import get_next_invoice_number
        invoice_number = get_next_invoice_number()
    year = get_ist_now().year
    
    # Create invoices directory if not exists
    invoices_dir = os.path.join(settings.MEDIA_ROOT, 'invoices')
    os.makedirs(invoices_dir, exist_ok=True)
    
    # Generate PDF filename
    invoice_num_for_file = invoice_number.split('-')[-1]
    if is_estimation:
        pdf_filename = f"Estimation_EST-{year}-{invoice_num_for_file}.pdf"
    else:
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
    # Usable width = 535 points (with 30 points / ~0.42 inch margins)
    usable_width = 535
    
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=30,
        rightMargin=30,
        topMargin=30,
        bottomMargin=30
    )
    elements = []

    # Styles
    styles = getSampleStyleSheet()

    normal_style = ParagraphStyle(
        'NormalCustom', parent=styles['Normal'],
        fontSize=9, leading=12, textColor=colors.HexColor('#1f2937')
    )
    bold_style = ParagraphStyle(
        'BoldCustom', parent=styles['Normal'],
        fontSize=9, leading=12, fontName='Helvetica-Bold', textColor=colors.black
    )
    right_style = ParagraphStyle(
        'RightCustom', parent=styles['Normal'],
        fontSize=9, leading=12, alignment=2, textColor=colors.HexColor('#1f2937')
    )
    right_bold = ParagraphStyle(
        'RightBold', parent=styles['Normal'],
        fontSize=9, leading=12, alignment=2, fontName='Helvetica-Bold', textColor=colors.black
    )
    center_style = ParagraphStyle(
        'CenterCustom', parent=styles['Normal'],
        fontSize=9, leading=12, alignment=1, textColor=colors.HexColor('#1f2937')
    )
    center_bold = ParagraphStyle(
        'CenterBold', parent=styles['Normal'],
        fontSize=9, leading=12, alignment=1, fontName='Helvetica-Bold', textColor=colors.black
    )
    center_white = ParagraphStyle(
        'CenterWhite', parent=styles['Normal'],
        fontSize=9, leading=12, alignment=1, fontName='Helvetica-Bold', textColor=colors.white
    )

    PRIMARY_COLOR = colors.HexColor('#7983d9') # Clean Purple/Indigo color matching the pattern
    
    half_width = usable_width / 2.0  # 267.5 pt
    
    # ==================== ROW 1: HEADER (Left: Info, Right: Logo) ====================
    logo_path = os.path.join(settings.MEDIA_ROOT, 'image.png')
    if os.path.exists(logo_path):
        try:
            # Render logo at premium dimensions (approx 1.1 in x 0.65 in)
            logo_cell = Image(logo_path, width=1.1*inch, height=0.65*inch)
        except Exception:
            logo_cell = Paragraph('', normal_style)
    else:
        logo_cell = Paragraph('', normal_style)

    # Load dynamic company settings
    from .models import SiteSettings, Branch
    site_settings = SiteSettings.objects().first()
    
    comp_name = getattr(site_settings, 'company_name', '') or "Anbu Enterprises"
    comp_email = getattr(site_settings, 'company_email', '') or "contact@anbuenterprises.com"
    b_name = getattr(site_settings, 'bank_name', '') or "HDFC Bank"
    b_branch = getattr(site_settings, 'bank_branch', '') or "Anna Nagar Branch"
    b_acc_no = getattr(site_settings, 'bank_acc_no', '') or "50100234567890"
    b_ifsc = getattr(site_settings, 'bank_ifsc', '') or "HDFC0001234"
    c_upi = getattr(site_settings, 'company_upi', '') or "anbu@okaxis"
    c_gpay = getattr(site_settings, 'company_gpay', '') or "+91 9876543210"
    
    # Try to resolve address and phone number from the branch stored on the job
    branch_obj = None
    if getattr(complaint, 'branch_name', None):
        branch_obj = Branch.objects(name=complaint.branch_name).first()
        
    if branch_obj:
        comp_address = branch_obj.location or getattr(site_settings, 'company_address', '') or "No 12, Main Road, Chennai"
        comp_phone = branch_obj.contact_number or getattr(site_settings, 'company_phone', '') or "+91 9876543210"
        comp_landline = branch_obj.whatsapp_number or getattr(site_settings, 'company_landline', '') or "044 2345 6789"
    else:
        comp_address = getattr(site_settings, 'company_address', '') or "No 12, Main Road, Chennai"
        comp_phone = getattr(site_settings, 'company_phone', '') or "+91 9876543210"
        comp_landline = getattr(site_settings, 'company_landline', '') or "044 2345 6789"

    complaint_no_display = complaint.complaint_no or "N/A"
    invoice_date = get_ist_now().strftime('%d-%m-%Y')
    staff_name = complaint.staff_name or "N/A"

    # Support multiline addresses (e.g. branch/head offices) separated by newlines or semicolons
    comp_address_html = comp_address.replace('\n', '<br/>').replace(';', '<br/>')

    header_left = [
        Paragraph(f"<font size=14><b>{comp_name.upper()}</b></font>", bold_style),
        Spacer(1, 4),
        Paragraph(comp_address_html, normal_style),
        Paragraph(f"Phone no.: {comp_phone}", normal_style),
        Paragraph(f"Email: {comp_email}", normal_style),
        Paragraph("State: 33-Tamil Nadu", normal_style),
    ]

    header_table = Table([[header_left, logo_cell]], colWidths=[380, 155])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(header_table)

    # Indigo line separator
    divider_table = Table([['']], colWidths=[usable_width])
    divider_table.setStyle(TableStyle([
        ('LINEBELOW', (0, 0), (-1, -1), 1.5, PRIMARY_COLOR),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(divider_table)
    elements.append(Spacer(1, 10))

    # Center-aligned Tax Invoice or Estimation Title
    title_text = "Estimation" if is_estimation else "Tax Invoice"
    title_style = ParagraphStyle(
        'InvoiceTitle', parent=styles['Normal'],
        fontSize=16, leading=20, fontName='Helvetica-Bold',
        alignment=1, textColor=PRIMARY_COLOR
    )
    elements.append(Paragraph(title_text, title_style))
    elements.append(Spacer(1, 12))

    # ==================== ROW 2: BILL TO & DETAILS ====================
    customer_name = complaint.customer_name or "N/A"
    customer_phone = complaint.phone or "N/A"
    customer_address = complaint.address or "N/A"
    
    # Split invoice number to show final numeric part cleanly
    invoice_num_for_file = invoice_number.split('-')[-1]

    bill_to_content = [
        Paragraph("<font color='#6b7280'><b>Bill To</b></font>", normal_style),
        Spacer(1, 3),
        Paragraph(f"<b>{customer_name}</b>", bold_style),
        Paragraph(f"{customer_address}", normal_style),
    ]

    details_title = "Estimation Details" if is_estimation else "Invoice Details"
    details_no_label = "Estimation No." if is_estimation else "Invoice No."

    invoice_details_content = [
        Paragraph(f"<font color='#6b7280'><b>{details_title}</b></font>", right_style),
        Spacer(1, 3),
        Paragraph(f"{details_no_label}: {invoice_num_for_file}", right_style),
        Paragraph(f"Date: {invoice_date}", right_style),
    ]

    details_table = Table([[bill_to_content, invoice_details_content]], colWidths=[290, 245])
    details_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(details_table)

    # ==================== ITEMS TABLE ====================
    # 6 columns matching the pattern: #, Item Name, HSN/ SAC, Quantity, Price/ Unit, Amount
    item_col_widths = [
        30,    # Sl No (#)
        265,   # Item Name
        60,    # HSN/SAC
        50,    # Quantity
        65,    # Price / Unit
        65     # Amount
    ]

    all_rows = []
    # Table Header Row
    all_rows.append([
        Paragraph('<b>#</b>', center_white),
        Paragraph('<b>Item Name</b>', center_white),
        Paragraph('<b>HSN/ SAC</b>', center_white),
        Paragraph('<b>Quantity</b>', center_white),
        Paragraph('<b>Price/ Unit</b>', center_white),
        Paragraph('<b>Amount</b>', center_white),
    ])

    # Table Item Rows
    total_qty = 0
    for idx, row in enumerate(items_data):
        qty = int(row[4])
        price_unit = float(row[6]) / qty if qty > 0 else 0.0
        amount = float(row[6])
        total_qty += qty

        all_rows.append([
            Paragraph(str(idx + 1), normal_style),
            Paragraph(str(row[1]), bold_style), # Bold product name
            Paragraph(str(row[2]), center_style),
            Paragraph(str(qty), center_style),
            Paragraph(f"Rs. {price_unit:,.2f}", right_style),
            Paragraph(f"Rs. {amount:,.2f}", right_style),
        ])

    # Add Labour charges row if applicable
    if labour_charges > 0:
        all_rows.append([
            Paragraph(str(len(items_data) + 1), normal_style),
            Paragraph('<b>Labour & Service Charges</b>', bold_style),
            Paragraph('9987', center_style),
            Paragraph('1', center_style),
            Paragraph(f"Rs. {labour_charges:,.2f}", right_style),
            Paragraph(f"Rs. {labour_charges:,.2f}", right_style),
        ])
        total_qty += 1

    # Total row
    all_rows.append([
        Paragraph('', normal_style),
        Paragraph('<b>Total</b>', bold_style),
        Paragraph('', normal_style),
        Paragraph(f'<b>{total_qty}</b>', center_bold),
        Paragraph('', normal_style),
        Paragraph(f'<b>Rs. {grand_total:,.2f}</b>', right_bold),
    ])

    items_table = Table(all_rows, colWidths=item_col_widths, repeatRows=1)
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        # Horizontal lines below rows
        ('LINEBELOW', (0, 0), (-1, -2), 0.5, colors.HexColor('#e0e0e0')),
        # Total row highlighted lines
        ('LINEABOVE', (0, -1), (-1, -1), 1, PRIMARY_COLOR),
        ('LINEBELOW', (0, -1), (-1, -1), 1, PRIMARY_COLOR),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 15))

    # ==================== MIDDLE SECTION: AMOUNT IN WORDS & CALCULATIONS CARD ====================
    amount_in_words = number_to_words(int(grand_total))
    amount_in_words_sentence = f"{amount_in_words} Rupees only"

    sub_total_val = grand_total
    total_val = grand_total
    
    received_val = getattr(complaint, 'amount_received', None)
    if received_val is None:
        received_val = grand_total if complaint.status == 'completed' else 0.0
    balance_val = total_val - received_val
    if balance_val < 0:
        balance_val = 0.0

    # Clean financial summary card
    summary_data = [
        [Paragraph("Sub Total", normal_style), Paragraph(f"Rs. {sub_total_val:,.2f}", right_style)],
        [Paragraph("<font color='white'><b>Total</b></font>", bold_style), Paragraph(f"<font color='white'><b>Rs. {total_val:,.2f}</b></font>", right_bold)],
        [Paragraph("Received", normal_style), Paragraph(f"Rs. {received_val:,.2f}", right_style)],
        [Paragraph("<b>Balance</b>", bold_style), Paragraph(f"<b>Rs. {balance_val:,.2f}</b>", right_bold)],
    ]
    summary_table = Table(summary_data, colWidths=[100, 100])
    summary_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#e0e0e0')),
        ('BACKGROUND', (0, 1), (-1, 1), PRIMARY_COLOR), # Highlights total row in indigo background
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor('#e0e0e0')),
    ]))

    left_summary_content = [
        Paragraph("<font color='#6b7280'><b>Invoice Amount In Words</b></font>", normal_style),
        Spacer(1, 3),
        Paragraph(f"<b>{amount_in_words_sentence}</b>", bold_style),
        Spacer(1, 15),
        Paragraph("<font color='#6b7280'><b>Terms And Conditions</b></font>", normal_style),
        Spacer(1, 3),
        Paragraph("Thank you for doing business with us.", normal_style),
    ]

    middle_table = Table([[left_summary_content, summary_table]], colWidths=[315, 220])
    middle_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
    ]))
    elements.append(middle_table)

    # ==================== FOOTER SECTION: PAY TO & SIGNATURE BLOCK ====================
    pay_to_content = [
        Paragraph("<b>Pay To:</b>", bold_style),
        Spacer(1, 4),
        Paragraph(f"Bank Name: {b_name}, {b_branch}", normal_style),
        Paragraph(f"Bank Account No.: {b_acc_no}", normal_style),
        Paragraph(f"Bank IFSC code: {b_ifsc}", normal_style),
        Paragraph(f"Account Holder's Name: {comp_name.upper()}", normal_style),
    ]

    sig_content = [
        Paragraph(f"For: {comp_name.upper()}", right_bold),
        Spacer(1, 35),
        Paragraph("Authorized Signatory", right_style),
    ]

    footer_table = Table([[pay_to_content, sig_content]], colWidths=[320, 215])
    footer_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
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


