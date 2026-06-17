from mongoengine import connect
from user.models import Staff, BookServiceComplaint
import os
import sys

# Add backend to path
sys.path.append('backend')

connect('ruban_electricals', host='mongodb://localhost:27017/ruban_electricals')

print("--- Updating Complaint #WP-COMP-5 with Incentive 50 ---")
c = BookServiceComplaint.objects(complaint_no='#WP-COMP-5').first()
if c:
    c.staff_incentive = 50.0
    c.save()
    print("Saved.")
else:
    print("Complaint not found.")

print("\n--- Verifying Persistence ---")
c = BookServiceComplaint.objects(complaint_no='#WP-COMP-5').first()
if c:
    print(f"No: {c.complaint_no}, Incentive: {getattr(c, 'staff_incentive', 'N/A')}")
