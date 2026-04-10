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
from mongoengine.errors import NotUniqueError

def test_dupe():
    date = datetime(2026, 12, 25)
    
    # Clear existing if any
    HolidayCalendar.objects(date=date).delete()
    
    print("Creating first global holiday...")
    h1 = HolidayCalendar(date=date, name="Christmas", staff_id=None)
    h1.save()
    
    print("Creating duplicate global holiday...")
    try:
        h2 = HolidayCalendar(date=date, name="Christmas Duplicate", staff_id=None)
        h2.save()
        print("Wait, it saved! That's not right.")
    except NotUniqueError:
        print("Caught NotUniqueError as expected.")
    except Exception as e:
        print(f"Caught unexpected error: {type(e).__name__}: {e}")

    print("Creating global holiday with empty string...")
    try:
        h3 = HolidayCalendar(date=date, name="Christmas Empty String", staff_id="")
        h3.save()
        print("Saved with empty string. Result: staff_id='' is different from staff_id=None")
    except NotUniqueError:
        print("Caught NotUniqueError for empty string.")
    except Exception as e:
        print(f"Caught unexpected error: {type(e).__name__}: {e}")

if __name__ == "__main__":
    test_dupe()
