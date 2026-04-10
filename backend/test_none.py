import os
import django
import sys
from datetime import datetime

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from user.models import HolidayCalendar

def test_query():
    date = datetime(2026, 1, 1)
    # Ensure a record exists
    HolidayCalendar.objects(date=date).delete()
    h = HolidayCalendar(date=date, name="Test", staff_id=None)
    h.save()
    
    print("Querying with staff_id=None...")
    res = HolidayCalendar.objects(date=date, staff_id=None).first()
    if res:
        print("Success: Found record with staff_id=None")
    else:
        print("Failure: Could not find record with staff_id=None")

    print("\nTesting save with staff_id=None again...")
    try:
        h2 = HolidayCalendar(date=date, name="Test 2", staff_id=None)
        h2.save()
        print("Save success (Wait, unique_with didn't catch it?)")
    except Exception as e:
        print(f"Save failed as expected: {type(e).__name__}: {e}")

if __name__ == "__main__":
    test_query()
