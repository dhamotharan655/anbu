
import os
import django
import sys
from bson import ObjectId

# Setup Django
sys.path.append(r'c:\Users\jyoth\Downloads\ruban_final\ruban_final3\ruban_final1.1\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from user.models import BookServiceComplaint

def test_query():
    try:
        print("Testing query with -created_at...")
        # This will likely fail if created_at doesn't exist in the model for MongoEngine
        # or it might just return results but without ordering correctly
        res = BookServiceComplaint.objects(status="completed").order_by('-created_at').limit(5)
        print(f"Results with -created_at: {len(list(res))}")
    except Exception as e:
        print(f"Query with -created_at FAILED: {e}")

    try:
        print("Testing query with -date_created...")
        res = BookServiceComplaint.objects(status="completed").order_by('-date_created').limit(5)
        print(f"Results with -date_created: {len(list(res))}")
    except Exception as e:
        print(f"Query with -date_created FAILED: {e}")

if __name__ == "__main__":
    test_query()
