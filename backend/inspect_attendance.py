import os, sys, django, json
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from user.models import StaffAttendance, HolidayCalendar, Staff
from datetime import datetime

print('--- Staff ---')
for s in Staff.objects.all():
    print(s.name, s.weekly_off_days)

print('\n--- Attendance for April 2026 ---')
start = datetime(2026, 4, 1)
end = datetime(2026, 4, 30, 23, 59, 59)
for a in StaffAttendance.objects.filter(date__gte=start, date__lte=end):
    print(f"{a.staff_name}: {a.date.strftime('%Y-%m-%d')} | status={a.status} | attn_type={a.attendance_type} | multiplier={a.salary_multiplier} | reason={a.salary_multiplier_reason}")

print('\n--- Holidays for April 2026 ---')
for h in HolidayCalendar.objects.filter(date__gte=start, date__lte=end):
    print(f"{h.date.strftime('%Y-%m-%d')} | {h.name} | paid={h.is_paid} | staff={h.staff_id}")
