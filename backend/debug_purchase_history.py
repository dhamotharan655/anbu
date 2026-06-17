import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from user.models import BookServiceComplaint

def debug_purchase_history():
    print("--- DEBUG PURCHASE HISTORY ---")
    
    # 1. Check all completed
    all_completed = BookServiceComplaint.objects(status="completed")
    print(f"Total Completed: {all_completed.count()}")
    
    # 2. Check filters used in get_product_purchase_history
    filtered = BookServiceComplaint.objects(
        status="completed",
        job_category__ne="motor_service",
        job_type__ne="motor_service"
    )
    print(f"Filtered (ne motor_service): {filtered.count()}")
    
    # 3. Inspect items
    for i, c in enumerate(filtered.limit(10)):
        has_prod = bool(c.product_name or c.additional_product)
        print(f"{i+1}. {c.complaint_no} | Cat: {c.job_category} | Type: {c.job_type} | Has Product: {has_prod}")
        if has_prod:
            print(f"   - Product Name: {c.product_name[:100] if c.product_name else 'None'}")
            print(f"   - Additional: {c.additional_product[:100] if c.additional_product else 'None'}")

if __name__ == "__main__":
    debug_purchase_history()
