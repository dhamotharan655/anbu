"""
Script to fix the duplicate key error by removing the client_id unique index.
Run this once to clean up the database.
"""
import os
import django
import sys

# Add the backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from pymongo import MongoClient

def fix_duplicate_client_id():
    """Fix duplicate client_id issue by dropping the unique index"""
    
    # Connect to MongoDB directly
    client = MongoClient('mongodb://localhost:27017/')
    db = client['waterpurifier']
    collection = db['client_details']
    
    print("=" * 50)
    print("Fixing client_id duplicate key error")
    print("=" * 50)
    
    # Drop the old unique index on client_id
    print("\n[Step 1] Dropping unique index on client_id...")
    try:
        collection.drop_index('client_id_1')
        print("  ✅ Dropped unique index: client_id_1")
    except Exception as e:
        print(f"  Note: {e}")
    
    # Also ensure no documents have null client_id that could cause issues
    print("\n[Step 2] Checking for null client_id entries...")
    result = collection.update_many(
        {'client_id': None},
        {'$unset': {'client_id': ''}}
    )
    print(f"  ✅ Cleared {result.modified_count} null client_id entries")
    
    client.close()
    print("\n" + "=" * 50)
    print("✅ Database cleanup complete!")
    print("=" * 50)

if __name__ == '__main__':
    fix_duplicate_client_id()
