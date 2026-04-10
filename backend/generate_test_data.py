import os
import django
from datetime import datetime, timedelta
import calendar

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from user.models import Staff, StaffAttendance, HolidayCalendar

def generate_test_data():
    print("--- Starting Test Data Generation ---")
    
    # 1. Determine Previous Month
    today = datetime.today()
    first_day_this_month = today.replace(day=1)
    last_month_date = first_day_this_month - timedelta(days=1)
    
    month = last_month_date.month
    year = last_month_date.year
    print(f"Target Month: {month}/{year}")

    # 2. Fetch Active Staff
    staff_list = Staff.objects(is_active=True)
    if not staff_list:
        print("No active staff found. Exiting.")
        return
    print(f"Found {staff_list.count()} active staff members.")

    # 3. Create Holiday Data
    h10_date = datetime(year, month, 10)
    if not HolidayCalendar.objects(date=h10_date, staff_id=None).first():
        HolidayCalendar(
            date=h10_date,
            name="Test Paid Holiday (10th)",
            type="company_holiday",
            is_paid=True,
            is_auto=False
        ).save()
        print(f"Created Paid Holiday for {h10_date.date()}")
    else:
        print(f"Paid Holiday for {h10_date.date()} already exists. Skipping.")

    h11_date = datetime(year, month, 11)
    if not HolidayCalendar.objects(date=h11_date, staff_id=None).first():
        HolidayCalendar(
            date=h11_date,
            name="Test Unpaid Holiday (11th)",
            type="company_holiday",
            is_paid=False,
            is_auto=False
        ).save()
        print(f"Created Unpaid Holiday for {h11_date.date()}")
    else:
        print(f"Unpaid Holiday for {h11_date.date()} already exists. Skipping.")

    # 4. Create Weekly Offs (Sundays)
    days_in_month = calendar.monthrange(year, month)[1]
    sundays = []
    for day in range(1, days_in_month + 1):
        dt = datetime(year, month, day)
        if dt.strftime("%A") == "Sunday":
            sundays.append(dt)
    
    for i, sun_date in enumerate(sundays, 1):
        # Make the 3rd Sunday unpaid to test logic
        is_paid = (i != 3) 
        if not HolidayCalendar.objects(date=sun_date, staff_id=None).first():
            HolidayCalendar(
                date=sun_date,
                name=f"Sunday Off (Week {i})",
                type="weekly_off",
                is_paid=is_paid,
                is_auto=True
            ).save()
            print(f"Created {'Paid' if is_paid else 'Unpaid'} Weekly Off for {sun_date.date()}")
        else:
            print(f"Weekly Off for {sun_date.date()} already exists. Skipping.")

    # 5. Create Attendance Data
    for staff in staff_list:
        print(f"Generating attendance for: {staff.name}")
        for day in range(1, days_in_month + 1):
            curr_date = datetime(year, month, day)
            
            # Skip if record exists
            if StaffAttendance.objects(staff_id=str(staff.id), date=curr_date).first():
                continue

            # Skip creating record for Day 21 (To test unscheduled/unpaid behavior)
            if day == 21:
                continue

            # Default attributes
            status = 'Present'
            attn_type = 'present'
            work_type = 'full_day'
            multiplier = 1.0

            # Conditions
            if 1 <= day <= 5:
                pass # Default Present
            elif day == 6:
                work_type = 'half_day'
            elif day == 7:
                attn_type = 'leave' # Paid Leave test
            elif day == 9:
                status = 'Absent'
                attn_type = 'absent'
            elif day == 12:
                pass # Present override on holiday (12th is normal, but let's assume special)
            elif 13 <= day <= 15:
                multiplier = 1.5
            
            # Create Record
            StaffAttendance(
                staff_id=str(staff.id),
                staff_name=staff.name,
                date=curr_date,
                status=status,
                attendance_type=attn_type,
                work_type=work_type,
                salary_multiplier=multiplier,
                marked_by="SystemTest",
                marked_at=datetime.utcnow()
            ).save()
            
        print(f"Finished generating attendance for {staff.name}")

    print("--- Test Data Generation Completed ---")

if __name__ == "__main__":
    generate_test_data()
