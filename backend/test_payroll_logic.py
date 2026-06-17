from mongoengine import connect
from user.models import Staff, BookServiceComplaint
import os
import sys
from datetime import datetime

# Add backend to path
sys.path.append('backend')

connect('ruban_electricals', host='mongodb://localhost:27017/ruban_electricals')

staff_name = 'DHAMOTHARAN N'
month = 4
year = 2026

month_start = datetime(year, month, 1)
month_end = datetime(year, month + 1, 1)

completed_bookings = BookServiceComplaint.objects(
    staff_name=staff_name,
    status='completed',
    assigned_completed_at__gte=month_start,
    assigned_completed_at__lt=month_end
)

print(f"--- Completed Bookings for {staff_name} in {month}/{year} ---")
total_incentives = 0
for b in completed_bookings:
    inc = getattr(b, 'staff_incentive', 0) or 0
    print(f"No: {b.complaint_no}, Incentive: {inc}, Completed At: {b.assigned_completed_at}")
    total_incentives += float(inc)

print(f"\nTotal Incentives: {total_incentives}")
