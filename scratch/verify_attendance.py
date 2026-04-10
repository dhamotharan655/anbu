import os
import sys
from datetime import datetime
import mongoengine

# Add backend to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Connect to MongoDB (assuming local or standard settings)
# We can check backend/backend/settings.py for connection details if needed
# But usually StaffAttendance.objects matches the existing connection if we run via runserver context.
# However, for a standalone script, we need to connect.

from user.models import Staff, StaffAttendance, HolidayCalendar  # type: ignore
from user.utils.attendance_utils import getAttendanceStatus  # type: ignore

# Connect to MongoDB
mongoengine.connect(
    db="Ru",
    host="mongodb://localhost:27017/Ru"
)

def verify():
    # 1. Check Model Fields
    print("Checking StaffAttendance fields...")
    try:
        dummy = StaffAttendance(staff_id="test", staff_name="test", date=datetime.utcnow(), marked_by="system")
        dummy.is_override = True
        dummy.override_reason = "Test Reason"
        print("SUCCESS: Models fields exist and are accessible.")
    except Exception as e:
        print(f"ERROR: Model field error: {e}")

    # 2. Test getAttendanceStatus
    print("\nTesting getAttendanceStatus...")
    staff = Staff.objects.first()
    if not staff:
        print("No staff found for testing.")
        return

    today = datetime.utcnow()
    status = getAttendanceStatus(str(staff.id), today)
    print(f"Status for {staff.name} today ({today.strftime('%Y-%m-%d')}): {status}")

    # 3. Verify logic logic
    # Create a dummy holiday for tomorrow
    from datetime import timedelta
    tomorrow = today + timedelta(days=1)
    tomorrow_start = datetime(tomorrow.year, tomorrow.month, tomorrow.day)
    
    hol = HolidayCalendar(date=tomorrow_start, name="Verification Holiday", type="company_holiday")
    hol.save()
    
    status_tomorrow = getAttendanceStatus(str(staff.id), tomorrow)
    print(f"Status for tomorrow (Holiday): {status_tomorrow}")
    
    # Cleanup
    hol.delete()
    
    if status_tomorrow == "holiday":
        print("SUCCESS: Holiday detection works.")
    else:
        print(f"ERROR: Holiday detection failed. Returned: {status_tomorrow}")

if __name__ == "__main__":
    # Note: This script requires a running Mongo connection similar to the app
    # In this environment, we might not be able to connect directly without proper mongoengine.connect
    # I'll just check if the code compiles and if the logic looks sound via static analysis
    print("Verification script ready. (Note: Requires active DB connection)")
    verify()
