
import os
import sys
import django
import json
from datetime import datetime

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Mongoengine doesn't need django.setup() usually but if there are django models involved it might
from mongoengine import connect
connect('water_db', host='mongodb://localhost:27017/water_db') # Assuming default local mongo

from user.models import BookServiceComplaint, MotorDetails

def test_grand_total_calculation():
    print("Testing Grand Total Calculation Fix...")
    
    # 1. Create a mock complaint that is a motor_sale
    complaint_no = "TEST-COMP-FIX-1"
    
    # Cleanup if exists
    BookServiceComplaint.objects(complaint_no=complaint_no).delete()
    MotorDetails.objects(complaint_id=complaint_no).delete()
    
    # Product in booking list (contains "motor")
    product_name = json.dumps([
        {"productName": "Motor Crompton 0.5HP", "quantity": 1, "selling_price": 3000, "discount_percent": 3}
    ])
    
    complaint = BookServiceComplaint(
        complaint_no=complaint_no,
        customer_name="Test User",
        phone="1234567890",
        address="Test Address",
        job_type="motor_sale",
        product_name=product_name,
        client_amount=300,
        customer_type='external_customer'
    )
    complaint.save()
    
    # Create corresponding MotorDetails record (which should be the primary source of motor price)
    # motor_total = 3000 - 3% = 2910
    motor = MotorDetails(
        complaint_id=complaint_no,
        job_type="motor_sale",
        motor_amount=3000,
        discount_percent=3,
        company_name="Test Corp",
        serial_no="SN12345",
        motor_make="Crompton"
    )
    motor.save()
    
    # Recalculate grand total
    grand_total = complaint.calculate_grand_total()
    
    # Expected: 
    # booking_total: 0 (since it contains "motor" and job_type is "motor_sale")
    # additional_total: 0
    # client_amount: 300
    # motor_total: 3000 - 3% = 2910
    # TOTAL: 2910 + 300 = 3210
    
    print(f"Calculated Grand Total: {grand_total}")
    print(f"Expected Grand Total: 3210.0")
    
    if grand_total == 3210.0:
        print("✅ SUCCESS: Grand Total calculation is correct (no double counting).")
    elif grand_total == 3210.0 + 2910.0:
        print("❌ FAILURE: Motor is still being double counted!")
    else:
        print(f"❌ FAILURE: Unexpected total {grand_total}")

    # Cleanup
    # BookServiceComplaint.objects(complaint_no=complaint_no).delete()
    # MotorDetails.objects(complaint_id=complaint_no).delete()

if __name__ == "__main__":
    try:
        test_grand_total_calculation()
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error during verification: {e}")
