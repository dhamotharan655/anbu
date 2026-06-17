
import os
import django
import sys
from bson import ObjectId

# Setup Django
sys.path.append(r'c:\Users\jyoth\Downloads\ruban_final\ruban_final3\ruban_final1.1\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from user.models import BookServiceComplaint

def check_complaints():
    print("Checking BookServiceComplaint records...")
    completed = BookServiceComplaint.objects(status="completed")
    print(f"Total completed: {completed.count()}")
    
    for c in completed.limit(5):
        print(f"ID: {c.complaint_no}, Status: {c.status}, Job Category: {c.job_category}, Product: {c.product_name[:50] if c.product_name else 'None'}")
        # Check if it has created_at
        try:
            print(f"  created_at: {getattr(c, 'created_at', 'MISSING')}")
            print(f"  date_created: {getattr(c, 'date_created', 'MISSING')}")
        except:
            print("  Error accessing fields")

    # Check search criteria
    filtered = BookServiceComplaint.objects(
        status="completed",
        job_category__ne="motor_service",
        job_type__ne="motor_service"
    )
    print(f"Filtered count (excluding motor_service): {filtered.count()}")

if __name__ == "__main__":
    check_complaints()
