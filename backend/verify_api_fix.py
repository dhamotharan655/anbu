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
from user.serializers import HolidayCalendarSerializer

def test_serializer_dupe():
    date_str = "2026-12-25T00:00:00Z"
    date_obj = datetime(2026, 12, 25)
    
    # Clear existing
    HolidayCalendar.objects(date=date_obj).delete()
    
    print("Testing First Save...")
    data1 = {
        "date": date_str,
        "name": "Christmas",
        "type": "company_holiday",
        "staff_id": "" # Should be converted to None
    }
    ser1 = HolidayCalendarSerializer(data=data1)
    if ser1.is_valid():
        h1 = ser1.save()
        print(f"First Save SUCCESS: staff_id={h1.staff_id}")
    else:
        print(f"First Save FAILED: {ser1.errors}")
        return

    print("\nTesting Duplicate Save (Global)...")
    data2 = {
        "date": date_str,
        "name": "Christmas Duplicate",
        "type": "company_holiday",
        "staff_id": ""
    }
    ser2 = HolidayCalendarSerializer(data=data2)
    if ser2.is_valid():
        print("Duplicate Save FAILED: is_valid should have caught this.")
    else:
        print(f"Duplicate Save SUCCESS: Caught as expected: {ser2.errors}")

    print("\nTesting Staff Specific Save (Different Staff)...")
    data3 = {
        "date": date_str,
        "name": "Staff Holiday",
        "type": "weekly_off",
        "staff_id": "staff123"
    }
    ser3 = HolidayCalendarSerializer(data=data3)
    if ser3.is_valid():
        h3 = ser3.save()
        print(f"Staff Specific Save SUCCESS: staff_id={h3.staff_id}")
    else:
        print(f"Staff Specific Save FAILED: {ser3.errors}")

if __name__ == "__main__":
    test_serializer_dupe()
