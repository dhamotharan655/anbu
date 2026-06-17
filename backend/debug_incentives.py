from mongoengine import connect
from user.models import Staff, BookServiceComplaint
import os
import sys

# Add backend to path
sys.path.append('backend')

connect('ruban_electricals', host='mongodb://localhost:27017/ruban_electricals')

print("--- Staff List ---")
for s in Staff.objects():
    print(f"Name: '{s.name}'")

print("\n--- Recent Completed Complaints ---")
for c in BookServiceComplaint.objects(status='completed')[:10]:
    print(f"No: {c.complaint_no}, Staff: '{c.staff_name}', Incentive: {getattr(c, 'staff_incentive', 'N/A')}, Completed At: {c.assigned_completed_at}")
