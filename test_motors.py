import os
import sys
import django
sys.path.append('C:/Users/jyoth/Desktop/ruban_final1.1/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from user.models import BookServiceComplaint, MotorDetails
from datetime import datetime, timedelta

# Get the last 5 complaints
recent_complaints = list(BookServiceComplaint.objects.order_by('-created_at')[:5])
print('--- Recent Complaints ---')
for c in recent_complaints:
    print(f"Complaint: {c.complaint_no}, Job Type: {getattr(c, 'job_type', None)}, Job Category: {getattr(c, 'job_category', None)}")

# Get the last 5 motors
recent_motors = list(MotorDetails.objects.order_by('-created_at')[:5])
print('\n--- Recent Motors ---')
for m in recent_motors:
    print(f"Motor: Complaint ID: {m.complaint_id}, Serial: {m.serial_no}, Company: {m.company_name}")

