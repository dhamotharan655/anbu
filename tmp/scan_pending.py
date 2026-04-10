import os
import sys
import django
from mongoengine import connect

# Setup path and environment
sys.path.append(r'c:\Users\jyoth\Desktop\ruban_final1.1\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from user.models import BookServiceComplaint

def scan_pending():
    connect('water_purifier_db', host='localhost', port=27017)
    
    total = BookServiceComplaint.objects.count()
    pending_booking = BookServiceComplaint.objects(booking_whatsapp_sent__ne=True).count()
    
    print(f"Total Complaints: {total}")
    print(f"Complaints with booking_whatsapp_sent != True: {pending_booking}")
    
    if pending_booking > 0:
        print("\nExample Pending:")
        for c in BookServiceComplaint.objects(booking_whatsapp_sent__ne=True)[:3]:
             print(f"  No: {c.complaint_no} | initial={getattr(c, 'is_initial', False)} | assigned={c.assigned}")

if __name__ == "__main__":
    scan_pending()
