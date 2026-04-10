import requests

# ============================================================
# SMS Template Configuration
# ============================================================
# To change the company name from "V Aqua" to "Ruban electricals":
# 1. Login to BSNL DLT Portal (https://dlt.bsnl.co.in)
# 2. Create new SMS templates with "Ruban electricals" as company name
# 3. Get the new Template IDs and update the values below
# 
# Current Template IDs (registered with "V Aqua"):
# - Booking Created: 1407176975240590163
# - Job Assigned (Customer): 1407176646448595432  
# - Job Assigned (Staff): 1407176975139055835
# - Job Completed: 1407176975232254673
# - Service Reminder: 1407176975164515486
# ============================================================

BSNL_SEND_SMS_URL = "https://bulksms.bsnl.in:5010/api/Send_SMS"
BSNL_JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiMTEyNjcgMSIsIm5iZiI6MTc2NDk5OTk2MiwiZXhwIjoxNzk2NTM1OTYyLCJpc3MiOiJodHRwczovL2J1bGtzbXMuYnNubC5pbjo1MDEwIiwiYXVkIjoiMTEyNjcgMSJ9.E8j7Qp67fEffpysBGJC_WTQy_um-HT0YMd7bqi6DglA"

BSNL_HEADER = "VNITSD"  # Sender ID - Update this on BSNL portal for new company
BSNL_ADVERTISER_HEADER = "061797"
BSNL_ADVERTISER = "1407176646428047775"
BSNL_ENTITY_ID = "1401397270000076962"

# Template IDs - Update these when creating new templates on BSNL DLT Portal
# ============================================================
# Template IDs for different SMS types:
# 1. Booking Created (Customer SMS on booking):
#    BSNL_TEMPLATE_ID = "1407176975240590163"
# 2. Job Assigned (SMS to Customer when staff is assigned):
#    BSNL_ASSIGN_CUSTOMER_TEMPLATE_ID = "1407176646448595432"
# 3. Job Assigned (SMS to Staff when job is assigned):
#    BSNL_ASSIGN_STAFF_TEMPLATE_ID = "1407176975139055835"
# 4. Job Completed (SMS to Customer on service completion):
#    BSNL_TASK_COMPLETION_TEMPLATE_ID = "1407176975232254673"
# 5. Service Reminder (Periodic service reminder):
#    BSNL_SERVICE_REMINDER_TEMPLATE_ID = "1407176975164515486"
# ============================================================

BSNL_TEMPLATE_ID = "1407176975240590163"  # Booking Created SMS
BSNL_ASSIGN_CUSTOMER_TEMPLATE_ID = "1407176646448595432"  # Job Assigned to Customer
BSNL_ASSIGN_STAFF_TEMPLATE_ID = "1407176975139055835"  # Job Assigned to Staff
BSNL_TASK_COMPLETION_TEMPLATE_ID = "1407176975232254673"  # Job Completed
BSNL_SERVICE_REMINDER_TEMPLATE_ID = "1407176975164515486"  # Service Reminder




def send_bsnl_sms(mobile, cusname, cnum, cid):
    # Convert all values to strings as BSNL API requires string values
    payload = {
        "Header": BSNL_HEADER,
        "Target": mobile,
        "Is_Unicode": "0",
        "Is_Flash": "0",
        "Message_Type": "SI",
        "Entity_Id": BSNL_ENTITY_ID,
        "Content_Template_Id": BSNL_TEMPLATE_ID,
        "Consent_Template_Id": None,
        "Template_Keys_and_Values": [
            {"Key": "cusname", "Value": str(cusname) if cusname else ""},
            {"Key": "cnum", "Value": str(cnum) if cnum else ""},
            {"Key": "cid", "Value": str(cid) if cid else ""},
        ]
    }

    headers = {
        "Authorization": f"Bearer {BSNL_JWT_TOKEN}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(BSNL_SEND_SMS_URL, json=payload, headers=headers, timeout=10)
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"Error": f"SMS request failed: {str(e)}", "Message_Id": None}

import requests

def send_promotional_sms(mobile):
    if not mobile or not str(mobile).isdigit() or len(str(mobile)) != 10:
        return {"Error": "Invalid mobile number", "Message_Id": None}

    payload = {
        "Header": "061797",                  # Promotional Header
        "Target": mobile,                    # ONLY 10-digit number
        "Is_Unicode": "0",
        "Is_Flash": "0",
        "Message_Type": "PML",               # Promotional
        "Entity_Id": BSNL_ENTITY_ID,
        "Content_Template_Id": "1407176646428047775"
        # ❌ NO "Message"
        # ❌ NO "Template_Keys_and_Values" (unless template has vars)
    }

    headers = {
        "Authorization": f"Bearer {BSNL_JWT_TOKEN}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(
            BSNL_SEND_SMS_URL,
            json=payload,
            headers=headers,
            timeout=10
        )
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"Error": f"SMS request failed: {str(e)}", "Message_Id": None}



def send_assign_customer_sms(mobile, cusname, cnum, cusno,staffname):
    # Convert all values to strings as BSNL API requires string values
    payload = {
        "Header": BSNL_HEADER,
        "Target": mobile,
        "Is_Unicode": "0",
        "Is_Flash": "0",
        "Message_Type": "SI",
        "Entity_Id": BSNL_ENTITY_ID,
        "Content_Template_Id": BSNL_ASSIGN_CUSTOMER_TEMPLATE_ID,
        "Consent_Template_Id": None,
        "Template_Keys_and_Values": [
            {"Key": "cusname", "Value": str(cusname) if cusname else ""},
            {"Key": "cnum", "Value": str(cnum) if cnum else ""},
            {"Key": "cusno", "Value": str(cusno) if cusno else ""},
            {"Key": "staffname", "Value": str(staffname) if staffname else ""},
        ]
    }

    headers = {
        "Authorization": f"Bearer {BSNL_JWT_TOKEN}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(BSNL_SEND_SMS_URL, json=payload, headers=headers, timeout=10)
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"Error": f"SMS request failed: {str(e)}", "Message_Id": None}


def send_assign_staff_sms(mobile, staffname, cnum, cusname, comp,  addi, addii, phno, cid, altno):
    # Convert all values to strings as BSNL API requires string values
    payload = {
        "Header": BSNL_HEADER,
        "Target": mobile,
        "Is_Unicode": "0",
        "Is_Flash": "0",
        "Message_Type": "SI",
        "Entity_Id": BSNL_ENTITY_ID,
        "Content_Template_Id": BSNL_ASSIGN_STAFF_TEMPLATE_ID,
        "Consent_Template_Id": None,
        "Template_Keys_and_Values": [
            {"Key": "cusname", "Value": str(cusname) if cusname else ""},
            {"Key": "cnum", "Value": str(cnum) if cnum else ""},
            {"Key": "staffname", "Value": str(staffname) if staffname else ""},
            {"Key": "comp", "Value": str(comp) if comp else ""},
            {"Key": "addi", "Value": str(addi) if addi else ""},
            {"Key": "addii", "Value": str(addii) if addii else ""},
            {"Key": "phno", "Value": str(phno) if phno else ""},
            {"Key": "cid", "Value": str(cid) if cid else ""},
            {"Key": "altno", "Value": str(altno) if altno else ""},
        ]
    }

    headers = {
        "Authorization": f"Bearer {BSNL_JWT_TOKEN}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(BSNL_SEND_SMS_URL, json=payload, headers=headers, timeout=10)
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"Error": f"SMS request failed: {str(e)}", "Message_Id": None}

def send_task_completion_sms(mobile, cusname, cnum, amt, cid):
    # Convert all values to strings as BSNL API requires string values
    payload = {
        "Header": BSNL_HEADER,
        "Target": mobile,
        "Is_Unicode": "0",
        "Is_Flash": "0",
        "Message_Type": "SI",
        "Entity_Id": BSNL_ENTITY_ID,
        "Content_Template_Id": BSNL_TASK_COMPLETION_TEMPLATE_ID,
        "Consent_Template_Id": None,
        "Template_Keys_and_Values": [
            {"Key": "cusname", "Value": str(cusname) if cusname else ""},
            {"Key": "cnum", "Value": str(cnum) if cnum else ""},
            {"Key": "amt", "Value": str(amt) if amt is not None else "0"},
            {"Key": "cid", "Value": str(cid) if cid else ""},

        ]
    }

    headers = {
        "Authorization": f"Bearer {BSNL_JWT_TOKEN}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(BSNL_SEND_SMS_URL, json=payload, headers=headers, timeout=10)
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"Error": f"SMS request failed: {str(e)}", "Message_Id": None}


def send_reminder_sms(mobile, cusname, cnum, prod, cid):
    # Convert all values to strings as BSNL API requires string values
    payload = {
        "Header": BSNL_HEADER,
        "Target": mobile,
        "Is_Unicode": "0",
        "Is_Flash": "0",
        "Message_Type": "SI",
        "Entity_Id": BSNL_ENTITY_ID,
        "Content_Template_Id": BSNL_SERVICE_REMINDER_TEMPLATE_ID,
        "Consent_Template_Id": None,
        "Template_Keys_and_Values": [
            {"Key": "cusname", "Value": str(cusname) if cusname else ""},
            {"Key": "cnum", "Value": str(cnum) if cnum else ""},
            {"Key": "prod", "Value": str(prod) if prod else 'N/A'},
            {"Key": "cid", "Value": str(cid) if cid else ""},
        ]
    }

    headers = {
        "Authorization": f"Bearer {BSNL_JWT_TOKEN}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(BSNL_SEND_SMS_URL, json=payload, headers=headers, timeout=10)
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"Error": f"SMS request failed: {str(e)}", "Message_Id": None}