

import requests

FAST2SMS_API_KEY = "veDIbrmmtZ8AlwiGykbqP0ulBvTUnmR1qVHfveWIKTSHhmyi2tOYKczrm4Yy"

def send_sms(numbers, message):
    
    # Ensure numbers is comma-separated string
    if isinstance(numbers, list):
        numbers_str = ",".join(str(num) for num in numbers)
    else:
        numbers_str = str(numbers)

    url = "https://www.fast2sms.com/dev/bulkV2"

    payload = {
        "message": message,
        "route": "q",              # Quick SMS route
        "numbers": numbers_str
    }

    headers = {
        "authorization": FAST2SMS_API_KEY,
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        print("🔍 Fast2SMS RAW Response:", response.text)
        return response.json()
    except ValueError:
        # JSON decode failed
        print("❌ Fast2SMS returned NON-JSON:", response.text)
        return None
    except requests.exceptions.RequestException as e:
        print("❌ Fast2SMS request error:", e)
        return None
