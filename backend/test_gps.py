#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Setup Django
django.setup()

from user.models import ClientDetails
from user.views import reverse_geocode

def test_gps_functionality():
    print("Testing GPS functionality...")
    
    # Test reverse geocoding
    print("\n1. Testing reverse geocoding...")
    test_lat = 13.0827
    test_lon = 80.2707
    
    try:
        address = reverse_geocode(test_lat, test_lon)
        print(f"Reverse geocoding result: {address}")
    except Exception as e:
        print(f"Reverse geocoding failed: {e}")
    
    # Test creating a client with GPS coordinates
    print("\n2. Testing client creation with GPS...")
    
    # Clean up any existing test data
    ClientDetails.objects(customer_name="Test GPS Customer").delete()
    
    try:
        client = ClientDetails(
            customer_name="Test GPS Customer",
            phone="9876543210",
            address="Manual Address",
            customer_type="our_customer"
        )
        client.save()
        print(f"Created client: {client.customer_id}")
        
        # Test updating address with GPS
        if address:
            client.address = address
            client.save()
            print(f"Updated address with GPS: {client.address}")
        
        # Clean up
        client.delete()
        print("Test completed successfully!")
        
    except Exception as e:
        print(f"Client creation failed: {e}")

if __name__ == "__main__":
    test_gps_functionality()