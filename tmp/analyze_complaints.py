import os
import django
from mongoengine import connect

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
# In case it's not and we need to point to the backend directory
import sys
sys.path.append('c:/Users/jyoth/Desktop/ruban_final1.1/backend')

# Import models
from user.models import BookServiceComplaint

def analyze_complaints():
    # Connect if not already connected
    try:
        connect('water_purifier_db', host='localhost', port=27017)
    except:
        pass

    completed = BookServiceComplaint.objects(status="completed")
    print(f"Total completed bookings: {completed.count()}")
    
    with_products = BookServiceComplaint.objects(status="completed", __raw__={"$or": [{"product_name": {"$ne": None, "$ne": ""}}, {"additional_product": {"$ne": None, "$ne": ""}}]})
    print(f"Completed with products: {with_products.count()}")
    
    services = with_products.filter(job_category="motor_service")
    print(f"Completed with products AND job_category=motor_service: {services.count()}")
    
    sales = with_products.filter(job_category="motor_sale")
    print(f"Completed with products AND job_category=motor_sale: {sales.count()}")
    
    others = with_products.filter(job_category__nin=["motor_service", "motor_sale"])
    print(f"Completed with products AND other job_category: {others.count()}")
    
    for booking in services[:5]:
        print(f"\nExample Service:")
        print(f"  No: {booking.complaint_no}")
        print(f"  Product: {booking.product_name}")
        print(f"  Additional: {booking.additional_product}")
        print(f"  Job Category: {booking.job_category}")
        print(f"  Job Type: {getattr(booking, 'job_type', 'N/A')}")

if __name__ == "__main__":
    analyze_complaints()
