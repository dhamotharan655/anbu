import os
import sys
from mongoengine import connect, disconnect

# Setup paths
BASE_DIR = 'c:/Users/jyoth/Desktop/ruban_final1.1/backend'
sys.path.append(BASE_DIR)

# Import models - need to do this AFTER connecting or ensure lazy loading
from user.models import StockItem, StockHistory
from user.views import record_stock_history

def verify_no_duplicates():
    # Disconnect any existing connections
    disconnect()
    
    # Connect to the correct database
    print("Connecting to ruban_electricals database...")
    connect('ruban_electricals', host='mongodb://localhost:27017/ruban_electricals')

    # Find a test item
    item = StockItem.objects(name__iexact="cctv").first()
    if not item:
        item = StockItem.objects.first()
        
    if not item:
        print("No stock items found to test with. Creating dummy.")
        item = StockItem(name="Test Item 123", category="Test", quantity=10, unit="pcs", minimum_threshold=2)
        item.save()

    print(f"Testing with item: {item.name} ({item.stock_id})")
    
    # Get initial history count for this item
    initial_count = StockHistory.objects(stock_id=item.stock_id).count()
    print(f"Initial history count for {item.stock_id}: {initial_count}")
    
    # Perform a reduction using the model method (which previously recorded history)
    prev_qty = item.quantity
    print(f"Reducing stock by 1 via model (item.reduce_stock)...")
    item.reduce_stock(1)
    
    # Check history count again
    new_count = StockHistory.objects(stock_id=item.stock_id).count()
    print(f"History count after model reduction: {new_count}")
    
    if new_count == initial_count:
        print("✅ SUCCESS: Model reduce_stock no longer creates history records.")
    else:
        print(f"❌ FAILURE: Model reduce_stock still created {new_count - initial_count} history records.")

    # Now verify that views (like the mock of views) still record history
    print("Recording history manually (as views.py does via record_stock_history)...")
    record_stock_history(
        stock_item=item,
        operation_type='reduce',
        quantity=1,
        previous_quantity=prev_qty,
        new_quantity=item.quantity,
        performed_by='Verify Script',
        notes='Manual verification record'
    )
    
    final_count = StockHistory.objects(stock_id=item.stock_id).count()
    print(f"History count after manual recording: {final_count}")
    
    if final_count == initial_count + 1:
        print("✅ SUCCESS: History is now recorded only once when called manually.")
    else:
        print(f"❌ FAILURE: History count is {final_count}, expected {initial_count + 1}.")
    
    # Cleanup dummy item if created
    if "Test Item 123" in item.name:
        item.delete()
        StockHistory.objects(stock_id=item.stock_id).delete()
        print("Cleaned up test data.")

if __name__ == "__main__":
    try:
        verify_no_duplicates()
    except Exception as e:
        import traceback
        traceback.print_exc()
