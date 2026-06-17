import requests

BASE_URL = "http://localhost:8000/api/"

def cleanup_test_holidays():
    res = requests.get(f"{BASE_URL}holiday-calendar/")
    if res.status_code != 200:
        print(f"Failed to fetch holidays: {res.status_code}")
        return
        
    holidays = res.json().get('data', [])
    deleted_count = 0
    for h in holidays:
        if h['date'].startswith('2026-12-25'):
            del_res = requests.delete(f"{BASE_URL}holiday-calendar/{h['id']}/")
            if del_res.status_code == 200:
                deleted_count += 1
                print(f"Deleted holiday {h['id']} for staff {h['staff_id']}")
    
    print(f"Successfully deleted {deleted_count} test holiday records.")

if __name__ == "__main__":
    cleanup_test_holidays()
