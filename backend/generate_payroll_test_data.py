import os
import django
import calendar
from datetime import datetime, timedelta, time

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from user.models import Staff, StaffAttendance, HolidayCalendar, StaffPayroll
from user.utils.attendance_utils import resolve_attendance

def generate_test_data():
    print("--- Starting Structured Test Data Generation ---")
    
    # 1. SELECT MONTH (Previous Month dynamically)
    today = datetime.today()
    first_day_this_month = today.replace(day=1)
    last_month_date = first_day_this_month - timedelta(days=1)
    
    month = last_month_date.month
    year = last_month_date.year
    print(f"Target Month: {month}/{year}")

    # 2. FETCH STAFF
    staff_list = Staff.objects(is_active=True)
    if not staff_list:
        print("No active staff found. Please create some staff first.")
        return
    print(f"Found {staff_list.count()} active staff members.")

    # 3. CREATE HOLIDAY DATA
    # 10th - Paid Holiday
    h10_date = datetime(year, month, 10)
    if not HolidayCalendar.objects(date=h10_date, staff_id=None).first():
        HolidayCalendar(
            date=h10_date,
            name="Structured Paid Holiday (10th)",
            type="company_holiday",
            is_paid=True
        ).save()
        print(f"Created Paid Holiday: {h10_date.date()}")
    
    # 11th - Unpaid Holiday
    h11_date = datetime(year, month, 11)
    if not HolidayCalendar.objects(date=h11_date, staff_id=None).first():
        HolidayCalendar(
            date=h11_date,
            name="Structured Unpaid Holiday (11th)",
            type="company_holiday",
            is_paid=False
        ).save()
        print(f"Created Unpaid Holiday: {h11_date.date()}")

    # 12th - Override Target (Make it a holiday first)
    h12_date = datetime(year, month, 12)
    if not HolidayCalendar.objects(date=h12_date, staff_id=None).first():
        HolidayCalendar(
            date=h12_date,
            name="Override Target Holiday (12th)",
            type="company_holiday",
            is_paid=True
        ).save()
        print(f"Created Holiday for Override Test: {h12_date.date()}")

    # 4. AUTO WEEKLY OFF (SUNDAYS)
    days_in_month = calendar.monthrange(year, month)[1]
    sundays = []
    for day in range(1, days_in_month + 1):
        dt = datetime(year, month, day)
        if dt.strftime("%A") == "Sunday":
            sundays.append(dt)
    
    for i, sun_date in enumerate(sundays, 1):
        # Override one Sunday (e.g., the 3rd one) to be unpaid
        is_paid = (i != 3)
        if not HolidayCalendar.objects(date=sun_date, staff_id=None).first():
            HolidayCalendar(
                date=sun_date,
                name=f"Weekly Off (Week {i})",
                type="weekly_off",
                is_paid=is_paid,
                is_auto=True
            ).save()
            print(f"Created {'Paid' if is_paid else 'Unpaid'} Weekly Off: {sun_date.date()}")

    # Unpaid Weekly Off test specifically for Day 21 (as requested for "no attendance" test)
    # If 21st is not a Sunday, we force it as a weekly off for this test.
    h21_date = datetime(year, month, 21)
    if not HolidayCalendar.objects(date=h21_date, staff_id=None).first():
        HolidayCalendar(
            date=h21_date,
            name="Test Unpaid Weekly Off (21st)",
            type="weekly_off",
            is_paid=False,
            is_auto=False
        ).save()
        print(f"Created Unpaid Weekly Off for Day 21: {h21_date.date()}")

    # 5. CREATE ATTENDANCE DATA
    admin_user = "TestSystem"
    
    for staff in staff_list:
        print(f"Creating records for {staff.name}...")
        for day in range(1, days_in_month + 1):
            curr_date = datetime(year, month, day)
            
            # 7. DATA SAFETY - Skip if record exists
            if StaffAttendance.objects(staff_id=str(staff.id), date=curr_date).first():
                continue

            # IF day 21: no attendance (test unpaid weekly off)
            if day == 21:
                continue

            # Default values
            status = 'Present'
            attendance_type = 'present'
            work_type = 'full_day'
            salary_multiplier = 1.0

            # Conditions based on TASK
            if 1 <= day <= 5:
                # Full present (defaults)
                pass
            elif day == 6:
                work_type = 'half_day'
            elif day == 7:
                attendance_type = 'leave'
            elif day == 9:
                status = 'Absent'
                attendance_type = 'absent'
            elif day == 12:
                # Present (override holiday)
                salary_multiplier = 1.0 # Logic in calculate_payroll will make it 2.0 if holiday
            elif 13 <= day <= 15:
                salary_multiplier = 1.5
            else:
                # normal present
                pass

            # 6. ATTENDANCE STRUCTURE
            StaffAttendance(
                staff_id=str(staff.id),
                staff_name=staff.name,
                date=curr_date,
                status=status,
                attendance_type=attendance_type,
                work_type=work_type,
                salary_multiplier=salary_multiplier,
                marked_by=admin_user,
                marked_at=datetime.utcnow()
            ).save()
            
        print(f"Finished {staff.name}")

    print("--- Data Creation Completed ---")

    # 8. VALIDATION (Sample check for first staff)
    print("\n--- Running Validation ---")
    test_staff = staff_list[0]
    print(f"Validating for Staff: {test_staff.name}")
    
    # Check specific days
    days_to_verify = [6, 7, 9, 12, 14, 21]
    for d in days_to_verify:
        check_date = datetime(year, month, d)
        res = resolve_attendance(str(test_staff.id), check_date)
        print(f"Day {d:02d} ({check_date.strftime('%A')}): Status={res.get('status')}, Type={res.get('attendance_type')}, Multiplier={res.get('salary_multiplier')}, Source={res.get('source')}")

    print("\n[SUCCESS] Test data is ready. You can now visit the Payroll tab to calculate and verify totals.")

if __name__ == "__main__":
    generate_test_data()
