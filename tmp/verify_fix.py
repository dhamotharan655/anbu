import os
import sys
import django
from mongoengine import connect

# Setup path and environment
sys.path.append('c:/Users/jyoth/Desktop/ruban_final1.1/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from user.models import BookServiceComplaint

def verify_fix():
    # Connect to MongoDB
    from mongoengine import disconnect
    disconnect()
    connect('water_purifier_db', host='localhost', port=27017)
    
    print("\nChecking some recent complaints:")
    for c in BookServiceComplaint.objects.order_by('-created_at')[:10]:
        print(f"  No: {c.complaint_no} | initial={getattr(c, 'is_initial', 'MISSING')} | Staff={c.staff_name} | Product={c.product_name}")
        
    print("\nTotal Complaints: ", BookServiceComplaint.objects.count())
    
    # Check for is_initial complaints
    initial_count = BookServiceComplaint.objects(is_initial=True).count()
    print(f"Total initial (placeholder) complaints: {initial_count}")
    
    # Check for complaints where is_initial is False
    false_count = BookServiceComplaint.objects(is_initial=False).count()
    print(f"Total complaints where is_initial is False: {false_count}")
    
    # Check for complaints where is_initial is None or missing
    missing_count = BookServiceComplaint.objects(is_initial=None).count()
    print(f"Total complaints where is_initial is None: {missing_count}")
    
    # Check for real complaints using the filter I added to the view
    real_count = BookServiceComplaint.objects(is_initial__ne=True).count()
    print(f"Total real complaints (is_initial__ne=True): {real_count}")
    
    from user.views import get_pending_whatsapp_messages
    from rest_framework.test import APIRequestFactory
    
    factory = APIRequestFactory()
    request = factory.get('/pending-whatsapp-messages/')
    
    response = get_pending_whatsapp_messages(request)
    data = response.data
    
    print(f"\nAPI Response:")
    print(f"  Success: {data.get('success')}")
    print(f"  Count: {data.get('count')}")
    
    if data.get('complaints'):
        print("\nFirst 3 complaints in response:")
        for c in data['complaints'][:3]:
            print(f"  No: {c.get('complaint_no')} | is_initial: {c.get('is_initial')}")

if __name__ == "__main__":
    verify_fix()
