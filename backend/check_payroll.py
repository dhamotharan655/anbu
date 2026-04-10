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

# Check each staff for March 2026
for staff in Staff.objects.all():
    staff_id = str(staff.id)
    attendances = StaffAttendance.objects(staff_id=staff_id, date__gte=datetime(2026, 3, 1), date__lt=datetime(2026, 4, 1))
    
    present_days = 0
    half_days = 0
    leave_days = 0
    absent_days = 0
    
    for att in attendances:
        status = str(att.status).strip() if att.status else 'Absent'
        att_type = str(getattr(att, 'attendance_type', 'absent') or 'absent').lower().strip()
        work_type = str(getattr(att, 'work_type', 'full_day') or 'full_day').lower().strip()
        
        if status == 'Present':
            if att_type == 'leave':
                leave_days += 1
            elif work_type == 'half_day':
                half_days += 1
            else:
                present_days += 1
        elif status == 'Absent':
            absent_days += 1
        else:
            absent_days += 1
    
    print(f"=== {staff.name} ===")
    print(f"Present: {present_days}, Half Day: {half_days}, Leave: {leave_days}, Absent: {absent_days}")
    print(f"Total: {present_days + half_days + leave_days + absent_days}")
