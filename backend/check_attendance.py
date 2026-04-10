#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from user.models import StaffAttendance, Staff
from datetime import datetime

print("=== Staff List ===")
staff_list = Staff.objects.all()
for s in staff_list:
    print(f"ID: {s.id}, Name: {s.name}")

print("\n=== Attendance Records ===")
records = StaffAttendance.objects.limit(10)
for r in records:
    print(f"Staff: {r.staff_name}, Date: {r.date}, Status: {r.status}, Type: {r.attendance_type}, Work: {r.work_type}")

# Check dates
all_records = StaffAttendance.objects.all()
dates = [r.date for r in all_records if r.date]
if dates:
    print(f"\nDate range: {min(dates)} to {max(dates)}")

# Check March 2026
print("\n=== March 2026 Attendance ===")
for s in staff_list:
    staff_id = str(s.id)
    march_att = StaffAttendance.objects(staff_id=staff_id, date__gte=datetime(2026, 3, 1), date__lt=datetime(2026, 4, 1))
    print(f"{s.name}: {march_att.count()} records")
