import os
import django
import json
from bson import ObjectId

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from user.models import StockItem, MotorVariant, BookServiceComplaint, StockHistory

def run_verification():
    print("--- Starting Verification of Stock Reduction on Completion ---")
    
    # 1. Setup Test Data
    # Create or get a test StockItem (Motor)
    test_motor_name = "Test Verification Motor"
    stock_item = StockItem.objects(name=test_motor_name).first()
    if not stock_item:
        stock_item = StockItem(
            name=test_motor_name,
            category="Motor",
            quantity=10,
            is_motor=True,
            unit="pcs"
        )
        stock_item.save()
    else:
        stock_item.quantity = 10
        stock_item.save()

    # Create a brand variant
    brand_name = "Siemens"
    variant = MotorVariant.objects(product=stock_item, brand=brand_name).first()
    if not variant:
        variant = MotorVariant(product=stock_item, brand=brand_name, count=10)
        variant.save()
    else:
        variant.count = 10
        variant.save()

    print(f"✅ Initial Stock: {stock_item.quantity}, Brand '{brand_name}' Count: {variant.count}")

    # 2. Create a Mock Complaint
    complaint_no = "VC-COMP-001"
    complaint = BookServiceComplaint.objects(complaint_no=complaint_no).first()
    if complaint:
        complaint.delete()
        
    product_json = json.dumps([{
        "productName": test_motor_name,
        "quantity": 2,
        "motor_brand": brand_name
    }])
    
    complaint = BookServiceComplaint(
        complaint_no=complaint_no,
        customer_name="Verification Guy",
        phone="1234567890",
        address="Test Lab",
        product_name=product_json,
        status="pending",
        stock_reduced=False
    )
    complaint.save()
    print(f"✅ Mock Complaint created: {complaint_no}")

    # 3. Simulate Backend Helper Call (Trigger Completion)
    from user.views import process_stock_reduction_for_complaint
    
    print("🔄 Setting status to 'completed' and calling reduction helper...")
    complaint.status = "completed"
    # Note: In real view, we'd save first or the helper would save.
    process_stock_reduction_for_complaint(complaint, request=None)

    # 4. Verify Results
    stock_item.reload()
    variant.reload()
    complaint.reload()
    
    print(f"📊 After Completion:")
    print(f" - Total Stock Quantity: {stock_item.quantity} (Expected: 8)")
    print(f" - Brand '{brand_name}' Count: {variant.count} (Expected: 8)")
    print(f" - Complaint stock_reduced: {complaint.stock_reduced} (Expected: True)")

    if stock_item.quantity == 8 and variant.count == 8 and complaint.stock_reduced == True:
        print("🎉 SUCCESS: Stock reduced correctly on completion.")
    else:
        print("❌ FAILURE: Stock reduction values inconsistent.")

    # 5. Verify Double Reduction Prevention
    print("🔄 Calling helper again to check for double reduction...")
    process_stock_reduction_for_complaint(complaint, request=None)
    
    stock_item.reload()
    print(f" - Total Stock Quantity after 2nd call: {stock_item.quantity} (Expected: 8)")
    
    if stock_item.quantity == 8:
        print("🎉 SUCCESS: Double reduction prevented.")
    else:
        print("❌ FAILURE: Double reduction occurred!")

    # 6. Check History
    history = StockHistory.objects(stock_id=str(stock_item.id)).order_by('-created_at')
    if len(history) > 0:
        latest = history[0]
        print(f"📜 Latest History: {latest.operation_type}, Brand: {latest.motor_brand}, Source: {getattr(latest, 'source', 'N/A')}")
    else:
        print("❌ FAILURE: No history recorded.")

if __name__ == "__main__":
    run_verification()
