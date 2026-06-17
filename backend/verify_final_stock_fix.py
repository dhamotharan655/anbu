import os
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from user.models import StockItem, BookServiceComplaint, StockHistory, MotorVariant
from user.views import process_stock_reduction_for_complaint

def verify_stock_fix():
    print("--- STARTING FINAL STOCK VERIFICATION ---")
    
    # 1. Setup Test Data
    # Ensure "cctv " exists with spaces
    cctv_item = StockItem.objects(name__icontains="cctv").first()
    if not cctv_item:
        print("[SETUP] Creating CCTV stock item...")
        cctv_item = StockItem(
            stock_id="VERIFY_CCTV",
            name="cctv  ", # Two spaces
            quantity=10,
            category="Electronic",
            is_motor=False
        ).save()
    else:
        cctv_item.quantity = 10
        cctv_item.save()
        
    motor_item = StockItem.objects(is_motor=True).first()
    if not motor_item:
        print("[SETUP] Creating Motor stock item...")
        motor_item = StockItem(
            stock_id="VERIFY_MOTOR",
            name="Motor",
            quantity=10,
            is_motor=True
        ).save()
    else:
        motor_item.quantity = 10
        motor_item.save()

    # Create variant for motor if needed
    variant = MotorVariant.objects(product=motor_item, brand="Siemens").first()
    if not variant:
        variant = MotorVariant(product=motor_item, brand="Siemens", count=5).save()
    else:
        variant.count = 5
        variant.save()
    
    # Reload motor to sync total qty
    motor_item.reload()
    motor_item.save() # Triggers recalc
    
    print(f"[SETUP] Initial CCTV Qty: {cctv_item.quantity}")
    print(f"[SETUP] Initial Motor Qty: {motor_item.quantity}")

    # 2. Create Mock Complaint with Initial (Motor) and Additional (CCTV)
    complaint_no = f"#VERIFY-FINAL-{os.urandom(2).hex()}"
    
    # Initial motor
    initial_product = json.dumps([{
        "productName": "Motor",
        "quantity": 1,
        "brand": "Siemens"
    }])
    
    # Additional CCTV
    additional_product = json.dumps([{
        "productName": "cctv ", # One space mismatch
        "quantity": 2
    }])
    
    complaint = BookServiceComplaint(
        complaint_no=complaint_no,
        customer_name="Test User",
        phone="1234567890",
        address="Test Address",
        status="completed",
        product_name=initial_product,
        additional_product=additional_product,
        stock_reduced=False
    ).save()
    
    print(f"[RUN] Processing reduction for {complaint_no}...")
    process_stock_reduction_for_complaint(complaint)
    
    # 3. Verify Results
    cctv_item.reload()
    motor_item.reload()
    variant.reload()
    
    print(f"[VERIFY] New CCTV Qty: {cctv_item.quantity} (Expected: 8)")
    print(f"[VERIFY] New Motor Total Qty: {motor_item.quantity} (Expected: {10-1})")
    print(f"[VERIFY] New Motor Variant Qty: {variant.count} (Expected: 4)")
    
    history = StockHistory.objects(complaint_no=complaint_no)
    print(f"[VERIFY] History Records Found: {len(history)}")
    for h in history:
        print(f"  - {h.stock_name}: {h.operation_type} {h.quantity} (Source: {h.source})")
        
    if cctv_item.quantity == 8 and motor_item.quantity == 9 and len(history) >= 2:
        print("--- VERIFICATION SUCCESSFUL! ---")
    else:
        print("--- VERIFICATION FAILED! ---")

if __name__ == "__main__":
    verify_stock_fix()
