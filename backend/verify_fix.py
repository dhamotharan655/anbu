
import os
import django
import sys
from bson import ObjectId

# Setup Django
sys.path.append(r'c:\Users\jyoth\Downloads\ruban_final\ruban_final3\ruban_final1.1\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from user.models import BookServiceComplaint, ClientDetails

def simulate_api():
    print("Simulating get_product_purchase_history fix...")
    try:
        completed_bookings = BookServiceComplaint.objects(
            status="completed"
        ).order_by('-date_created').limit(200)
        
        data = []
        for booking in completed_bookings:
            has_products = False
            if booking.product_name and booking.product_name != "[]":
                has_products = True
            elif booking.additional_product and booking.additional_product != "[]":
                has_products = True
                
            if has_products:
                customer_name = booking.customer_name or "Unknown"
                if booking.customer_id:
                    try:
                        customer = ClientDetails.objects(customer_id=booking.customer_id).first()
                        if customer:
                            customer_name = customer.customer_name
                    except:
                        pass
                
                booking_data = {
                    "complaint_no": booking.complaint_no,
                    "customer_name": customer_name,
                    "has_booked": bool(booking.product_name and booking.product_name != "[]"),
                    "has_additional": bool(booking.additional_product and booking.additional_product != "[]"),
                }
                data.append(booking_data)
        
        print(f"Total results: {len(data)}")
        for d in data:
            print(f"Record: {d}")
            
    except Exception as e:
        print(f"Fixed logic FAILED: {e}")

if __name__ == "__main__":
    simulate_api()
