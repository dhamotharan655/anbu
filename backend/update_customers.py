#!/usr/bin/env python
"""
Script to update existing ClientDetails records that don't have customer_id
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from user.models import ClientDetails

def update_existing_customers():
    """Update all existing customers that don't have customer_id"""
    customers_without_id = ClientDetails.objects(customer_id__exists=False) | ClientDetails.objects(customer_id="")

    print(f"Found {customers_without_id.count()} customers without customer_id")

    for customer in customers_without_id:
        print(f"Updating customer: {customer.customer_name} (phone: {customer.phone})")
        customer.save()  # This will trigger the save method to generate customer_id

    print("Update complete!")

    # Show all customers with their IDs
    all_customers = ClientDetails.objects.all()
    print("\nAll customers:")
    for customer in all_customers:
        print(f"{customer.customer_name}: {customer.customer_id}")

if __name__ == "__main__":
    update_existing_customers()
