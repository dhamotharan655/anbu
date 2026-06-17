import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api/"

def test_multi_staff_holiday():
    # 1. Get staff list to get some real IDs
    res = requests.get(f"{BASE_URL}staff/")
    staffs = res.json()
    if not staffs or len(staffs) < 2:
        print("Not enough staff to test.")
        return
    
    staff_ids = [staffs[0]['id'], staffs[1]['id']]
    print(f"Testing with staff IDs: {staff_ids}")
    
    # 2. Add holiday for multiple staff
    date_str = "2026-12-25" # Far future date to avoid conflicts
    payload = {
        "date": date_str,
        "name": "Multi-Staff Test Holiday",
        "type": "weekly_off",
        "staff_ids": staff_ids,
        "is_paid": True
    }
    
    res = requests.post(f"{BASE_URL}holiday-calendar/", json=payload)
    print(f"POST Response: {res.status_code}")
    print(json.dumps(res.json(), indent=2))
    
    if res.status_code == 201:
        print("[SUCCESS] Successfully created multi-staff holidays.")
    else:
        print("[FAILED] Failed to create multi-staff holidays.")
        return

    # 3. Verify they exist
    res = requests.get(f"{BASE_URL}holiday-calendar/?month=12&year=2026")
    holidays = res.json().get('data', [])
    found_count = 0
    created_ids = []
    for h in holidays:
        if h['date'].startswith(date_str) and (h['staff_id'] in staff_ids or h['staff_id'] is None):
             # For some reason if staff_id is null it might match if we are not careful
             if h['staff_id'] in staff_ids:
                found_count += 1
                created_ids.append(str(h['id']))
                print(f"Found holiday for staff {h['staff_id']}")
            
    if found_count == 2:
        print("[SUCCESS] Verified 2 individual holiday records exist.")
    else:
        print(f"[FAILED] Verification failed. Found {found_count} instead of 2.")

    # 4. Cleanup
    for h_id in created_ids:
        requests.delete(f"{BASE_URL}holiday-calendar/{h_id}/")
    print("Cleanup done.")


if __name__ == "__main__":
    test_multi_staff_holiday()
