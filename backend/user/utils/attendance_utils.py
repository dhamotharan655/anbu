from datetime import datetime, time, timedelta

def resolve_attendance(staff_id, date):
    """
    Industry-Level Attendance Resolution Engine.
    PRIORITY RULE: Manual Attendance > HolidayCalendar > WeeklyOff > Absent
    
    Args:
        staff_id (str): The ID of the staff member
        date (datetime): The date to resolve attendance for
    
    Returns:
        dict: Attendance status details including type and salary multiplier
    """
    from ..models import Staff, StaffAttendance, HolidayCalendar
    # Standardize date to naive datetime at midnight for comparison
    target_date = datetime(date.year, date.month, date.day)
    
    # Define start and end of day for querying
    day_start = datetime.combine(target_date, time.min)
    day_end = datetime.combine(target_date, time.max)
    
    # Step 1: Check if manual attendance exists (Highest Priority)
    manual_record = StaffAttendance.objects(
        staff_id=staff_id,
        date__gte=day_start,
        date__lte=day_end
    ).first()
    
    if manual_record:
        # If manual record exists, use its data directly
        return {
            "attendance_type": manual_record.attendance_type or ("present" if manual_record.status == "Present" else "absent"),
            "status": manual_record.status,
            "work_type": getattr(manual_record, 'work_type', 'full_day'),
            "salary_multiplier": manual_record.salary_multiplier or 1,
            "source": "manual"
        }
    
    # Step 2: Check Holiday Calendar (Global or Staff-Specific)
    holiday = HolidayCalendar.objects(
        date=target_date,
        is_active=True,
        staff_id__in=[None, staff_id]
    ).first()
    
    if holiday:
        is_paid = getattr(holiday, 'is_paid', True)
        return {
            "attendance_type": "holiday",
            "status": "Present",
            "work_type": "full_day",
            "salary_multiplier": 1.0 if is_paid else 0.0,
            "reason": holiday.name,
            "source": "holiday_calendar",
            "is_paid": is_paid
        }
    
    # Step 3: Check Weekly Off Days (Fallback for backward compatibility)
    staff = Staff.objects(id=staff_id).first()
    if staff and staff.weekly_off_days:
        day_name = date.strftime("%A")  # "Sunday", "Monday", etc.
        if day_name in staff.weekly_off_days:
            # Note: Auto-generation should have caught this in Step 2, 
            # but we keep this as a safe fallback. Treatment is Paid Holiday by default.
            return {
                "attendance_type": "holiday",
                "status": "Present",
                "work_type": "full_day",
                "salary_multiplier": 1.0,
                "reason": f"Weekly Off ({day_name})",
                "source": "weekly_off",
                "is_paid": True
            }
            
    return {
        "attendance_type": "absent",
        "status": "Absent",
        "work_type": "full_day",
        "salary_multiplier": 0,
        "source": "default_absent"
    }

def getAttendanceStatus(staff_id, date):
    """
    Intelligent attendance interpretation helper.
    Returns: "attendance_record_object", "week_off", "holiday", or "absent"
    """
    from ..models import Staff, StaffAttendance, HolidayCalendar
    # Standardize date
    target_date = datetime(date.year, date.month, date.day)
    day_start = datetime.combine(target_date, time.min)
    day_end = datetime.combine(target_date, time.max)
    
    # 1. Check if attendance exists
    attendance = StaffAttendance.objects(
        staff_id=staff_id,
        date__gte=day_start,
        date__lte=day_end
    ).first()
    
    if attendance:
        return attendance
        
    # 2. Check for Weekly Off
    staff = Staff.objects(id=staff_id).first()
    if staff and staff.weekly_off_days:
        day_name = date.strftime("%A")
        if day_name in staff.weekly_off_days:
            return "week_off"
            
    # 3. Check for Holiday
    holiday = HolidayCalendar.objects(
        date=target_date,
        is_active=True,
        staff_id__in=[None, staff_id]
    ).first()
    
    if holiday:
        return "holiday"
        
    # 4. Default
    return "absent"
