import os
import sys
from datetime import datetime, timezone
from calendar import monthrange
import mongoengine

# Add backend to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Connect to MongoDB
mongoengine.connect(db="Ru", host="mongodb://localhost:27017/Ru")

from user.models import Staff, StaffAttendance, HolidayCalendar  # type: ignore

def generate_test_data():
    year = 2026
    month = 2
    days_in_month = monthrange(year, month)[1]
    
    admin_name = "test_script"
    
    # 2. Fetch active staff
    staff_list = list(Staff.objects.filter(is_active=True))
    if not staff_list:
        print("No active staff found.")
        return
        
    print(f"Found {len(staff_list)} active staff members.")
    
    # 3. Create Holiday Entries
    paid_holiday_date = datetime(year, month, 10, tzinfo=timezone.utc)
    if not HolidayCalendar.objects(date=paid_holiday_date, type="company_holiday").first():
        HolidayCalendar(date=paid_holiday_date, name="Test Paid Holiday", type="company_holiday", is_paid=True).save()
        print("Created Paid Holiday on Feb 10")
        
    unpaid_holiday_date = datetime(year, month, 18, tzinfo=timezone.utc)
    if not HolidayCalendar.objects(date=unpaid_holiday_date, type="company_holiday").first():
        HolidayCalendar(date=unpaid_holiday_date, name="Test Unpaid Holiday", type="company_holiday", is_paid=False).save()
        print("Created Unpaid Holiday on Feb 18")

    # 4. Ensure Weekly Off (Sundays)
    for day in range(1, days_in_month + 1):
        dt = datetime(year, month, day, tzinfo=timezone.utc)
        if dt.weekday() == 6:  # Sunday
            if not HolidayCalendar.objects(date=dt, type="weekly_off").first():
                HolidayCalendar(date=dt, name="Sunday Off", type="weekly_off", is_paid=True, is_auto=True).save()
                print(f"Created Weekly Off for {dt.strftime('%Y-%m-%d')}")

    total_records = 0
    records_per_staff = {}

    # 5. Generate Staff-wise Attendance
    for staff_index, staff in enumerate(staff_list):
        records_created = 0
        
        for day in range(1, days_in_month + 1):
            date = datetime(year, month, day, tzinfo=timezone.utc)
            
            # If attendance already exists, skip (Idempotence)
            if StaffAttendance.objects(staff_id=str(staff.id), date=date).first():
                continue
                
            attendance_kwargs = {
                "staff_id": str(staff.id),
                "staff_name": staff.name,
                "date": date,
                "marked_by": admin_name
            }
            create_record = False
            
            # OVERRIDING CONDITIONS FIRST
            
            # E. WEEK OFF HANDLING (SUNDAYS)
            if date.weekday() == 6:
                if staff_index % 2 == 0:
                    attendance_kwargs.update({
                        "status": "Present",
                        "attendance_type": "present",
                        "work_type": "full_day",
                        "is_override": True,
                        "salary_multiplier": 2,
                        "override_reason": "Worked on weekly off"
                    })
                    create_record = True
                    
            # F. PAID HOLIDAY (Feb 10)
            elif day == 10:
                if staff_index % 3 == 0:
                    attendance_kwargs.update({
                        "status": "Present",
                        "attendance_type": "present",
                        "work_type": "full_day",
                        "is_override": True,
                        "salary_multiplier": 2,
                        "override_reason": "Worked on paid holiday"
                    })
                    create_record = True
                    
            # G. UNPAID HOLIDAY (Feb 18)
            elif day == 18:
                if staff_index % 2 == 1:
                    attendance_kwargs.update({
                        "status": "Present",
                        "attendance_type": "present",
                        "work_type": "full_day",
                        "is_override": True,
                        "salary_multiplier": 1.5,
                        "override_reason": "Worked on unpaid holiday"
                    })
                    create_record = True
                    
            else:
                # NORMAL CONDITIONS
                
                # A. NORMAL PRESENT DAYS
                if day in [1, 2, 3, 4, 5, 15, 16, 17, 25, 26, 27]:
                    attendance_kwargs.update({
                        "status": "Present",
                        "attendance_type": "present",
                        "work_type": "full_day",
                        "salary_multiplier": 1
                    })
                    create_record = True
                    
                # B. HALF DAY
                elif day in [6, 19]:
                    attendance_kwargs.update({
                        "status": "Present",
                        "attendance_type": "present",
                        "work_type": "half_day",
                        "salary_multiplier": 1
                    })
                    create_record = True
                    
                # C. LEAVE
                elif day in [7, 20]:
                    attendance_kwargs.update({
                        "status": "Absent",
                        "attendance_type": "leave",
                        "work_type": "full_day",
                        "salary_multiplier": 1
                    })
                    create_record = True
                    
                # D. ABSENT (Do NOT create record)
                elif day in [8, 21]:
                    pass
                    
                # H. MULTIPLIER TEST DAYS
                elif day in [22, 23, 24]:
                    attendance_kwargs.update({
                        "status": "Present",
                        "attendance_type": "present",
                        "work_type": "full_day",
                        "salary_multiplier": 1.5,
                        "is_override": True,
                        "override_reason": "Extra workload"
                    })
                    create_record = True
                    
            if create_record:
                StaffAttendance(**attendance_kwargs).save()
                records_created += 1
                total_records += 1
                
        records_per_staff[staff.name] = records_created

    # 8. VALIDATION AFTER INSERT
    print("-" * 50)
    print(f"TOTAL RECORDS CREATED: {total_records}")
    print("-" * 50)
    for staff_name, count in records_per_staff.items():
        print(f"{staff_name}: {count} records")

if __name__ == "__main__":
    generate_test_data()
