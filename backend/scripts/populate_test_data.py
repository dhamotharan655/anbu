import os
import django
from datetime import datetime
import calendar

# Setup Django atmosphere
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from user.models import Staff, StaffAttendance, HolidayCalendar

def setup_test_data():
    print("Starting Payroll Test Data Generation...")

    # 1. Clean up old test data for April 2026
    test_month = 4
    test_year = 2026
    start_date = datetime(test_year, test_month, 1)
    end_date = datetime(test_year, test_month, 30)

    StaffAttendance.objects(date__gte=start_date, date__lte=end_date).delete()
    HolidayCalendar.objects(date__gte=start_date, date__lte=end_date).delete()

    # 2. Identify Staff
    staff_sam = Staff.objects(name='sam').first()
    staff_murali = Staff.objects(name='Murali').first()

    if not staff_sam or not staff_murali:
        print("Error: Could not find staff 'sam' or 'Murali'. Please ensure they exist.")
        return

    sam_id = str(staff_sam.id)
    murali_id = str(staff_murali.id)

    # 3. Create Holiday Calendar Entries
    print("Creating Holiday Calendar entries...")
    
    # Paid Holiday (Global)
    HolidayCalendar(
        date=datetime(2026, 4, 10),
        name="Tamil New Year",
        type="company_holiday",
        is_paid=True
    ).save()

    # Unpaid Holiday (Global)
    HolidayCalendar(
        date=datetime(2026, 4, 15),
        name="Experimental Unpaid Holiday",
        type="company_holiday",
        is_paid=False
    ).save()

    # 4. Populate Attendance for 'sam'
    print(f"Populating attendance for {staff_sam.name}...")
    
    # April 1: Present (Standard)
    StaffAttendance(staff_id=sam_id, staff_name=staff_sam.name, date=datetime(2026, 4, 1), status='Present', attendance_type='present', marked_by='System Test').save()
    
    # April 2: Half Day
    StaffAttendance(staff_id=sam_id, staff_name=staff_sam.name, date=datetime(2026, 4, 2), status='Present', attendance_type='present', work_type='half_day', marked_by='System Test').save()
    
    # April 3: Leave
    StaffAttendance(staff_id=sam_id, staff_name=staff_sam.name, date=datetime(2026, 4, 3), status='Present', attendance_type='leave', marked_by='System Test').save()
    
    # April 4: Absent (Manual)
    StaffAttendance(staff_id=sam_id, staff_name=staff_sam.name, date=datetime(2026, 4, 4), status='Absent', marked_by='System Test').save()

    # April 10 (Holiday): Worked with Multiplier!
    StaffAttendance(
        staff_id=sam_id, 
        staff_name=staff_sam.name, 
        date=datetime(2026, 4, 10), 
        status='Present', 
        attendance_type='present', 
        salary_multiplier=2.0,
        salary_multiplier_reason='Working on Holiday',
        marked_by='System Test'
    ).save()

    # Note: April 15 (Unpaid Holiday) will be auto-resolved by the engine.

    # 5. Populate Attendance for 'Murali'
    print(f"Populating attendance for {staff_murali.name}...")
    
    # April 1-5: Various states
    StaffAttendance(staff_id=murali_id, staff_name=staff_murali.name, date=datetime(2026, 4, 1), status='Present', attendance_type='present', marked_by='System Test').save()
    StaffAttendance(staff_id=murali_id, staff_name=staff_murali.name, date=datetime(2026, 4, 2), status='Present', attendance_type='present', marked_by='System Test').save()
    
    # April 3: Leave
    StaffAttendance(staff_id=murali_id, staff_name=staff_murali.name, date=datetime(2026, 4, 3), status='Present', attendance_type='leave', marked_by='System Test').save()
    
    # April 10 (Holiday): sam worked, Murali didn't (Should show as Paid Holiday)
    # No record needed, engine will handle it.

    # April 15 (Unpaid): Murali worked! (Should show as Present but with Unpaid background context)
    StaffAttendance(staff_id=murali_id, staff_name=staff_murali.name, date=datetime(2026, 4, 15), status='Present', attendance_type='present', marked_by='System Test').save()

    print("Test data generated successfully for April 2026!")
    print("Now go to the Payroll page, select April 2026, and click 'Calculate Payroll' to see the results.")

if __name__ == "__main__":
    setup_test_data()
