from user.time_utils import get_ist_now
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from bson import ObjectId
from django.core.mail import EmailMessage
from django.core.files.storage import default_storage
from django.conf import settings
from django.http import HttpResponse, FileResponse
from datetime import datetime, timedelta
from collections import defaultdict
import os
import traceback
import requests
import json
import calendar
# from .send_sms import send_sms
# from .utils.bsnl_sms import *
from .models import *

# ⭐ Explicit imports for models (to help IDE recognize and resolve name conflicts)
from .models import (
    Staff, StaffAttendance, StaffPayroll, ClientDetails, Products, 
    StockItem, StockHistory, PaymentTransaction, StaffLeaveBalance, 
    StaffLoan, PaymentDetails, HolidayCalendar,
    BookServiceComplaint, JobType, ExpiredItem
)
from .serializers import (
    HolidayCalendarSerializer,
    ClientDetailsSerializer,
    JobTypeSerializer,
    ExpiredItemSerializer
)
from .utils.attendance_utils import resolve_attendance, getAttendanceStatus
from .invoice_generator import number_to_words

# 🧪 ReportLab imports for PDF generation
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

import uuid
import urllib.parse

# ------------------------------
#   DEBUG ENDPOINT - Check customers count
# ------------------------------
@api_view(['GET'])
def debug_customers_count(request):
    """Debug endpoint to check customers in database"""
    try:
        # Check all customers regardless of status
        all_customers = ClientDetails.objects.all()
        online_customers = ClientDetails.objects.filter(status="online")
        offline_customers = ClientDetails.objects.filter(status="offline")
        
        # Get sample customer data
        sample = []
        for c in ClientDetails.objects.limit(3):
            sample.append({
                "id": str(c.id),
                "customer_id": c.customer_id,
                "customer_name": c.customer_name,
                "phone": c.phone,
                "status": c.status
            })
        
        return Response({
            "total_count": all_customers.count(),
            "online_count": online_customers.count(),
            "offline_count": offline_customers.count(),
            "sample_customers": sample
        }, status=200)
    except Exception as e:
        return Response({"error": str(e), "traceback": traceback.format_exc()}, status=500)

# ------------------------------
#   Enhanced Reverse Geocoding Function
# ------------------------------
def reverse_geocode(latitude, longitude):
    """
    Convert GPS coordinates to detailed human-readable address using OpenStreetMap Nominatim
    Returns structured address data with components for better display
    """
    try:
        url = f"https://nominatim.openstreetmap.org/reverse"
        params = {
            'format': 'json',
            'lat': latitude,
            'lon': longitude,
            'addressdetails': 1,
            'accept-language': 'en'
        }
        headers = {
             'User-Agent': 'RubanElectricals/1.0 (contact@example.com)'
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=5)
        response.raise_for_status()
        
        data = response.json()
        
        if 'address' in data:
            address = data['address']
            
            # Build detailed address components
            components = []
            
            # Most specific to least specific
            if address.get('house_number'):
                components.append(address['house_number'])
            if address.get('road'):
                components.append(address['road'])
            if address.get('neighbourhood'):
                components.append(address['neighbourhood'])
            if address.get('suburb'):
                components.append(address['suburb'])
            if address.get('city_district'):
                components.append(address['city_district'])
            if address.get('city'):
                components.append(address['city'])
            elif address.get('town'):
                components.append(address['town'])
            elif address.get('village'):
                components.append(address['village'])
            if address.get('state'):
                components.append(address['state'])
            if address.get('postcode'):
                components.append(address['postcode'])
            if address.get('country'):
                components.append(address['country'])
            
            # Remove duplicates and empty values
            unique_components = []
            seen = set()
            
            for component in components:
                if component and component.strip() and component.lower() not in seen:
                    seen.add(component.lower())
                    unique_components.append(component)
            
            # Create detailed address
            detailed_address = ', '.join(unique_components)
            
            # Create address breakdown for display
            address_breakdown = []
            if address.get('road'):
                address_breakdown.append(f"Street: {address['road']}")
            if address.get('city') or address.get('town') or address.get('village'):
                city = address.get('city') or address.get('town') or address.get('village')
                address_breakdown.append(f"City: {city}")
            if address.get('state'):
                address_breakdown.append(f"State: {address['state']}")
            if address.get('country'):
                address_breakdown.append(f"Country: {address['country']}")
            if address.get('postcode'):
                address_breakdown.append(f"Pincode: {address['postcode']}")
            
            location_details = ' | '.join(address_breakdown)
            
            # Return structured data
            return {
                'full_address': detailed_address,
                'coordinates': f"{latitude:.6f}, {longitude:.6f}",
                'location_details': location_details,
                'raw_address': data.get('display_name', ''),
                'components': {
                    'street': address.get('road') or address.get('pedestrian') or address.get('footway'),
                    'city': address.get('city') or address.get('town') or address.get('village'),
                    'state': address.get('state'),
                    'country': address.get('country'),
                    'postcode': address.get('postcode'),
                    'house_number': address.get('house_number'),
                    'neighbourhood': address.get('neighbourhood') or address.get('suburb')
                }
            }
        
        # Fallback to display_name if address object is not available
        elif 'display_name' in data:
            return {
                'full_address': data['display_name'],
                'coordinates': f"{latitude:.6f}, {longitude:.6f}",
                'location_details': f"Coordinates: {latitude:.6f}, {longitude:.6f}",
                'raw_address': data['display_name'],
                'components': {}
            }
        
        return None
            
    except Exception as e:
        print(f"Reverse geocoding failed: {e}")
        return {
            'full_address': f"GPS Location: {latitude:.6f}, {longitude:.6f}",
            'coordinates': f"{latitude:.6f}, {longitude:.6f}",
            'location_details': "Unable to fetch detailed address",
            'raw_address': None,
            'components': {}
        }



def format_date(date_obj):
    """Format datetime object to string, handling None values."""
    if date_obj is None:
        return None
    return date_obj.strftime("%Y-%m-%d %H:%M:%S") if hasattr(date_obj, 'strftime') else str(date_obj)

from rest_framework.views import APIView
from .models import (
    User,
    Staff,
    DeletedStaff,
    BookServiceComplaint,  #   merged model
    SentEmail
)
from .serializers import (
    UserSerializer,
    StaffSerializer,
    BookServiceComplaintSerializer,
    ClientDetailsSerializer,
    ProductsSerializer,
    StockItemSerializer,
    StockAddSerializer,
    StockReduceSerializer,
    StockAlertSerializer,
    PaymentTransactionSerializer,
    StaffLeaveBalanceSerializer,
    StaffLoanSerializer
)


# ------------------------------
#   User Login
# ------------------------------
@api_view(["PUT"])
def update_permissions(request, user_id):
    user = User.objects.get(id=user_id)

    if user.role != "admin":
        return Response({"error": "Only admins can have permissions"}, status=400)

    user.permissions = request.data.get("permissions", [])
    user.save()

    return Response({"message": "Permissions updated"})

from .serializers import UserSerializer, LoginSerializer
from django.contrib.auth.hashers import check_password, make_password

@api_view(["POST"])
def login(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    full_name = serializer.validated_data["full_name"]
    password = serializer.validated_data["password"]

    try:
        user = User.objects.get(full_name=full_name)
    except User.DoesNotExist:
        return Response({"detail": "Invalid username"}, status=400)

    # Support both hashed and plain text passwords (with upgrade)
    is_correct = False
    is_hashed = (user.password.startswith('pbkdf2_sha256$') or 
                 user.password.startswith('bcrypt') or 
                 user.password.startswith('argon2'))
    
    if is_hashed:
        is_correct = check_password(password, user.password)
    else:
        is_correct = (user.password == password)
        if is_correct:
            # Upgrade password to hashed version
            user.password = make_password(password)
            user.save()

    if not is_correct:
        return Response({"detail": "password incorrect"}, status=400)

    return Response({
        "token": "dummy-token",  # JWT optional
        "user_id": str(user.id),
        "role": user.role,
        "permissions": user.permissions
    })
    
@api_view(["GET"])
def get_admins(request):
    admins = User.objects(role__in=["admin", "bigadmin"])
    serializer = UserSerializer(admins, many=True)
    return Response(serializer.data)

@api_view(["POST"])
def create_user(request):
    full_name = request.data.get("full_name")
    password = request.data.get("password")
    role = request.data.get("role", "admin")  # Default to admin role
    permissions = request.data.get("permissions", [])
    is_active = request.data.get("is_active", True)
    created_at = request.data.get("created_at")

    if not full_name or not password:
        return Response({"error": "Full name and password are required"}, status=400)

    # Validate role
    if role not in ("bigadmin", "admin"):
        return Response({"error": "Role must be either 'bigadmin' or 'admin'"}, status=400)

    existing_user = User.objects(full_name=full_name).first()
    if existing_user:
        return Response({"error": f"User '{full_name}' already exists"}, status=400)

    try:
        from datetime import datetime
        
        user = User(
            full_name=full_name,
            password=make_password(password),
            role=role,
            permissions=permissions,
            is_active=is_active
        )
        
        # Parse created_at if provided
        if created_at:
            try:
                user.created_at = datetime.strptime(created_at, "%Y-%m-%dT%H:%M:%S.%fZ")
            except:
                try:
                    user.created_at = datetime.strptime(created_at, "%Y-%m-%d")
                except:
                    pass  # Use default if parsing fails
        
        user.save()
        return Response({
            "message": "User created successfully",
            "user": {
                "full_name": user.full_name,
                "role": user.role,
                "permissions": user.permissions,
                "is_active": user.is_active
            }
        }, status=201)
    except Exception as e:
        print("Error creating user:", str(e))
        return Response({"error": f"Failed to create user: {str(e)}"}, status=400)

@api_view(["DELETE"])
def delete_user(request, user_id):
    try:
        user = User.objects.get(id=ObjectId(user_id))
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    # Prevent deleting bigadmin users
    if user.role == "bigadmin":
        return Response({"error": "Cannot delete bigadmin user"}, status=400)

    user.delete()
    return Response({"message": "User deleted successfully"})


@api_view(["GET"])
def get_user(request, user_id):
    user = User.objects.get(id=ObjectId(user_id))
    serializer = UserSerializer(user)
    return Response(serializer.data)


@api_view(["PUT"])
def update_permissions(request, user_id):
    try:
        user = User.objects.get(id=ObjectId(user_id))
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    user.permissions = request.data.get("permissions", [])
    user.save()
    return Response({"message": "Permissions updated"})

# ------------------------------
#   Add Staff (with photo upload)
# ------------------------------
@api_view(['POST'])
def add_staff(request):
    try:
        name = request.data.get('name')
        phone = request.data.get('phone')
        location = request.data.get('location')
        email = request.data.get('email', None)
        
        # New salary fields
        per_day_salary = float(request.data.get('per_day_salary', 0))
        monthly_salary = float(request.data.get('monthly_salary', 0))

        photo_url = None
        if 'photo' in request.FILES:  #   must match frontend key
            photo = request.FILES['photo']
            file_path = default_storage.save(f"staff_photos/{photo.name}", photo)
            photo_url = f"/media/{file_path}"

        staff = Staff(
            name=name,
            phone=phone,
            location=location,
            email=email,
            photo_url=photo_url,
            per_day_salary=per_day_salary,
            monthly_salary=monthly_salary,
            branch_name=request.data.get('branch_name')
        )

        # Handle weekly off days
        weekly_off_days_raw = request.data.get('weekly_off_days')
        if weekly_off_days_raw:
            try:
                staff.weekly_off_days = json.loads(weekly_off_days_raw)
            except:
                pass
        
        # Set salary_last_updated if salary info is provided
        if per_day_salary > 0 or monthly_salary > 0:
            staff.salary_last_updated = get_ist_now()
            
        staff.save()
        return Response({"success": True, "message": "Staff added successfully"})
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=400)


# ------------------------------
#   Get Single Staff Details
# ------------------------------
@api_view(['GET'])
def get_staff_detail(request, staff_id):
    try:
        staff = Staff.objects(id=staff_id).first()
        if not staff:
            return Response({"error": "Staff not found"}, status=404)
        
        data = {
            "id": str(staff.id),
            "name": staff.name,
            "phone": staff.phone,
            "location": staff.location,
            "photo_url": staff.photo_url,
            "email": getattr(staff, 'email', ''),
            "per_day_salary": getattr(staff, 'per_day_salary', 0) or 0,
            "monthly_salary": getattr(staff, 'monthly_salary', 0) or 0,
            "weekly_off_days": getattr(staff, 'weekly_off_days', []),
            "salary_last_updated": format_date(getattr(staff, 'salary_last_updated', None)) if hasattr(staff, 'salary_last_updated') and staff.salary_last_updated else None,
            "branch_name": getattr(staff, 'branch_name', '')
        }
        return Response(data)
    except Exception as e:
        return Response({"error": str(e)}, status=400)


# ------------------------------
#   Edit Staff (update photo if new uploaded)
# ------------------------------
@api_view(['PUT'])
def edit_staff(request, staff_id):
    staff = Staff.objects(id=staff_id).first()
    if not staff:
        return Response({"error": "Staff not found"}, status=404)

    staff.name = request.data.get('name', staff.name)
    staff.phone = request.data.get('phone', staff.phone)
    staff.location = request.data.get('location', staff.location)
    staff.email = request.data.get('email', staff.email)
    
    # Update salary fields if provided
    if 'per_day_salary' in request.data:
        staff.per_day_salary = float(request.data.get('per_day_salary', 0))
    if 'monthly_salary' in request.data:
        staff.monthly_salary = float(request.data.get('monthly_salary', 0))
    
    # Update salary_last_updated when salary is changed
    if 'per_day_salary' in request.data or 'monthly_salary' in request.data:
        staff.salary_last_updated = get_ist_now()

    # Update branch
    if 'branch_name' in request.data:
        staff.branch_name = request.data.get('branch_name')

    # Update weekly off days
    weekly_off_days_raw = request.data.get('weekly_off_days')
    if weekly_off_days_raw:
        try:
            staff.weekly_off_days = json.loads(weekly_off_days_raw)
        except:
            pass

    if 'photo' in request.FILES:
        photo = request.FILES['photo']
        folder = os.path.join(settings.MEDIA_ROOT, "staff_photos")
        os.makedirs(folder, exist_ok=True)
        file_path = default_storage.save(f"staff_photos/{photo.name}", photo)
        staff.photo_url = f"{settings.MEDIA_URL}staff_photos/{photo.name}"

    staff.save()
    return Response({
        "success": True,
        "message": "Staff updated successfully",
        "photo_url": staff.photo_url
    })


# ------------------------------
#   Get All Active Staff (with attendance filtering)
# ------------------------------
@api_view(['GET'])
def get_staff(request):
    try:
        # Get attendance_status parameter for filtering
        attendance_status = request.GET.get('attendance_status')
        
        # Start with all active staff
        staffs = Staff.objects(is_active=True).order_by('-created_at')
        
        # Apply attendance filtering if parameter is provided and valid
        if attendance_status in ['present', 'absent']:
            try:
                from datetime import datetime, timedelta
                
                today_start = datetime.combine(get_ist_now().date(), datetime.min.time())
                today_end = datetime.combine(get_ist_now().date() + timedelta(days=1), datetime.min.time())
                
                if attendance_status == 'present':
                    # Get staff IDs who are marked as present today
                    present_attendance = StaffAttendance.objects(
                        date__gte=today_start,
                        date__lt=today_end,
                        status='Present'
                    ).distinct('staff_id')
                    
                    # Filter staff by those IDs
                    staffs = staffs.filter(id__in=present_attendance)
                    
                elif attendance_status == 'absent':
                    # Get all active staff IDs
                    all_active_staff_ids = [s.id for s in Staff.objects(is_active=True)]
                    
                    # Get staff IDs who are marked as present today
                    present_attendance = StaffAttendance.objects(
                        date__gte=today_start,
                        date__lt=today_end,
                        status='Present'
                    ).distinct('staff_id')
                    
                    # Absent = active staff not in present list
                    absent_staff_ids = [sid for sid in all_active_staff_ids if sid not in present_attendance]
                    staffs = staffs.filter(id__in=absent_staff_ids)
            except Exception as filter_error:
                # Log the error but don't break the staff list
                print(f"Attendance filter error: {str(filter_error)}")
                # Continue with unfiltered staff list
        
        # Convert to response format
        data = [
            {
                "id": str(s.id),
                "name": s.name,
                "phone": s.phone,
                "location": s.location,
                "photo_url": s.photo_url,
                "email": getattr(s, 'email', ''),
                "per_day_salary": getattr(s, 'per_day_salary', 0) or 0,
                "monthly_salary": getattr(s, 'monthly_salary', 0) or 0,
                "weekly_off_days": getattr(s, 'weekly_off_days', []),
                "salary_last_updated": format_date(getattr(s, 'salary_last_updated', None)) if hasattr(s, 'salary_last_updated') and s.salary_last_updated else None,
                "branch_name": getattr(s, 'branch_name', '')
            }
            for s in staffs
        ]
        
        return Response(data)
        
    except Exception as e:
        # Return all staff if there's any error - never return 500
        print(f"Error in staff fetching: {str(e)}")
        try:
            staffs = Staff.objects(is_active=True).order_by('-created_at')
            data = [
                {
                    "id": str(s.id),
                    "name": s.name,
                    "phone": s.phone,
                    "location": s.location,
                    "photo_url": s.photo_url,
                    "email": getattr(s, 'email', ''),
                    "per_day_salary": getattr(s, 'per_day_salary', 0) or 0,
                    "monthly_salary": getattr(s, 'monthly_salary', 0) or 0,
                    "weekly_off_days": getattr(s, 'weekly_off_days', []),
                    "salary_last_updated": format_date(getattr(s, 'salary_last_updated', None)) if hasattr(s, 'salary_last_updated') and s.salary_last_updated else None
                }
                for s in staffs
            ]
            return Response(data)
        except:
            # Final fallback - return empty array
            return Response([])


# ------------------------------
#   Delete (move to DeletedStaff)
# ------------------------------
@api_view(['DELETE'])
def delete_staff(request, staff_id):
    staff = Staff.objects(id=staff_id).first()
    if not staff:
        return Response({"error": "Staff not found"}, status=404)

    DeletedStaff(
        name=staff.name,
        email=staff.email,
        phone=staff.phone,
        location=staff.location,
        photo_url=staff.photo_url
    ).save()

    staff.delete()
    return Response({"success": True, "message": "Staff deleted and moved to DeletedStaff"})


# ------------------------------
#   Get Deleted Staff
# ------------------------------
@api_view(['GET'])
def deleted_staff_list(request):
    deleted_staffs = DeletedStaff.objects().order_by('-deleted_at')
    data = [
        {
            "id": str(s.id),
            "name": s.name,
            "phone": s.phone,
            "location": s.location,
            "photo_url": s.photo_url,
            "email": s.email,
            "deleted_at": s.deleted_at
        }
        for s in deleted_staffs
    ]
    return Response(data, status=status.HTTP_200_OK)


# ------------------------------
#   Restore Deleted Staff
# ------------------------------
@api_view(['POST'])
def restore_staff(request, staff_id):
    deleted_staff = DeletedStaff.objects(id=staff_id).first()
    if not deleted_staff:
        return Response({"error": "Deleted staff not found"}, status=status.HTTP_404_NOT_FOUND)

    Staff(
        name=deleted_staff.name,
        email=deleted_staff.email,
        phone=deleted_staff.phone,
        location=deleted_staff.location,
        photo_url=deleted_staff.photo_url,
        is_active=True,
        created_at=get_ist_now()
    ).save()

    deleted_staff.delete()
    return Response({"success": True, "message": "Staff restored successfully"})


# ------------------------------
#   Dashboard Stats
# ------------------------------
@api_view(['GET'])
def dashboard_stats(request):
    total = BookServiceComplaint.objects.count()
    completed = BookServiceComplaint.objects(status="completed").count()
    pending = BookServiceComplaint.objects(status="pending").count()
    assigned = BookServiceComplaint.objects(status="assigned").count()
    initial = BookServiceComplaint.objects(status="initial").count()

    # Calculate additional stats as requested
    full = total  # All complaints
    active = pending + assigned + initial  # Work in progress

    return Response({
        "full": full,
        "total": active,  # Sum of active complaints (pending + assigned + initial)
        "pending": pending,
        "completed": completed
    })


# ------------------------------
#   Service Reminders
# ------------------------------

@api_view(['GET'])
def service_reminders(request):
    now = get_ist_now()

    # 🔹 1️⃣ DATA QUERY (SHOW ALL RECORDS)
    all_reminders = BookServiceComplaint.objects(
        next_service_date__lt=now,
        next_service_date__ne=None,
        warranty_completed=False
    ).order_by('next_service_date')

    # 🔹 2️⃣ SMS QUERY (SEND ONLY ONCE)
    # (SMS sending commented out)
    # pending_sms = all_reminders.filter(reminder_sent=False)
    # print(f"Total reminders: {all_reminders.count()}, Pending SMS: {pending_sms.count()}")

    data = []

    # 🔹 3️⃣ SEND SMS ONLY FOR UNSENT
    # (SMS sending commented out)
    # for c in pending_sms:
    #     if c.phone:
    #         # Get customer from ClientDetails using customer_id from complaint
    #         customer = None
    #         if c.customer_id:
    #             customer = ClientDetails.objects(customer_id=c.customer_id).first()
    #
    #         try:
    #             res = send_reminder_sms(
    #                 mobile=c.phone,
    #                 cusname=c.customer_name,
    #                 cnum=str(c.complaint_no),
    #                 prod=c.product_name,
    #                 cid=c.customer_id  # Use customer_id instead of client_id
    #             )
    #
    #             print(f"SERVICE REMINDER SMS to {c.customer_name}:", res)
    #
    #             if res.get("Message_Id"):
    #                 c.reminder_sent = True
    #                 c.reminder_sent_at = get_ist_now()
    #                 c.save()
    #
    #         except Exception as e:
    #             print(f"Reminder SMS failed for {c.customer_name}:", e)

    for c in all_reminders:
        # Get customer_id from ClientDetails if customer exists
        customer = ClientDetails.objects(phone=c.phone).first()
        customer_id = customer.customer_id if customer else None

        data.append({
            "id": str(c.id),
            "complaint_no": c.complaint_no,
            "customer_name": c.customer_name,
            "customer_email": c.customer_email,
            "phone": c.phone,
            "address": c.address,
            "product_name": c.product_name,
            "details": c.details,
            "next_service_date": format_date(c.next_service_date),
            "status": c.status,
            "staff_name": c.staff_name,
            "customer_id": customer_id,
        })
    return Response(data)


# ------------------------------
#   Complaint CRUD (using merged model)
# ------------------------------
@api_view(['GET', 'POST'])
def complaint_list(request):
    if request.method == 'GET':
        try:
            branch_filter = request.GET.get('branch_name')
            query = BookServiceComplaint.objects
            if branch_filter:
                query = query.filter(branch_name=branch_filter)
                
            complaints = query.order_by('-date_created')
            
            # ⭐ Use the enhanced serializer for consistent formatting and totals
            # This replaces the manual calculation logic previously here
            serializer = BookServiceComplaintSerializer(complaints, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


    elif request.method == 'POST':
        serializer = BookServiceComplaintSerializer(data=request.data)
        if serializer.is_valid():
            complaint = serializer.save()
            if complaint.customer_email:
                subject = f"Complaint Received - {complaint.complaint_no}"
                message = (
                    f"Dear {complaint.customer_name},\n\n"
                    f"Your complaint ({complaint.complaint_no}) has been registered successfully.\n"
                    f"Issue: {complaint.details}\n"
                    f"Product Name: {complaint.product_name}\n"
                    f"Our team will contact you soon.\n\n"
                    f"Thank you,\nService Team"
                )
                try:
                    send_email_utf8(subject, message, [complaint.customer_email])
                except Exception as e:
                    print("  Failed to send registration email:", e)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# [STAR] Global helper for robust stock item lookup (Fuzzy Matching)
def get_stock_item(name, branch_name=None):
    if not name: return None
    name = str(name).strip()
    
    # 1. Exact case-insensitive match (stripped)
    query = {"name__iexact": name}
    if branch_name: query["branch_name"] = branch_name
    item = StockItem.objects(**query).first()
    if item: return item
    
    # 2. Fuzzy match - look for substrings (e.g., "Motor" in "Crompton Motor")
    query_all = {}
    if branch_name: query_all["branch_name"] = branch_name
    all_items = StockItem.objects(**query_all)
    best_match = None
    input_name = name.lower()
    
    for i in all_items:
        stock_name = i.name.lower().strip()
        # Direct check or substring match
        if input_name == stock_name or input_name in stock_name or stock_name in input_name:
            # If it contains "motor", prioritize it for motor-sounding names
            if 'motor' in input_name and 'motor' in stock_name:
                return i
            best_match = i
            
    return best_match

def process_stock_reduction_for_complaint(complaint, request=None):
    """
    Reduced stock for all products in a complaint (initial + additional + motors)
    when finalized.
    """
    if not complaint.status or complaint.status.lower() != "completed":
        return
    
    # Check if already reduced to prevent double deduction
    if hasattr(complaint, 'stock_reduced') and complaint.stock_reduced:
        print(f"[INFO] Stock already reduced for {complaint.complaint_no}. Skipping.")
        return

    import json
    reduced_count = 0
    performed_by = "System"
    if request:
        performed_by = request.headers.get('X-User-Name') or "System"

    processed_brands = [] # Track brands processed to avoid double deduction for motors
    all_products_to_process = []

    # 1. Collect initial products (product_name)
    if complaint.product_name:
        try:
            if isinstance(complaint.product_name, str):
                try:
                    p_list = json.loads(complaint.product_name)
                    if not isinstance(p_list, list): p_list = [p_list]
                except:
                    p_list = [{"productName": complaint.product_name, "quantity": getattr(complaint, 'product_quantity', 1) or 1}]
            else:
                p_list = complaint.product_name
            
            if isinstance(p_list, list):
                for p in p_list:
                    p['source_type'] = 'booking'
                    all_products_to_process.append(p)
        except Exception as e:
            print(f"[ERROR] Parsing initial products for {complaint.complaint_no}: {e}")

    # 2. Collect additional products (additional_product)
    if complaint.additional_product:
        try:
            if isinstance(complaint.additional_product, str):
                try:
                    a_list = json.loads(complaint.additional_product)
                    if not isinstance(a_list, list): a_list = [a_list]
                except:
                    a_list = [{"productName": complaint.additional_product, "quantity": complaint.additional_product_quantity or 1}]
            else:
                a_list = complaint.additional_product
                
            if isinstance(a_list, list):
                for p in a_list:
                    p['source_type'] = 'additional_product'
                    all_products_to_process.append(p)
        except Exception as e:
            print(f"[ERROR] Parsing additional products for {complaint.complaint_no}: {e}")

    # 3. Unified processing loop
    for p in all_products_to_process:
        try:
            name = p.get('productName') or p.get('name') or p.get('product_name')
            qty = int(p.get('quantity') or p.get('qty') or 1)
            brand = p.get('motor_brand') or p.get('brand_name') or p.get('brand')
            brand_id = p.get('brand_id')
            source = p.get('source_type', 'transaction')
            
            if name:
                print(f"[SCAN] Searching stock for: {name} (qty: {qty})")
                stock_item = get_stock_item(name, branch_name=getattr(complaint, 'branch_name', None))
                if stock_item:
                    old_qty = stock_item.quantity
                    success, msg = stock_item.reduce_stock(qty, brand_name=brand, brand_id=brand_id, check_threshold=True)
                    if success:
                        stock_item.reload() 
                        record_stock_history(
                            stock_item=stock_item,
                            operation_type='reduce',
                            quantity=qty,
                            previous_quantity=old_qty,
                            new_quantity=stock_item.quantity,
                            performed_by=performed_by,
                            notes=f"{source.replace('_',' ').title()} for {complaint.complaint_no}",
                            motor_brand=brand,
                            type='out',
                            source=source,
                            complaint_no=complaint.complaint_no,
                            customer_id=complaint.customer_id
                        )
                        # Track brand for history
                        if brand: processed_brands.append(brand.lower())
                        
                        reduced_count += 1
                        print(f"[OK] Reduced stock for {name} ({qty})")
                else:
                    print(f"[WARN] No stock item found matching: {name}")
        except Exception as e:
            print(f"[ERROR] Processing product {p.get('productName')} for {complaint.complaint_no}: {e}")

    # 4. Final status update
    if reduced_count > 0:
        complaint.stock_reduced = True
        complaint.save()
        print(f"[OK] Stock reduction completed for {complaint.complaint_no} ({reduced_count} items)")
    else:
        # Prevent re-running if there were no items found (marks as processed)
        complaint.stock_reduced = True
        complaint.save()
        print(f"[INFO] No items to reduce for {complaint.complaint_no}. Marked as processed.")



@api_view(['GET', 'PUT', 'DELETE'])
def complaint_detail(request, pk):
    try:
        complaint = BookServiceComplaint.objects.get(id=ObjectId(pk))
    except BookServiceComplaint.DoesNotExist:
        return Response({"error": "Complaint not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = BookServiceComplaintSerializer(complaint)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = BookServiceComplaintSerializer(complaint, data=request.data, partial=True)
        if serializer.is_valid():
            complaint = serializer.save()

            # Extract and save client_amount from remarks when completing
            if complaint.status and complaint.status.lower() == "completed":
                if complaint.remarks:
                    try:
                        import re
                        numbers = re.findall(r'\d+\.?\d*', complaint.remarks)
                        if numbers:
                            complaint.client_amount = float(numbers[0])
                            complaint.save()
                    except:
                        pass

                # ----------------------------------
                # ✅ NEW: UNIFIED STOCK REDUCTION ON COMPLETION
                # ----------------------------------
                process_stock_reduction_for_complaint(complaint, request)

                # ----------------------------------
                # ✅ NEW: Save Expired/Scrap Items collected from customer
                # ----------------------------------
                expired_items_data = request.data.get('expired_items', [])
                if expired_items_data:
                    try:
                        if isinstance(expired_items_data, str):
                            import json
                            expired_items_data = json.loads(expired_items_data)
                        for ei in expired_items_data:
                            if ei.get('name'):
                                ExpiredItem(
                                    complaint_no=complaint.complaint_no,
                                    name=ei.get('name', ''),
                                    buying_price=float(ei.get('buying_price', 0)),
                                    buy_date=get_ist_now(),
                                    branch_name=complaint.branch_name
                                ).save()
                    except Exception as ex:
                        print(f"[ExpiredItem] Error saving expired items: {ex}")

                # ----------------------------------
                # ✅ NEW: Save staff incentive on the complaint
                # ----------------------------------
                staff_incentive = request.data.get('staff_incentive', 0)
                try:
                    complaint.staff_incentive = float(staff_incentive)
                except (TypeError, ValueError):
                    complaint.staff_incentive = 0.0

                complaint.save()
            # -----------------------------
            # SMS LOGIC (COMMENTED OUT)
            # -----------------------------
            # staff = Staff.objects(name=complaint.staff_name).first()
            #
            # # Get customer_id from ClientDetails using customer_id from complaint
            # print("Fetching customer_id for customer_id:", complaint.customer_id)
            # customer_id = None
            # # First try to get customer_id from complaint.customer_id
            # if complaint.customer_id:
            #     customer = ClientDetails.objects(customer_id=complaint.customer_id).first()
            #     if customer:
            #         customer_id = customer.customer_id
            # # Fallback: If customer_id not found, try to get from phone number
            # if not customer_id and complaint.phone:
            #     customer = ClientDetails.objects(phone=complaint.phone).first()
            #     if customer:
            #         customer_id = customer.customer_id
            #
            # print("Customer ID for SMS:", customer_id)
            # # Customer SMS - Using BSNL SMS
            # if complaint.phone:
            #     try:
            #         # Ensure client_amount is not None
            #         amt = complaint.client_amount if complaint.client_amount else 0
            #         res = send_task_completion_sms(
            #             mobile=complaint.phone,
            #             cusname=complaint.customer_name,
            #             cnum= complaint.complaint_no.split("-")[-1],
            #             amt=amt,
            #             cid=customer_id  # Use customer_id instead of client_id
            #         )
            #         print("  CUSTOMER BSNL SMS RESPONSE:", res)
            #     except Exception as e:
            #         print("  CUSTOMER BSNL SMS ERROR:", e)
            #
            #     # # Staff SMS
            #     # if staff and staff.phone:
            #     #     staff_sms = (
            #     #         f"TEST Completed!\n"
            #     #         f"Complaint No: {complaint.complaint_no}\n"
            #     #         f"Customer: {complaint.customer_name}\n"
            #     #         f"Details: {complaint.details}\n"
            #     #         f"Payment: {complaint.payment_method}\n"
            #     #         f"Remarks: {complaint.remarks}\n"
            #     #         f"Submit report to admin."
            #     #     )
            #     #     try:
            #     #         res2 = send_sms(staff.phone, staff_sms)
            #     #         print("  STAFF SMS RESPONSE:", res2)
            #     #     except Exception as e:
            #     #         print("  STAFF SMS ERROR:", e)

            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# ------------------------------
#   Helper to send UTF-8 Email
# ------------------------------
def send_email_utf8(subject, message, recipient_list):
    subject = subject.replace('\xa0', ' ').strip()
    message = message.replace('\xa0', ' ').strip()
    email = EmailMessage(subject=subject, body=message, from_email=settings.EMAIL_HOST_USER, to=recipient_list)
    email.encoding = 'utf-8'
    email.send(fail_silently=False)


# ------------------------------
#   Update Complaint Status
# ------------------------------
#   Create New Complaint
# ------------------------------
class BookServiceCreateView(APIView):

    def post(self, request):

        data = request.data.copy()

        # ----------------------------------
        # ✅ 1️⃣ FIELD FIX
        # ----------------------------------
        phone = data.get("customer_phone")
        customer_name = data.get("customer_name")
        address = data.get("address")
        email = data.get("customer_email")

        # Extract GPS coordinates (latitude and longitude)
        latitude = data.get("latitude")
        longitude = data.get("longitude")
        
        # Also support location object format
        location_obj = data.get("location")
        if location_obj and isinstance(location_obj, dict):
            latitude = location_obj.get("latitude")
            longitude = location_obj.get("longitude")

        if not phone:
            return Response({"success": False, "error": "Phone is required"}, status=400)

        if not customer_name:
            return Response({"success": False, "error": "Customer name is required"}, status=400)

        if not address and not (latitude and longitude):
            return Response({"success": False, "error": "Address is required (either manual address or GPS coordinates)"}, status=400)


        # ----------------------------------
        # ✅ 2️⃣ HANDLE GPS TO ADDRESS CONVERSION
        # ----------------------------------
        final_address = address
        
        if latitude is not None and longitude is not None:
            try:
                # Try to convert GPS coordinates to address
                formatted_address = reverse_geocode(latitude, longitude)
                if formatted_address:
                    final_address = formatted_address
                    print("✅ GPS converted to address:", final_address)
                else:
                    print("⚠️  GPS reverse geocoding failed, using manual address")
            except Exception as e:
                print(f"⚠️  GPS conversion error: {e}, using manual address")

        # ----------------------------------
        # ✅ 3️⃣ CREATE / FETCH CLIENT FIRST
        # ----------------------------------
        # Check for existing client by phone number (primary unique field)
        existing_client = ClientDetails.objects(phone=phone).first()

        if existing_client:
            # Fix null customer_id if exists
            if not existing_client.customer_id:
                # Generate a proper customer_id with pattern: cust_CustomerName_X
                last = ClientDetails.objects(customer_id__startswith="cust_").order_by("-customer_id").first()
                if last and last.customer_id:
                    try:
                        number = int(last.customer_id.split("_")[-1])
                    except:
                        number = 0
                    new_number = number + 1
                else:
                    new_number = 1
                # Create customer_id with name: cust_John_1
                name_part = "".join(c for c in customer_name[:10] if c.isalnum()) if customer_name else "Customer"
                existing_client.customer_id = f"cust_{name_part}_{new_number}"
                existing_client.save()
            
            customer_id = existing_client.customer_id
            print("✅ Existing Client Found:", customer_id)
            
            # Update existing client's address if GPS was provided
            if latitude is not None and longitude is not None:
                existing_client.address = final_address
                existing_client.location = {"latitude": latitude, "longitude": longitude}
                existing_client.save()
                print("✅ Updated existing client address with GPS location")
        else:
            # Create new client - generate customer_id first to avoid null issue
            # Find highest existing customer_id with pattern cust_CustomerName_X
            last_client = ClientDetails.objects(customer_id__startswith="cust_").order_by("-customer_id").first()
            if last_client and last_client.customer_id:
                try:
                    number = int(last_client.customer_id.split("_")[-1])
                except:
                    number = 0
                new_number = number + 1
            else:
                new_number = 1
            
            # Create customer_id with name: cust_John_1
            name_part = "".join(c for c in customer_name[:10] if c.isalnum()) if customer_name else "Customer"
            generated_customer_id = f"cust_{name_part}_{new_number}"
            
            client_data = {
                "customer_id": generated_customer_id,  # Pre-generate to avoid null
                "customer_name": customer_name,
                "customer_email": email,
                "phone": phone,
                "alternate_number": data.get("alternate_number", ""),
                "address": final_address,  # Use converted address
                "customer_type": data.get("customer_type", "our_customer")
            }
            
            # Store GPS coordinates if available
            if latitude is not None and longitude is not None:
                client_data["location"] = {"latitude": latitude, "longitude": longitude}
            
            client = ClientDetails(**client_data)
            client.save()
            customer_id = client.customer_id
            print("✅ New Client Created:", customer_id)


        # ----------------------------------
        # ✅ 4️⃣ ASSIGN CLIENT ID INTO BOOKING
        # ----------------------------------
        data["customer_id"] = customer_id

        # complaint fields mapping
        data["phone"] = phone
        data["details"] = data.get("complaint_details")
        data["address"] = final_address


        # ----------------------------------
        # ✅ 5️⃣ HANDLE WARRANTY PHOTO UPLOAD
        # ----------------------------------
        if "warranty_photo" in request.FILES:
            warranty_photo = request.FILES["warranty_photo"]

            file_path = default_storage.save(
                f"warranty_photos/{warranty_photo.name}",
                warranty_photo
            )

            data["warranty_photo"] = f"/media/{file_path}"


        # ----------------------------------
        # ✅ 6️⃣ HANDLE PRODUCT QUANTITY AND STOCK VALIDATION
        # ----------------------------------
        product_name = data.get("product_name")
        product_quantity = int(data.get("product_quantity", 0))  # Default to 0 for optional products
        
        # Check if product_name is a JSON string (multiple products)
        if product_name and product_name.startswith('['):
            try:
                import json
                products_list = json.loads(product_name)
                
                if not isinstance(products_list, list):
                    return Response({
                        "success": False,
                        "error": "Invalid product format."
                    }, status=400)
                
                # Process each product in the list
                for product_item in products_list:
                    prod_name = product_item.get('productName')
                    prod_qty = int(product_item.get('quantity', 0))
                    
                    if not prod_name or prod_qty <= 0:
                        continue
                    
                    # Find the stock item by product name and branch
                    branch_name = data.get('branch_name', 'Main Branch')
                    stock_item = StockItem.objects(name=prod_name, branch_name=branch_name).first()
                    
                    if not stock_item:
                        return Response({
                            "success": False,
                            "error": f"Product '{prod_name}' not found in stock."
                        }, status=400)
                    
                    # ⭐ NEW: Minimum Threshold Validation
                    if (stock_item.quantity - prod_qty) < stock_item.minimum_threshold:
                        return Response({
                            "success": False,
                            "error": f"Cannot book '{prod_name}'. Stock would fall below the minimum threshold of {stock_item.minimum_threshold}."
                        }, status=400)
                    # Extract motor brand if available
                    motor_brand = product_item.get('motor_brand') or product_item.get('brand')
                    
                    print(f"📦 Product identified for booking: {prod_name}")
                
                # Store the product list as JSON string for the booking
                data["product_name"] = product_name
                data["product_quantity"] = product_quantity
                
            except json.JSONDecodeError as e:
                return Response({
                    "success": False,
                    "error": "Invalid product JSON format."
                }, status=400)
            except Exception as e:
                print(f"⚠️  Stock validation error: {e}")
                return Response({
                    "success": False,
                    "error": "An error occurred while validating stock. Please try again."
                }, status=500)
        elif product_name and product_quantity > 0:
            # Single product handling (backward compatibility)
            print(f"📦 Legacy product identified for booking: {product_name}")


        # ----------------------------------
        # ✅ 7️⃣ COMPLETE ORIGINAL COMPLAINT
        # ----------------------------------
        if data.get("original_complaint_id"):

            raw_id = data.pop("original_complaint_id")
            original_id = raw_id[0] if isinstance(raw_id, list) else raw_id

            original_complaint = BookServiceComplaint.objects(
                complaint_no=original_id
            ).first()

            if original_complaint:
                original_complaint.warranty_completed = True
                original_complaint.save()


        # ----------------------------------
        # ✅ 8️⃣ NOW SAVE BOOK SERVICE COMPLAINT
        # ----------------------------------
        serializer = BookServiceComplaintSerializer(data=data)

        if not serializer.is_valid():
            return Response(
                {"success": False, "errors": serializer.errors},
                status=400
            )

        complaint = serializer.save()

        # ----------------------------------
        # ✅ 9️⃣ AUTO-CREATE MOTOR DETAILS FOR SALES
        # ----------------------------------
        if data.get("job_type") == "motor_sale" or data.get("job_category") == "motor_sale":
            try:
                # Find motor product in the booked products
                import json
                products = json.loads(complaint.product_name) if complaint.product_name else []
                for p in products:
                    if 'motor' in p.get('productName', '').lower() or p.get('isMotor') or p.get('isMotorSale'):
                        create_motor_history_record(complaint, p, brand_id=p.get('brand_id'))
                
                # Check additional products for motor sales
                add_products = complaint.additional_product
                if add_products:
                    if isinstance(add_products, str):
                        try:
                            add_products_list = json.loads(add_products)
                        except json.JSONDecodeError:
                            add_products_list = [{"productName": add_products, "quantity": complaint.additional_product_quantity or 1}]
                    else:
                        add_products_list = add_products
                        
                    if isinstance(add_products_list, list):
                        for p in add_products_list:
                            prod_name = p.get('productName') or p.get('name') or p.get('product_name') or ''
                            # motor history removed (purge)

            except Exception as e:
                print(f"⚠️  Failed to process motor-related sale logic: {e}")

        # Placeholder creation removed (motor module purge)

        # ----------------------------------
        # ✅ 11️⃣ HANDLE MOTOR DATA (Redundant creation removed - handled by serializer)
        # ----------------------------------
        # The motor-related records creation removed (purge)
        # for both motor_service and motor_sale jobs.
        
        # Only keep the sale-specific logic that updates the complaint's product list if needed
        motor_data = data.get('motor_data')
        job_type = data.get('job_type')
        
        if motor_data and job_type == 'motor_sale':
            try:
                import json
                if isinstance(motor_data, str):
                    motor_data = json.loads(motor_data)
                
                # For motor_sales, add motor as a product in product_name if not already there
                motor_make = motor_data.get('motor_make', '')
                hp = motor_data.get('hp', '')
                motor_amount = float(motor_data.get('motor_amount', 0))
                
                # Check if motor is already in products
                current_products = []
                if complaint.product_name:
                    try:
                        current_products = json.loads(complaint.product_name)
                    except: pass
                
                has_motor = any('motor' in str(p.get('productName', '')).lower() for p in current_products)
                
                if not has_motor:
                    # Create product name from motor details
                    product_name = f"{motor_make} {hp}HP Motor" if motor_make and hp else "Motor"
                    discount_percent = float(motor_data.get('discount_percent', 0))
                    
                    final_motor_amount = motor_amount
                    if discount_percent > 0:
                        final_motor_amount = motor_amount - (motor_amount * (discount_percent / 100))
                    
                    motor_product = {
                        'productName': product_name,
                        'quantity': 1,
                        'isMotorSale': True,
                        'motorAmount': motor_amount,
                        'discountPercent': discount_percent,
                        'selling_price': motor_amount,
                        'final_price': final_motor_amount
                    }
                    
                    current_products.append(motor_product)
                    complaint.product_name = json.dumps(current_products)
                    complaint.product_quantity = (complaint.product_quantity or 0) + 1
                    complaint.save()
                    print(f"✅ Motor sales product added to complaint: {product_name}")
            except Exception as e:
                print(f"⚠️ Error updating sale product info: {e}")
        

        # ----------------------------------
        # ✅ 12️⃣ SEND SMS AFTER SAVE (COMMENTED OUT)
        # ----------------------------------
        # if complaint.phone:
        #     try:
        #         txn_res = send_bsnl_sms(
        #             cid=customer_id,  # Use customer_id instead of client_id
        #             mobile=complaint.phone,
        #             cusname=complaint.customer_name,
        #             cnum=complaint.complaint_no.split("-")[-1]
        #         )
        #
        #         if isinstance(txn_res, dict) and txn_res.get("Message_Id"):
        #             send_promotional_sms(mobile=complaint.phone)
        #
        #     except Exception as e:
        #         print("SMS failed:", e)


        # ----------------------------------
        # ✅ 10️⃣ FINAL RESPONSE
        # ----------------------------------
        return Response(
            {
                "success": True,
                "message": "Booking confirmed successfully",
                "complaint_no": complaint.complaint_no,
                "customer_id": customer_id
            },
            status=201
        )


# ------------------------------
#   Select Staff (Available / Pending)
# ------------------------------
from mongoengine.queryset.visitor import Q
class SelectStaffListView(APIView):
    def get(self, request):
        mode = request.GET.get("mode", "available")
        branch_filter = request.GET.get("branch_name")

        # Get today's date for attendance check
        from datetime import datetime, timedelta
        today = get_ist_now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # -------------------
        # AVAILABLE STAFF MODE
        # -------------------
        if mode == "available":
            # Get all staff
            query = Staff.objects()
            if branch_filter:
                query = query.filter(branch_name=branch_filter)
            available_staffs = query

            data = []
            for s in available_staffs:
                # Check if staff is present today based on attendance
                attendance = StaffAttendance.objects(
                    staff_name=s.name,
                    date__gte=today,
                    date__lt=today + timedelta(days=1)
                ).first()
                
                # Only include staff who are marked as Present today
                if attendance and attendance.status == "Present":
                    if s.photo_url:
                        photo_url = s.photo_url if s.photo_url.startswith("http") else request.build_absolute_uri(s.photo_url)
                    else:
                        photo_url = ""

                    data.append({
                        "name": s.name,
                        "phone": s.phone,
                        "location": s.location,
                        "photo_url": photo_url,
                        "branch_name": s.branch_name or "Main Hub",
                    })

            return Response(data, status=status.HTTP_200_OK)

        # -------------------
        # PENDING STAFF MODE
        # -------------------
        elif mode == "pending":
            assignments = BookServiceComplaint.objects(status="pending")
            grouped_data = {}

            for a in assignments:
                staff = Staff.objects(name=a.staff_name).first()
                if not staff:
                    continue

                photo_url = staff.photo_url if staff.photo_url and staff.photo_url.startswith("http") \
                    else request.build_absolute_uri(staff.photo_url) if staff.photo_url else ""

                if staff.name not in grouped_data:
                    grouped_data[staff.name] = {
                        "name": staff.name,
                        "phone": staff.phone,
                        "location": staff.location,
                        "photo_url": photo_url,
                        "branch_name": staff.branch_name or "Main Hub",
                        "complaints": []
                    }

                grouped_data[staff.name]["complaints"].append({
                    "complaint_no": a.complaint_no,
                    "customer_address": a.address,
                    "customer_phone": a.phone,
                })

            data = list(grouped_data.values())
            return Response(data, status=status.HTTP_200_OK)


# ------------------------------
#   Assign Staff to Complaint + Send Emails
# ------------------------------
class AssignStaffToComplaintView(APIView):
    def post(self, request):
        try:
            complaint_no = request.data.get("complaint_no")
            staff_name = request.data.get("staff_name")
            amount = request.data.get("amount")  # Amount is now optional

            if not complaint_no or not staff_name:
                return Response({"success": False, "error": "Missing complaint_no or staff_name"}, status=400)

            # Fetch complaint
            complaint = BookServiceComplaint.objects(complaint_no=complaint_no).first()
            if not complaint:
                return Response({"success": False, "error": "Complaint not found"}, status=404)

            # Get customer_id from ClientDetails if customer exists
            client = ClientDetails.objects(phone=complaint.phone).first()
            customer_id = client.customer_id if client else None

            # Fetch staff
            staff = Staff.objects(name=staff_name).first()
            if not staff:
                return Response({"success": False, "error": "Staff not found"}, status=404)

            # Update complaint assignment
            complaint.staff_name = staff_name
            complaint.status = "pending"
            complaint.assigned = True
            complaint.assigned_at = get_ist_now()
            complaint.amount = float(amount) if amount else 0.0
            complaint.save()

            # EMAILS
            customer_email = complaint.customer_email
            staff_email = staff.email
            emails_sent = []
            sms_sent = []

            # """
            # -----------------------------
            #   EMAIL TO STAFF
            # -----------------------------
            # """
            # if staff_email:
            #     subject_staff = f"New Complaint Assigned - {complaint.complaint_no}"
            #     message_staff = (
            #         f"Hi {staff.name},\n\n"
            #         f"You have been assigned a new complaint.\n\n"
            #         f"Complaint No: {complaint.complaint_no}\n"
            #         f"Customer: {complaint.customer_name}\n"
            #         f"Phone: {complaint.phone}\n"
            #         f"Address: {complaint.address}\n"
            #         f"Issue: {complaint.details}\n\n"
            #         f"Please attend to this service as soon as possible.\n\n"
            #         f"Best regards,\nService Admin"
            #     )
            #     try:
            #         send_email_utf8(subject_staff, message_staff, [staff_email])
            #         emails_sent.append(staff_email)
            #     except Exception as e:
            #         print("  Staff email failed:", e)

            # """
            # -----------------------------
            #   EMAIL TO CUSTOMER
            # -----------------------------
            # """
            # if customer_email:
            #     subject_customer = f"Service Staff Assigned - {complaint.complaint_no}"
            #     message_customer = (
            #         f"Dear {complaint.customer_name},\n\n"
            #         f"A service staff has been assigned to your complaint ({complaint.complaint_no}).\n\n"
            #         f"Staff Details:\n"
            #         f"Name: {staff.name}\n"
            #         f"Phone: {staff.phone}\n"
            #         f"Location: {staff.location}\n"
            #         f"Email: {staff.email}\n\n"
            #         f"Our team will contact you shortly.\n\n"
            #         f"Thank you,\nService Team"
            #     )
            #     try:
            #         send_email_utf8(subject_customer, message_customer, [customer_email])
            #         emails_sent.append(customer_email)
            #     except Exception as e:
            #         print("  Customer email failed:", e)

            # """
            # -----------------------------
            # 📱 SMS TO STAFF (using BSNL SMS) - COMMENTED OUT
            # -----------------------------
            # """
            # def split_address_addi(address, limit=25):
            #     words = address.split(" ")
            #
            #     addi = ""
            #     addii = "" 
            #     current = ""
            #
            #     for word in words:
            #         if not addi:
            #             if len(current) + len(word) + 1 <= limit:
            #                 current = f"{current} {word}".strip()
            #             else:
            #                 addi = current
            #                 current = word
            #         else:
            #             if len(current) + len(word) + 1 <= limit:
            #                 current = f"{current} {word}".strip()
            #             else:
            #                 addii = current
            #                 break
            #
            #     if not addi:
            #         addi = current
            #     elif not addii:
            #         addii = current
            #
            #     return addi, addii

            # try:
            #     address = complaint.address or ""
            #
            #     addi, addii = split_address_addi(address)
            #
            #     print("ADDI :", addi)
            #     print("ADDII:", addii)
            #
            #     res = send_assign_staff_sms(
            #         cid=customer_id,  # Use customer_id instead of client_id
            #         mobile=staff.phone,
            #         staffname=staff.name,
            #         cnum=complaint.complaint_no.split("-")[-1],
            #         cusname=complaint.customer_name,
            #         phno=complaint.phone,
            #         addi=addi,
            #         addii=addii if addii else "N/A",
            #         comp=complaint.details,
            #         altno=complaint.alternate_number or "N/A"
            #     )
            #
            #     print("  STAFF BSNL SMS RESPONSE:", res)
            #     sms_sent.append(staff.phone)
            #
            # except Exception as e:
            #     print("  Staff BSNL SMS failed:", e)

            # """
            # -----------------------------
            # 📱 SMS TO CUSTOMER (using BSNL SMS) - COMMENTED OUT
            # -----------------------------
            # """
            # try:
            #     res = send_assign_customer_sms(
            #         mobile=complaint.phone,
            #         cusname=complaint.customer_name,
            #         staffname=staff.name,
            #         cusno=staff.phone,
            #         cnum = complaint.complaint_no.split("-")[-1]
            #     )
            #     
            #     print("  CUSTOMER BSNL SMS RESPONSE:", res)
            #     sms_sent.append(complaint.phone)
            # except Exception as e:
            #     print("  Customer BSNL SMS failed:", e)

            # Final Response
            return Response({
                "success": True,
                "message": f"Complaint {complaint_no} assigned to {staff_name}",
                "emails_sent": emails_sent,
                "sms_sent": sms_sent
            }, status=200)

        except Exception as e:
            traceback.print_exc()
            return Response({"success": False, "error": str(e)}, status=500)


# ------------------------------------
#   Get Customers By Type (Django API)
# ------------------------------------
@api_view(['GET', 'POST', 'PUT', 'DELETE'])
def customer_list(request):
    if request.method == 'GET':
        try:
            result = []

            # =====================================================
            # 1️⃣ CUSTOMERS FROM ClientDetails
            # =====================================================
            client_details_customers = ClientDetails.objects.filter(status="online")
            print(f"Found {client_details_customers.count()} customers in ClientDetails")
            
            # Get service_type filter from query params
            service_type_filter = request.query_params.get('service_type', None)
            
            # If filtering by service_type, get relevant phone numbers from bookings
            filtered_phones = set()
            if service_type_filter and service_type_filter in ['in_service', 'out_service']:
                bookings = BookServiceComplaint.objects(service_type=service_type_filter)
                for booking in bookings:
                    if booking.phone:
                        filtered_phones.add(booking.phone)
                print(f"Filtering by service_type: {service_type_filter}, found {len(filtered_phones)} phones")

            for c in client_details_customers:
                try:
                    # Apply service_type filter if specified
                    if service_type_filter and service_type_filter in ['in_service', 'out_service']:
                        if c.phone not in filtered_phones:
                            continue
                            
                    result.append({
                        "customer_id": c.customer_id,
                        "customer_name": c.customer_name,
                        "alternate_number": getattr(c, "alternate_number", ""),
                        "address": c.address,
                        "customer_type": c.customer_type,
                        "phone": c.phone,
                        "customer_email": c.customer_email,
                        "status": c.status,
                        "location": getattr(c, "location", {}),
                    })
                except Exception as e:
                    print(f"Error processing customer: {e}")
                    continue

            # Only show customers from ClientDetails module

            print(f"Total customers returned: {len(result)}")
            return Response(result, status=200)
        except Exception as e:
            print(f"Error fetching customers: {e}")
            return Response({"error": str(e)}, status=500)


    elif request.method == "POST":

        data = request.data.copy()

        # -----------------------------------
        # ✅ Step 1: Extract Required Fields
        # -----------------------------------
        phone = data.get("customer_phone")
        customer_name = data.get("customer_name")
        address = data.get("address")
        email = data.get("customer_email")
        
        # Extract GPS coordinates (latitude and longitude)
        latitude = data.get("latitude")
        longitude = data.get("longitude")
        
        # Also support location object format
        location_obj = data.get("location")
        if location_obj and isinstance(location_obj, dict):
            latitude = location_obj.get("latitude")
            longitude = location_obj.get("longitude")

        if not phone or not customer_name:
            return Response({
                "success": False,
                "error": "Phone and Name are required"
            }, status=400)

        # -----------------------------------
        # ✅ Step 2: Handle GPS to Address Conversion
        # -----------------------------------
        final_address = address
        
        if latitude is not None and longitude is not None:
            try:
                # Try to convert GPS coordinates to address
                formatted_address = reverse_geocode(latitude, longitude)
                if formatted_address:
                    final_address = formatted_address
                    print("✅ GPS converted to address:", final_address)
                else:
                    print("⚠️  GPS reverse geocoding failed, using manual address")
            except Exception as e:
                print(f"⚠️  GPS conversion error: {e}, using manual address")
        elif not address:
            return Response({
                "success": False,
                "error": "Address is required (either manual address or GPS coordinates)"
            }, status=400)

        # -----------------------------------
        # ✅ Step 3: Create / Fetch ClientDetails FIRST
        # -----------------------------------
        existing_client = ClientDetails.objects(phone=phone).first()
        print("DATA:", data)
        if existing_client:
            customer_id = existing_client.customer_id
            print("✅ Existing Client Found:", customer_id)
        
            # Update existing client's address if GPS was provided
            if latitude is not None and longitude is not None:
                existing_client.address = final_address
                existing_client.save()
                print("✅ Updated existing client address with GPS location")

        else:
            client = ClientDetails(
                customer_name=customer_name,
                customer_email=email,
                phone=phone,
                alternate_number=data.get("alternate_number", ""),
                address=final_address,  # Use converted address or manual address
                customer_type=data.get("customer_type", "our_customer")
            )
            client.save()

            customer_id = client.customer_id
            print("✅ New Client Created:", customer_id)

        # -----------------------------------
        # ✅ Step 4: Save Complaint With customer_id
        # -----------------------------------
        data["customer_id"] = customer_id   # ✅ Link here
        data["address"] = final_address    # ✅ Use converted address

        # ✅ Default complaint status
        # ⭐ CHANGED: Set status to 'pending' for backward compatibility
        # Use is_initial flag to distinguish initial records from real complaints
        data["status"] = "pending"
        data["is_initial"] = True

        # -----------------------------------
        # ✅ Step 5: Save Complaint
        # -----------------------------------
        serializer = BookServiceComplaintSerializer(data=data)

        if not serializer.is_valid():
            print("[ERROR] Complaint Errors:", serializer.errors)
            return Response({
                "success": False,
                "errors": serializer.errors
            }, status=400)

        complaint = serializer.save()

        # -----------------------------------
        # ✅ Final Response
        # -----------------------------------
        return Response({
            "success": True,
            "message": "Client saved and complaint booked successfully",

            # ✅ Customer ID stored in ClientDetails
            "customer_id": customer_id,

            # ✅ Same ID stored in Complaint model
            "customer_id": complaint.customer_id,

            "complaint_no": complaint.complaint_no
        }, status=201)

    
    elif request.method == 'PUT':
        customer_id = request.data.get('customer_id')
        if not customer_id:
            return Response({"error": "Customer ID is required"}, status=400)

        # Find customer in ClientDetails
        customer = ClientDetails.objects(customer_id=customer_id).first()
        if not customer:
            return Response({"error": "Customer not found"}, status=404)

        # Update customer fields
        customer.customer_name = request.data.get('customer_name', customer.customer_name)
        customer.phone = request.data.get('phone', customer.phone)
        customer.address = request.data.get('address', customer.address)
        customer.customer_email = request.data.get('customer_email', customer.customer_email)
        customer.customer_type = request.data.get('customer_type', customer.customer_type)

        customer.save()

        return Response({
            "success": True,
            "message": "Customer updated successfully",
            "customer": {
                "customer_id": customer.customer_id,
                "customer_name": customer.customer_name,
                "phone": customer.phone,
                "address": customer.address,
                "customer_email": customer.customer_email,
                "customer_type": customer.customer_type
            }
        })

    elif request.method == 'DELETE':
        # Support both query parameter and request body
        customer_id = request.query_params.get('customer_id') or request.data.get('customer_id')
        
        print("=" * 50)
        print("DELETE CUSTOMER REQUEST")
        print("Customer ID received:", customer_id)
        print("Query params:", request.query_params)
        print("Data:", request.data)
        print("=" * 50)
        
        if not customer_id:
            return Response({"error": "Customer ID is required", "success": False}, status=400)

        # Find customer in ClientDetails
        print("Searching for customer in ClientDetails...")
        customer = ClientDetails.objects(customer_id=customer_id).first()
        
        if customer:
            print("Customer found! Setting status to offline...")
            # Soft delete - set status to offline
            customer.status = "offline"
            customer.save()
            print("Customer marked as offline")
            return Response({
                "success": True,
                "message": "Customer deleted successfully"
            })
        else:
            # Check if it's a service customer (exists only in BookServiceComplaint)
            print("Customer not in ClientDetails, checking BookServiceComplaint...")
            service_records = BookServiceComplaint.objects(customer_id=customer_id)
            
            if service_records:
                # Delete all associated service records
                deleted_count = service_records.delete()
                print(f"Deleted {deleted_count} service records for customer_id: {customer_id}")
                return Response({
                    "success": True,
                    "message": "Customer service records deleted successfully"
                })
            else:
                print("Customer not found in either collection")
                return Response({
                    "error": "Customer not found", 
                    "success": False
                }, status=404)

# ------------------------------------
#   Daily Performance Report (By Date)
# ------------------------------------
@api_view(['GET'])
def daily_performance_report(request):
    from datetime import datetime, timedelta
    from collections import defaultdict

    # Get filter parameters
    days = int(request.GET.get('days', 30))  # Default to last 30 days
    staff_name_filter = request.GET.get('staff_name', '').strip()

    # Calculate date range
    end_date = get_ist_now().date()
    start_date = end_date - timedelta(days=days)

    # Get filter parameters
    staff_name_filter = request.GET.get('staff_name', '').strip()
    days = int(request.GET.get('days', 7))  # Default to last 7 days to show current data

    # Calculate date range - show recent data including today
    end_date = get_ist_now().date()
    start_date = end_date - timedelta(days=days)

    # Query for completed complaints within date range
    query = BookServiceComplaint.objects(
        assigned_completed_at__ne=None,
        staff_name__ne=None,
        assigned_completed_at__gte=datetime.combine(start_date, datetime.min.time()),
        assigned_completed_at__lte=datetime.combine(end_date, datetime.max.time())
    )

    # Apply staff name filter if provided
    if staff_name_filter:
        query = query.filter(staff_name__icontains=staff_name_filter)

    # Apply staff name filter if provided
    if staff_name_filter:
        query = query.filter(staff_name__icontains=staff_name_filter)

    completed_complaints = query

    # Group by date
    daily_stats = defaultdict(lambda: {
        'date': '',
        'total_jobs': 0,
        'total_client_payments': 0.0,
        'total_company_payments': 0.0,
        'staff_breakdown': defaultdict(lambda: {
            'jobs': 0,
            'client_payments': 0.0,
            'company_payments': 0.0
        })
    })

    for complaint in completed_complaints:
        if complaint.assigned_completed_at:
            # Get date only
            if hasattr(complaint.assigned_completed_at, 'date'):
                completed_date = complaint.assigned_completed_at.date()
            else:
                try:
                    completed_date = datetime.strptime(str(complaint.assigned_completed_at).split(' ')[0], '%Y-%m-%d').date()
                except:
                    continue

            date_key = completed_date.strftime('%Y-%m-%d')

            # Extract payment amounts
            client_amount = 0.0
            if complaint.remarks:
                try:
                    import re
                    numbers = re.findall(r'\d+\.?\d*', complaint.remarks)
                    if numbers:
                        client_amount = float(numbers[0])
                except:
                    client_amount = 0.0

            company_amount = complaint.amount or 0.0

            # Update daily totals
            daily_stats[date_key]['date'] = date_key
            daily_stats[date_key]['total_jobs'] += 1
            daily_stats[date_key]['total_client_payments'] += client_amount
            daily_stats[date_key]['total_company_payments'] += float(company_amount)

            # Update staff breakdown for this date
            staff_name = complaint.staff_name
            daily_stats[date_key]['staff_breakdown'][staff_name]['jobs'] += 1
            daily_stats[date_key]['staff_breakdown'][staff_name]['client_payments'] += client_amount
            daily_stats[date_key]['staff_breakdown'][staff_name]['company_payments'] += float(company_amount)

    # Convert to list format and sort by date (newest first)
    result = []
    for date_key, stats in daily_stats.items():
        # Convert staff_breakdown defaultdict to regular dict
        staff_breakdown = {}
        for staff_name, staff_stats in stats['staff_breakdown'].items():
            staff_breakdown[staff_name] = dict(staff_stats)

        result.append({
            'date': stats['date'],
            'total_jobs': stats['total_jobs'],
            'total_client_payments': round(stats['total_client_payments'], 2),
            'total_company_payments': round(stats['total_company_payments'], 2),
            'staff_breakdown': staff_breakdown
        })

    # Sort by date (newest first)
    result.sort(key=lambda x: x['date'], reverse=True)

    return Response(result, status=200)

# ------------------------------------
#   Get Customer By Phone (for auto-fill)
# ------------------------------------
@api_view(['GET'])
def get_customer_by_phone(request):
    phone = request.GET.get('phone')

    if not phone:
        return Response({"error": "Phone number is required"}, status=400)

    # Step 1: Find Client by phone in ClientDetails
    # First try to find by main phone number
    client = ClientDetails.objects(phone=phone, status="online").first()
    
    # If not found by main phone, try to find by alternate number
    if not client:
        client = ClientDetails.objects(alternate_number=phone, status="online").first()

    if not client:
        return Response(
            {"found": False, "message": "Customer not found"},
            status=404
        )

    # Step 2: Get all complaints for this client
    # Use the main phone number from the client record to find complaints
    main_phone = client.phone
    complaints = BookServiceComplaint.objects(phone=main_phone)

    # Step 3: Format response
    complaint_list = []
    for c in complaints:
        complaint_data = {
            "complaint_no": c.complaint_no,
            "product_name": c.product_name,
            "details": c.details,
            "phone": c.phone,
            "status": c.status,
            "assigned": c.assigned,
            "staff_name": c.staff_name,
            "payment_method": c.payment_method,
            "remarks": c.remarks,
            "date_created": format_date(c.date_created),
            # ⭐ NEW: Include is_initial for Booking page to show Initial badge
            "is_initial": c.is_initial if hasattr(c, 'is_initial') else False,
            "product_quantity": c.product_quantity if hasattr(c, 'product_quantity') else 1,
            "job_type": c.job_type if hasattr(c, 'job_type') else "",
            "job_category": c.job_category if hasattr(c, 'job_category') else ""
        }
        
        # Only add fields that have valid data (not None, empty, or "N/A")
        if c.assigned_at:
            complaint_data["assigned_at"] = format_date(c.assigned_at)
        if c.assigned_completed_at:
            complaint_data["assigned_completed_at"] = format_date(c.assigned_completed_at)
        if c.client_amount:
            complaint_data["client_amount"] = c.client_amount
        if c.next_service_date:
            complaint_data["next_service_date"] = format_date(c.next_service_date)
        if c.warranty_date:
            complaint_data["warranty_date"] = format_date(c.warranty_date)
        if c.warranty_photo:
            complaint_data["warranty_photo"] = c.warranty_photo

        complaint_list.append(complaint_data)

    return Response({
        "found": True,
        "customer_id": client.customer_id,
        "customer_name": client.customer_name,
        "customer_email": client.customer_email,
        "address": client.address,
        "customer_type": client.customer_type,
        "alternate_number": getattr(client, 'alternate_number', ''),
        "phone": client.phone,
        "location": getattr(client, "location", {}),
        "complaints": complaint_list
    })

# ------------------------------------
#   Get Customer By ID (for auto-fill)
# ------------------------------------
@api_view(['GET'])
def get_customer_by_id(request):
    customer_id = request.GET.get('customer_id')

    if not customer_id:
        return Response({"error": "Customer ID is required"}, status=400)

    # Step 1: Find Client by customer_id in ClientDetails
    client = ClientDetails.objects(customer_id=customer_id, status='online').first()

    if not client:
        return Response(
            {"found": False, "message": "Customer not found"},
            status=404
        )

    # Step 2: Get all complaints for this client
    complaints = BookServiceComplaint.objects(phone=client.phone)

    # Step 3: Format response
    complaint_list = []
    for c in complaints:
        complaint_list.append({
            "complaint_no": c.complaint_no,
            "product_name": c.product_name,
            "details": c.details,
            "status": c.status,
            "assigned": c.assigned,
            "staff_name": c.staff_name,
            "assigned_at": c.assigned_at,
            "payment_method": c.payment_method,
            "remarks": c.remarks,
            "date_created": c.date_created,
            # ⭐ NEW: Include is_initial for Booking page to show Initial badge
            "is_initial": c.is_initial if hasattr(c, 'is_initial') else False,
            "product_quantity": c.product_quantity if hasattr(c, 'product_quantity') else 1,
            "job_type": c.job_type if hasattr(c, 'job_type') else "",
            "job_category": c.job_category if hasattr(c, 'job_category') else ""
        })
        print("Complaint Added:",complaint_list[-1])

    return Response({
        "found": True,
        "customer_id": client.customer_id,
        "phone": client.phone,
        "customer_name": client.customer_name,
        "customer_email": client.customer_email,
        "address": client.address,
        "customer_type": client.customer_type,
        "alternate_number": getattr(client, 'alternate_number', ''),
        "location": getattr(client, "location", {}),
        "complaints": complaint_list
    })

# ------------------------------
#   Get All Complaints (for Dashboard)
# ------------------------------
@api_view(['GET'])
def get_complaints(request):
    """
    Get all complaints for the dashboard
    """
    from .models import StockItem
    
    try:
        complaints = BookServiceComplaint.objects.order_by('-date_created')
        data = []
        for c in complaints:
            # Get customer_id from ClientDetails if customer exists
            client = ClientDetails.objects(phone=c.phone).first()
            customer_id = client.customer_id if client else None

            # Get alternate number from complaint or from customer details
            alt_num = c.alternate_number if c.alternate_number else ""
            if not alt_num and client and getattr(client, 'alternate_number', None):
                alt_num = client.alternate_number
            
            # ⭐ NEW: Get motor details for this complaint
            motor_details = None
            motor_details = None  # motor_details removed (purge)
            
            # ⭐ NEW: Get payment history from PaymentDetails collection
            payment_history = []
            try:
                from .models import PaymentDetails
                payment_records = PaymentDetails.objects(complaint_id=str(c.id)).order_by('-payment_date')
                for p in payment_records:
                    payment_history.append({
                        'payment_date': p.payment_date.strftime('%Y-%m-%dT%H:%M:%S') if p.payment_date else None,
                        'amount_paid': p.amount_paid or 0,
                        'remaining_amount': p.remaining_amount or 0,
                        'payment_method': p.payment_method
                    })
            except Exception as e:
                pass  # Silently skip if payment_details not available
            
            # Parse booking products with price from StockItem
            booking_products = []
            if c.product_name:
                try:
                    import json
                    parsed = json.loads(c.product_name) if isinstance(c.product_name, str) else c.product_name
                    if isinstance(parsed, list):
                        for p in parsed:
                            product_name = p.get('productName') or p.get('name') or p.get('product_name', '')
                            quantity = p.get('quantity') or p.get('qty') or 1
                            price = 0
                            if product_name:
                                stock_item = StockItem.objects(name=product_name).first()
                                if stock_item and stock_item.selling_price:
                                    price = stock_item.selling_price
                            booking_products.append({
                                'productName': product_name,
                                'quantity': quantity,
                                'price': price
                            })
                    else:
                        product_name = str(c.product_name)
                        price = 0
                        if product_name:
                            stock_item = StockItem.objects(name=product_name).first()
                            if stock_item and stock_item.selling_price:
                                price = stock_item.selling_price
                        booking_products.append({
                            'productName': product_name,
                            'quantity': c.product_quantity or 1,
                            'price': price
                        })
                except:
                    product_name = str(c.product_name) if c.product_name else ''
                    price = 0
                    if product_name:
                        stock_item = StockItem.objects(name=product_name).first()
                        if stock_item and stock_item.selling_price:
                            price = stock_item.selling_price
                    booking_products.append({
                        'productName': product_name,
                        'quantity': c.product_quantity or 1,
                        'price': price
                    })
            
            # Parse additional products with price from StockItem
            additional_products = []
            if c.additional_product:
                try:
                    import json
                    parsed = json.loads(c.additional_product) if isinstance(c.additional_product, str) else c.additional_product
                    if isinstance(parsed, list):
                        for p in parsed:
                            product_name = p.get('productName') or p.get('name') or p.get('product_name', '')
                            quantity = p.get('quantity') or p.get('qty') or 1
                            price = 0
                            if product_name:
                                stock_item = StockItem.objects(name=product_name).first()
                                if stock_item and stock_item.selling_price:
                                    price = stock_item.selling_price
                            additional_products.append({
                                'productName': product_name,
                                'quantity': quantity,
                                'price': price
                            })
                    else:
                        product_name = str(c.additional_product)
                        price = 0
                        if product_name:
                            stock_item = StockItem.objects(name=product_name).first()
                            if stock_item and stock_item.selling_price:
                                price = stock_item.selling_price
                        additional_products.append({
                            'productName': product_name,
                            'quantity': c.additional_product_quantity or 1,
                            'price': price
                        })
                except:
                    product_name = str(c.additional_product) if c.additional_product else ''
                    price = 0
                    if product_name:
                        stock_item = StockItem.objects(name=product_name).first()
                        if stock_item and stock_item.selling_price:
                            price = stock_item.selling_price
                    additional_products.append({
                        'productName': product_name,
                        'quantity': c.additional_product_quantity or 1,
                        'price': price
                    })
            
            data.append({
                "id": str(c.id),
                "complaint_no": c.complaint_no,
                "customer_name": c.customer_name,
                "customer_email": c.customer_email,
                "product_name": c.product_name,
                "product_quantity": c.product_quantity,
                "customer_phone": c.phone,
                "alternate_number": alt_num,
                "address": c.address,
                "complaint_details": c.details,
                "customer_type": c.customer_type,
                "assigned": c.assigned,
                "assigned_staff": c.staff_name,
                "status": c.status,
                "payment_method": c.payment_method,
                "remarks": c.remarks,
                "amount": c.amount,
                "client_amount": c.client_amount,
                "assigned_at": format_date(c.assigned_at),
                "assigned_completed_at": format_date(c.assigned_completed_at),
                "date_created": format_date(c.date_created),
                "warranty_photo":  c.warranty_photo,  # Handle both old and new field names
                "warranty_date": format_date(c.warranty_date),
                "next_service_date": format_date(c.next_service_date),
                "customer_id": customer_id,
                "additional_product": c.additional_product,
                "additional_product_quantity": c.additional_product_quantity,
                # New structured product fields with price
                "booking_products": booking_products,
                "additional_products": additional_products,
                "job_type": c.job_type,
                # ⭐ NEW: Include motor details
                "motor_details": motor_details,
                # ⭐ NEW: Include payment history
                "payment_details": payment_history,
            })
        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ------------------------------
#   Update Complaint (for Dashboard)
# ------------------------------
@api_view(['PUT'])
def update_complaint(request, complaint_id):
    """
    Update a complaint by ID (for dashboard editing)
    """
    try:
        complaint = BookServiceComplaint.objects(id=complaint_id).first()
        if not complaint:
            return Response({"error": "Complaint not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = BookServiceComplaintSerializer(complaint, data=request.data, partial=True)
        if serializer.is_valid():
            complaint = serializer.save()
            
            # Extract and save client_amount from remarks when completing
            if complaint.status and complaint.status.lower() == "completed":
                # Get client_amount - either from model or extract from remarks
                client_amount = 0
                if complaint.client_amount:
                    client_amount = float(complaint.client_amount)
                elif complaint.remarks:
                    # Try to extract client_amount from remarks
                    try:
                        import re
                        numbers = re.findall(r'\d+\.?\d*', str(complaint.remarks))
                        if numbers:
                            client_amount = float(numbers[0])
                            complaint.client_amount = client_amount
                    except:
                        pass
                
                # Calculate and save grand_total when completing
                # grand_total = booked_products_total + additional_products_total + client_amount + motor_total
                # Case: With products + client_amount = products total + client_amount
                # Case: Without products, with client_amount = client_amount only
                # Case: Without products and without client_amount = 0
                booking_total = 0
                additional_total = 0
                motor_total = 0
                
                # Get stock items for price lookup
                stock_items = StockItem.objects.all()
                stock_map = {item.name: item.selling_price or 0 for item in stock_items}
                
                # Calculate booking products total (skip motor_sale products - handled separately)
                if complaint.product_name:
                    try:
                        import json
                        products = json.loads(complaint.product_name) if isinstance(complaint.product_name, str) else complaint.product_name
                        if isinstance(products, list):
                            for p in products:
                                # ✅ FIX: Handle motor_sale products separately (same as GET list view)
                                if p.get('isMotorSale') or p.get('isMotor'):
                                    motor_amount = float(p.get('motorAmount') or p.get('motor_amount') or p.get('final_price') or p.get('selling_price') or 0)
                                    # motor_amount string from frontend typically contains the final discounted price
                                    motor_total += motor_amount
                                    continue
                                product_name = p.get('productName') or p.get('name') or p.get('product_name', '')
                                quantity = p.get('quantity') or p.get('qty') or 1
                                # ⭐ FIX: Use product's final_price if available, otherwise use stock price
                                final_price = p.get('final_price', 0)
                                if final_price > 0:
                                    price = final_price
                                else:
                                    price = stock_map.get(product_name, 0)
                                booking_total += price * quantity
                    except:
                        pass
                
                # Calculate additional products total
                if complaint.additional_product:
                    try:
                        import json
                        additional_prods = json.loads(complaint.additional_product) if isinstance(complaint.additional_product, str) else complaint.additional_product
                        if isinstance(additional_prods, list):
                            for p in additional_prods:
                                product_name = p.get('productName') or p.get('name') or p.get('product_name', '')
                                quantity = p.get('quantity') or p.get('qty') or 1
                                # ⭐ FIX: Use product's final_price if available, otherwise use stock price
                                final_price = p.get('final_price', 0)
                                if final_price > 0:
                                    price = final_price
                                else:
                                    price = stock_map.get(product_name, 0)
                                additional_total += price * quantity
                    except:
                        pass
                
                # ✅ FIX: grand_total now includes motor_total (matches GET list view formula)
                # grand_total = booking_total + additional_total + client_amount + motor_total
                grand_total = booking_total + additional_total + client_amount + motor_total
                
                # If no products and only client_amount, grand_total = client_amount
                # This is already handled by the calculation above (0 + 0 + client_amount + 0 = client_amount)
                
                complaint.grand_total = grand_total
                complaint.total_amount = grand_total
                
                # ----------------------------------
                # ✅ NEW: UNIFIED STOCK REDUCTION ON COMPLETION
                # ----------------------------------
                process_stock_reduction_for_complaint(complaint, request)
                
                complaint.save()
            
            return Response({
                "success": True,
                "message": "Complaint updated successfully",
                "complaint": {
                    "id": str(complaint.id),
                    "complaint_no": complaint.complaint_no,
                    "customer_name": complaint.customer_name,
                    "customer_phone": complaint.phone,
                    "product_name": complaint.product_name,
                    "status": complaint.status,
                    "assigned_staff": complaint.staff_name,
                    "payment_method": complaint.payment_method,
                    "remarks": complaint.remarks,
                    "amount": complaint.amount,
                    "client_amount": complaint.client_amount,
                    "grand_total": complaint.grand_total,
                    "date_created": format_date(complaint.date_created)
                }
            }, status=status.HTTP_200_OK)
        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ------------------------------
#   Payment Details APIs
# ------------------------------
@api_view(['PUT'])
def update_payment(request, complaint_id):
    """
    Update payment details for a completed job.
    Supports multiple payments per complaint (split payments).
    Calculates due_amount and payment_status automatically.
    Stores each payment in payment_details collection for history.
    """
    try:
        from datetime import datetime
        
        complaint = None
        
        # Try multiple ways to find the complaint
        # 1. Try as MongoDB ObjectId
        try:
            from bson import ObjectId
            complaint = BookServiceComplaint.objects(id=ObjectId(complaint_id)).first()
        except:
            pass
        
        # 2. Try as exact complaint_no
        if not complaint:
            complaint = BookServiceComplaint.objects(complaint_no=complaint_id).first()
        
        # 3. Try with # prefix
        if not complaint:
            complaint = BookServiceComplaint.objects(complaint_no=f'#{complaint_id}').first()
        
        # 4. Try without # prefix
        if not complaint:
            complaint_no_stripped = complaint_id.lstrip('#')
            complaint = BookServiceComplaint.objects(complaint_no=complaint_no_stripped).first()
        
        if not complaint:
            return Response({
                "error": "Complaint not found", 
                "complaint_id": complaint_id,
                "message": "Could not find a complaint with this ID"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get the payment data from request
        incoming_amount = float(request.data.get('amount_received', 0))
        payment_due_date = request.data.get('payment_due_date')
        # Check both payment_mode and payment_method for backward compatibility
        payment_method = request.data.get('payment_mode') or request.data.get('payment_method')
        
        # Parse payment_due_date if provided
        parsed_due_date = None
        if payment_due_date:
            try:
                parsed_due_date = datetime.strptime(payment_due_date, "%Y-%m-%d")
            except:
                parsed_due_date = None
        
        # Use grand_total from complaint, or calculate from product data if 0
        grand_total = complaint.grand_total if complaint.grand_total else 0
        
        # If grand_total is still 0, try to calculate from product data
        if grand_total == 0:
            # Calculate from product_name, additional_product, and client_amount
            try:
                from .models import StockItem
                stock_items = StockItem.objects.all()
                stock_map = {item.name: item.selling_price if item.selling_price else 0 for item in stock_items}
                
                # Calculate from booked products
                booking_total = 0
                if complaint.product_name:
                    try:
                        # Try JSON format
                        import json
                        products = json.loads(complaint.product_name) if isinstance(complaint.product_name, str) else complaint.product_name
                        if isinstance(products, list):
                            for p in products:
                                name = p.get('productName') or p.get('name') or p.get('product_name', '')
                                qty = p.get('quantity') or p.get('qty') or 1
                                price = p.get('selling_price') or stock_map.get(name, 0)
                                booking_total += price * qty
                        else:
                            # Legacy string format
                            booking_total = stock_map.get(str(complaint.product_name), 0) * (complaint.product_quantity or 1)
                    except:
                        booking_total = stock_map.get(str(complaint.product_name), 0) * (complaint.product_quantity or 1)
                
                # Calculate from additional products
                additional_total = 0
                if complaint.additional_product:
                    try:
                        import json
                        products = json.loads(complaint.additional_product) if isinstance(complaint.additional_product, str) else complaint.additional_product
                        if isinstance(products, list):
                            for p in products:
                                name = p.get('productName') or p.get('name') or ''
                                qty = p.get('quantity') or p.get('qty') or 1
                                price = p.get('selling_price') or stock_map.get(name, 0)
                                additional_total += price * qty
                    except:
                        pass
                
                client_amount = complaint.client_amount or 0
                grand_total = round(booking_total + additional_total + client_amount, 2)
            except:
                grand_total = 0
        
        # motor_total calculation removed (purge)
        grand_total = round(grand_total, 2)
        
        # STEP 1: Calculate new total received
        existing_amount_received = complaint.amount_received or 0
        new_total_received = existing_amount_received + incoming_amount
        
        # STEP 2: Calculate remaining amount
        remaining_amount = grand_total - new_total_received
        
        # STEP 3: Determine payment_status
        if remaining_amount <= 0:
            payment_status = "completed"
        else:
            payment_status = "partial"
        
        # STEP 4: UPDATE BookServiceComplaint (keep existing fields)
        complaint.amount_received = new_total_received
        complaint.payment_due_date = parsed_due_date
        complaint.payment_status = payment_status
        complaint.due_amount = max(0, remaining_amount)  # Ensure non-negative
        complaint.grand_total = grand_total
        complaint.total_amount = grand_total
        complaint.save()
        
        # STEP 5: INSERT INTO payment_details collection (append-only)
        # Get customer info for the payment record
        customer = ClientDetails.objects(phone=complaint.phone).first()
        customer_id = customer.customer_id if customer else None
        
        payment_record = PaymentDetails(
            complaint_no=complaint.complaint_no,
            complaint_id=str(complaint.id),
            customer_id=customer_id,
            customer_name=complaint.customer_name,
            customer_phone=complaint.phone,
            amount_paid=incoming_amount,
            payment_date=get_ist_now(),
            total_amount=grand_total,
            remaining_amount=max(0, remaining_amount),
            next_due_date=parsed_due_date,
            payment_method=payment_method,
            status=payment_status
        )
        payment_record.save()
        
        return Response({
            "success": True,
            "message": "Payment details updated successfully",
            "payment": {
                "id": str(complaint.id),
                "complaint_no": complaint.complaint_no,
                "grand_total": grand_total,
                "amount_received": complaint.amount_received,
                "due_amount": complaint.due_amount,
                "payment_due_date": complaint.payment_due_date.strftime("%Y-%m-%d") if complaint.payment_due_date else None,
                "payment_status": complaint.payment_status,
                "payment_id": str(payment_record.id)
            }
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        import traceback
        return Response({
            "error": str(e),
            "trace": traceback.format_exc()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
def update_payment_debug(request):
    """
    Debug endpoint to handle cases where complaint_id is missing.
    Tries to extract complaint_id from URL params or request body.
    """
    # Try to get complaint_id from URL query params
    complaint_id = request.query_params.get('complaint_id')
    
    # If not in query params, try to get from request body
    if not complaint_id:
        complaint_id = request.data.get('complaint_id') or request.data.get('complaint_no')
    
    if complaint_id:
        # Redirect to the main endpoint with the complaint_id
        # This handles the case where frontend hasn't been rebuilt
        try:
            from bson import ObjectId
            from bson.errors import InvalidId as BsonInvalidId
            from mongoengine.errors import InvalidIdError
            
            complaint = None
            
            # First try as ObjectId
            try:
                complaint = BookServiceComplaint.objects(id=ObjectId(complaint_id)).first()
            except (InvalidIdError, TypeError):
                # If not a valid ObjectId, try as complaint_no
                complaint = BookServiceComplaint.objects(complaint_no=complaint_id).first()
                if not complaint and complaint_id.startswith('#'):
                    complaint = BookServiceComplaint.objects(complaint_no=complaint_id).first()
                if not complaint:
                    complaint = BookServiceComplaint.objects(complaint_no=complaint_id.lstrip('#')).first()
                    if complaint and not complaint.complaint_no.startswith('#'):
                        complaint = BookServiceComplaint.objects(complaint_no=f'#{complaint_id.lstrip("#")}').first()
            
            if not complaint:
                return Response({
                    "error": "Complaint not found", 
                    "complaint_id": complaint_id,
                    "message": "Please provide a valid complaint_id in the URL path"
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Get the payment data from request
            amount_received = request.data.get('amount_received', 0)
            payment_due_date = request.data.get('payment_due_date')
            payment_method = request.data.get('payment_mode') or request.data.get('payment_method')
            
            # Parse payment_due_date if provided
            if payment_due_date:
                from datetime import datetime
                try:
                    payment_due_date = datetime.strptime(payment_due_date, "%Y-%m-%d")
                except:
                    payment_due_date = None
            
            # Use grand_total from complaint, or calculate from product data if 0
            grand_total = complaint.grand_total if complaint.grand_total else 0
            
            # If grand_total is still 0, try to calculate from product data
            if grand_total == 0:
                try:
                    from .models import StockItem
                    stock_items = StockItem.objects.all()
                    stock_map = {item.name: item.selling_price if item.selling_price else 0 for item in stock_items}
                    
                    booking_total = 0
                    if complaint.product_name:
                        try:
                            import json
                            products = json.loads(complaint.product_name) if isinstance(complaint.product_name, str) else complaint.product_name
                            if isinstance(products, list):
                                for p in products:
                                    name = p.get('productName') or p.get('name') or p.get('product_name', '')
                                    qty = p.get('quantity') or p.get('qty') or 1
                                    price = p.get('selling_price') or stock_map.get(name, 0)
                                    booking_total += price * qty
                            else:
                                booking_total = stock_map.get(str(complaint.product_name), 0) * (complaint.product_quantity or 1)
                        except:
                            booking_total = stock_map.get(str(complaint.product_name), 0) * (complaint.product_quantity or 1)
                    
                    additional_total = 0
                    if complaint.additional_product:
                        try:
                            import json
                            products = json.loads(complaint.additional_product) if isinstance(complaint.additional_product, str) else complaint.additional_product
                            if isinstance(products, list):
                                for p in products:
                                    name = p.get('productName') or p.get('name') or ''
                                    qty = p.get('quantity') or p.get('qty') or 1
                                    price = p.get('selling_price') or stock_map.get(name, 0)
                                    additional_total += price * qty
                        except:
                            pass
                    
                    client_amount = complaint.client_amount or 0
                    grand_total = round(booking_total + additional_total + client_amount, 2)
                except:
                    grand_total = 0
            
            # motor_total calculation removed (purge)
            due_amount = grand_total - float(amount_received) if amount_received else grand_total
            
            if due_amount == 0:
                payment_status = "Completed"
            else:
                payment_status = "Due"
            
            complaint.amount_received = float(amount_received) if amount_received else 0
            complaint.payment_due_date = payment_due_date
            complaint.payment_status = payment_status
            complaint.due_amount = due_amount
            complaint.grand_total = grand_total
            complaint.total_amount = grand_total
            complaint.save()
            
            return Response({
                "success": True,
                "message": "Payment details updated successfully",
                "payment": {
                    "id": str(complaint.id),
                    "complaint_no": complaint.complaint_no,
                    "grand_total": grand_total,
                    "amount_received": complaint.amount_received,
                    "due_amount": complaint.due_amount,
                    "payment_due_date": complaint.payment_due_date.strftime("%Y-%m-%d") if complaint.payment_due_date else None,
                    "payment_status": complaint.payment_status
                }
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({
        "error": "complaint_id is required",
        "received_data": dict(request.data),
        "message": "Please provide a valid complaint_id in the URL path"
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_payment_due_jobs(request):
    """
    Get all jobs that have payment due.
    Uses the centralized calculation logic via the serializer.
    """
    try:
        # Get all completed jobs
        complaints = BookServiceComplaint.objects(status='completed')
        
        # Use the serializer which now handles all total calculations consistently
        from .serializers import BookServiceComplaintSerializer
        serializer = BookServiceComplaintSerializer(complaints, many=True)
        
        # Filter for jobs with due amount > 0
        payment_due_jobs = [j for j in serializer.data if j.get('due_amount', 0) > 0]
        
        # Identify overdue and due jobs based on the payment_indicator from serializer
        overdue_jobs = [j for j in payment_due_jobs if j.get('payment_indicator') == 'overdue']
        due_jobs = [j for j in payment_due_jobs if j.get('payment_indicator') == 'due']
        
        # Sort: overdue first, then by due date
        payment_due_jobs.sort(key=lambda x: (
            x.get('payment_indicator') != 'overdue',
            x.get('payment_due_date') or '9999-99-99'
        ))
        
        return Response({
            "success": True,
            "count": len(payment_due_jobs),
            "overdue_count": len(overdue_jobs),
            "due_count": len(due_jobs),
            "overdue_jobs": overdue_jobs,
            "due_jobs": due_jobs,
            "all_jobs": payment_due_jobs
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import traceback
        return Response({
            "error": str(e),
            "trace": traceback.format_exc()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ------------------------------
#   Payment History API (NEW)
# ------------------------------
@api_view(['GET'])
def get_payment_history(request, complaint_id):
    """
    Get payment history for a specific complaint.
    Returns all payment records from payment_details collection.
    """
    try:
        # Find the complaint first
        complaint = None
        try:
            from bson import ObjectId
            complaint = BookServiceComplaint.objects(id=ObjectId(complaint_id)).first()
        except:
            pass
        
        if not complaint:
            complaint = BookServiceComplaint.objects(complaint_no=complaint_id).first()
        
        if not complaint:
            # Try with # prefix
            complaint = BookServiceComplaint.objects(complaint_no=f'#{complaint_id}').first()
        
        if not complaint:
            # Try without # prefix
            complaint_no_stripped = complaint_id.lstrip('#')
            complaint = BookServiceComplaint.objects(complaint_no=complaint_no_stripped).first()
        
        if not complaint:
            return Response({
                "error": "Complaint not found",
                "complaint_id": complaint_id
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get all payment records for this complaint
        payment_records = PaymentDetails.objects(
            complaint_id=str(complaint.id)
        ).order_by('-created_at')
        
        # Serialize payment history
        history = []
        for record in payment_records:
            history.append({
                "id": str(record.id),
                "complaint_no": record.complaint_no,
                "amount_paid": record.amount_paid,
                "payment_date": record.payment_date.strftime("%Y-%m-%d %H:%M:%S") if record.payment_date else None,
                "total_amount": record.total_amount,
                "remaining_amount": record.remaining_amount,
                "next_due_date": record.next_due_date.strftime("%Y-%m-%d") if record.next_due_date else None,
                "payment_method": record.payment_method,
                "payment_mode": record.payment_method, # Add payment_mode for frontend
                "status": record.status,
                "created_at": record.created_at.strftime("%Y-%m-%d %H:%M:%S") if record.created_at else None
            })
        
        return Response({
            "success": True,
            "complaint_no": complaint.complaint_no,
            "grand_total": complaint.grand_total or 0,
            "amount_received": complaint.amount_received or 0,
            "due_amount": complaint.due_amount or 0,
            "payment_status": complaint.payment_status,
            "payment_history": history
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import traceback
        return Response({
            "error": str(e),
            "trace": traceback.format_exc()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_completed_jobs_with_payment(request):
    """
    Get all completed jobs with their payment details.
    """
    try:
        complaints = BookServiceComplaint.objects(status='completed')
        
        from .serializers import BookServiceComplaintSerializer
        serializer = BookServiceComplaintSerializer(complaints, many=True)
        
        return Response({
            "success": True,
            "count": complaints.count(),
            "jobs": serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ------------------------------
#   Send Email (for Dashboard)
# ------------------------------
@api_view(['POST'])
def send_email(request):
    """
    Send email to customer or staff
    """
    try:
        subject = request.data.get('subject')
        message = request.data.get('message')
        recipient_email = request.data.get('recipient_email')
        
        if not all([subject, message, recipient_email]):
            return Response({
                "success": False,
                "error": "Subject, message, and recipient_email are required"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Send email using the helper function
        send_email_utf8(subject, message, [recipient_email])
        
        return Response({
            "success": True,
            "message": "Email sent successfully"
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            "success": False,
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ------------------------------------
#   Get Complaints By Customer ID (Django API)
# ------------------------------------
@api_view(['GET'])
def complaint_person(request):
    customer_id = request.GET.get('customer_id')
    print("Received customer_id for complaints:", customer_id)
    if not customer_id:
        return Response({"error": "Customer ID parameter is required"}, status=400)

    complaints = BookServiceComplaint.objects(customer_id=customer_id)

    # Get customer details
    customer = ClientDetails.objects(customer_id=customer_id).first()

    serializer = BookServiceComplaintSerializer(complaints, many=True)
    data = serializer.data

    # Add customer_id to the response
    response_data = {
        "customer_id": customer_id,
        "complaints": data
    }
    
    return Response(response_data)

# ------------------------------------
#   Update WhatsApp Send Status
# ------------------------------------
@api_view(['POST'])
def update_whatsapp_status(request):
    """
    Update WhatsApp send status for a complaint.
    Body: { complaint_no, whatsapp_sent_to_customer, whatsapp_sent_to_staff }
    """
    try:
        complaint_no = request.data.get('complaint_no')
        if not complaint_no:
            return Response({"error": "complaint_no is required"}, status=400)

        complaint = BookServiceComplaint.objects(complaint_no=complaint_no).first()
        if not complaint:
            return Response({"error": "Complaint not found"}, status=404)

        updated = False
        if 'whatsapp_sent_to_customer' in request.data:
            complaint.whatsapp_sent_to_customer = bool(request.data['whatsapp_sent_to_customer'])
            updated = True
        if 'whatsapp_sent_to_staff' in request.data:
            complaint.whatsapp_sent_to_staff = bool(request.data['whatsapp_sent_to_staff'])
            updated = True
        if 'booking_whatsapp_sent' in request.data:
            complaint.booking_whatsapp_sent = bool(request.data['booking_whatsapp_sent'])
            updated = True

        if updated:
            complaint.save()

        return Response({
            "success": True,
            "complaint_no": complaint.complaint_no,
            "whatsapp_sent_to_customer": complaint.whatsapp_sent_to_customer,
            "whatsapp_sent_to_staff": complaint.whatsapp_sent_to_staff,
            "booking_whatsapp_sent": complaint.booking_whatsapp_sent
        }, status=200)

    except Exception as e:
        return Response({"error": str(e)}, status=500)


# ------------------------------------
#   Get Pending WhatsApp Messages
# ------------------------------------
@api_view(['GET'])
def get_pending_whatsapp_messages(request):
    """
    Get unique complaints with pending WhatsApp messages.
    Each complaint shows once with all pending message types.
    """
    try:
        from .serializers import BookServiceComplaintSerializer

        # Get all complaints that have at least one pending message
        all_complaints = []
        
        # Query in smaller batches to avoid timeout
        try:
            all_complaints_raw = BookServiceComplaint.objects.order_by('-date_created').limit(1000)
            for c in all_complaints_raw:
                try:
                    has_pending = False
                    # Handle cases where assigned field might not exist
                    assigned_val = c.assigned if hasattr(c, 'assigned') else False
                    is_assigned = assigned_val == True
                    
                    # Check booking pending - always check regardless of assignment
                    # This shows booking message in booking tab even after assignment
                    booking_sent = getattr(c, 'booking_whatsapp_sent', False)
                    if booking_sent != True:
                        has_pending = True
                    
                    # Check customer/staff pending - for assigned complaints
                    if is_assigned:
                        if not getattr(c, 'whatsapp_sent_to_customer', False):
                            has_pending = True
                        if not getattr(c, 'whatsapp_sent_to_staff', False):
                            has_pending = True
                    
                    if has_pending:
                        all_complaints.append(c)
                except Exception as e:
                    print(f"Error processing complaint: {e}")
                    pass
        except Exception as e:
            print(f"Error fetching complaints: {e}")
            pass

        # Sort by created_at descending
        try:
            all_complaints.sort(key=lambda x: x.created_at if hasattr(x, 'created_at') and x.created_at else datetime.min, reverse=True)
        except:
            all_complaints.sort(key=lambda x: x.id, reverse=True)

        serializer = BookServiceComplaintSerializer(all_complaints, many=True)
        return Response({
            "success": True,
            "count": len(all_complaints),
            "complaints": serializer.data
        }, status=200)

    except Exception as e:
        import traceback
        return Response({"error": str(e), "trace": traceback.format_exc()}, status=500)


# ------------------------------------
#   Staff Performance Report (Earnings & Daily Work)
# ------------------------------------
@api_view(['GET'])
def staff_performance_report(request):
    """
    Staff performance per day based on assigned_completed_at
    - Grouped by staff + date
    - Client amount -> amount
    - Company amount -> remarks
    - Supports date filtering
    """

    # Get filter parameters
    start_date_str = request.GET.get('start_date')
    end_date_str = request.GET.get('end_date')
    staff_name_filter = request.GET.get('staff_name', '').strip()

    # Base query
    query = BookServiceComplaint.objects(assigned_completed_at__ne=None)

    # Apply staff name filtering if provided
    if staff_name_filter:
        query = query.filter(staff_name__icontains=staff_name_filter)

    # Apply date filtering if provided
    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            query = query.filter(assigned_completed_at__gte=start_date)
        except ValueError:
            return Response({"error": "Invalid start_date format. Use YYYY-MM-DD"}, status=400)

    if end_date_str:
        try:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
            # Set end_date to end of day
            end_date = end_date.replace(hour=23, minute=59, second=59)
            query = query.filter(assigned_completed_at__lte=end_date)
        except ValueError:
            return Response({"error": "Invalid end_date format. Use YYYY-MM-DD"}, status=400)

    complaints = query

    report = defaultdict(lambda: {
        "total_jobs_completed": 0,
        "client_payments": 0.0,
        "company_payments": 0.0,
        "total_incentives": 0.0,
        "daily_work_completion": defaultdict(lambda: {
            "jobs": 0,
            "client_payments": 0.0,
            "company_payments": 0.0,
            "incentives": 0.0
        })
    })

    for c in complaints:
        staff = c.staff_name or "Unknown"

        # Extract DATE only (yyyy-mm-dd)
        date_key = c.assigned_completed_at.date().isoformat()

        # Client payment (from client_amount field, fallback to remarks)
        client_amount = float(c.client_amount or 0)
        if client_amount == 0 and c.remarks:
            try:
                import re
                numbers = re.findall(r'\d+\.?\d*', c.remarks)
                if numbers:
                    client_amount = float(numbers[0])
            except:
                pass

        # Company payment (from amount field - what company pays to staff)
        company_amount = float(c.amount or 0)

        # Overall staff summary
        report[staff]["total_jobs_completed"] += 1
        report[staff]["client_payments"] += client_amount
        report[staff]["company_payments"] += company_amount

        # Per-day summary
        report[staff]["daily_work_completion"][date_key]["jobs"] += 1
        report[staff]["daily_work_completion"][date_key]["client_payments"] += client_amount
        report[staff]["daily_work_completion"][date_key]["company_payments"] += company_amount
        
        # Incentives
        incentive_amount = float(getattr(c, 'staff_incentive', 0) or 0)
        report[staff]["total_incentives"] += incentive_amount
        report[staff]["daily_work_completion"][date_key]["incentives"] += incentive_amount

    # Convert to frontend-friendly response
    response_data = []

    for staff, data in report.items():
        response_data.append({
            "staff_name": staff,
            "total_jobs_completed": data["total_jobs_completed"],
            "client_payments": round(data["client_payments"], 2),
            "company_payments": round(data["company_payments"], 2),
            "total_incentives": round(data["total_incentives"], 2),
            "daily_work_completion": {
                date: {
                    "jobs": v["jobs"],
                    "client_payments": round(v["client_payments"], 2),
                    "company_payments": round(v["company_payments"], 2),
                    "incentives": round(v["incentives"], 2),
                }
                for date, v in data["daily_work_completion"].items()
            }
        })

    return Response(response_data)


# ------------------------------------
#   Get All Products
# ------------------------------------
@api_view(['GET'])
def get_products(request):
    # ✅ Now returns products from StockItem model instead of Products model
    # Admin adds stock from Stock Management, and it automatically becomes a product
    stock_items = StockItem.objects.all()
    
    # Convert StockItem to product format for compatibility
    products_data = []
    for item in stock_items:
        products_data.append({
            "id": str(item.id),
            "product_name": item.name,
            "description": item.category or "",
            "selling_price": item.selling_price or 0,
            "buying_price": item.buying_price or 0,
            "minimum_price": item.minimum_price or 0
        })
    
    return Response(products_data)

# ------------------------------------
#   Create Product
# ------------------------------------
@api_view(['POST'])
def create_product(request):
    serializer = ProductsSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ------------------------------------
#   Update Product
# ------------------------------------
@api_view(['PUT'])
def update_product(request, product_id):
    try:
        product = Products.objects.get(id=product_id)
    except Products.DoesNotExist:
        return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = ProductsSerializer(product, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ------------------------------------
#   Delete Product
# ------------------------------------
@api_view(['DELETE'])
def delete_product(request, product_id):
    try:
        product = Products.objects.get(id=product_id)
    except Products.DoesNotExist:
        return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

    product.delete()
    return Response({"message": "Product deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

# ------------------------------------
#   Staff Daily Jobs Detail
# ------------------------------------
@api_view(['GET'])
def staff_daily_jobs(request):
    """
    Get detailed jobs for a specific staff member on a specific date
    """
    staff_name = request.GET.get('staff_name')
    date_str = request.GET.get('date')

    if not staff_name or not date_str:
        return Response({"error": "staff_name and date parameters are required"}, status=400)

    try:
        # Parse the date
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()

        # Query for completed complaints by this staff on this date
        complaints = BookServiceComplaint.objects(
            staff_name=staff_name,
            assigned_completed_at__gte=datetime.combine(target_date, datetime.min.time()),
            assigned_completed_at__lt=datetime.combine(target_date + timedelta(days=1), datetime.min.time())
        )

        # Format the response
        jobs_data = []
        for complaint in complaints:
            # Get client payment from client_amount field
            client_payment = float(complaint.client_amount or 0)

            jobs_data.append({
                "complaint_no": complaint.complaint_no,
                "customer_name": complaint.customer_name,
                "customer_phone": complaint.phone,
                "address": complaint.address,
                "product_name": complaint.product_name,
                "additional_product": complaint.additional_product,
                "details": complaint.details,
                "status": complaint.status,
                "client_payment": round(client_payment, 2),
                "company_payment": round(float(complaint.amount or 0), 2),
                "staff_incentive": round(float(getattr(complaint, 'staff_incentive', 0) or 0), 2),
                "payment_method": complaint.payment_method,
                "completed_at": format_date(complaint.assigned_completed_at),
                "remarks": complaint.remarks
            })

        return Response({
            "staff_name": staff_name,
            "date": date_str,
            "total_jobs": len(jobs_data),
            "jobs": jobs_data
        }, status=200)

    except ValueError:
        return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=400)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

# ------------------------------------
#   Staff Attendance APIs
# ------------------------------------

@api_view(['POST'])
def mark_staff_attendance(request):
    """
    Mark attendance for multiple staff at once
    Only admin & bigadmin can mark attendance
    Prevents duplicate marking for same day
    """
    try:
        # Check if user is admin
        user_role = request.headers.get('X-User-Role', '')
        if user_role not in ['admin', 'bigadmin']:
            return Response({"error": "Permission denied. Only admin can mark attendance"}, status=403)

        marked_by = request.headers.get('X-User-Name', 'Unknown Admin')
        
        # Get today's date (server-based)
        today = get_ist_now().date()
        
        # Get attendance data from request
        attendance_data = request.data.get('attendance', [])
        
        if not attendance_data:
            return Response({"error": "No attendance data provided"}, status=400)

        marked_count = 0
        updated_count = 0
        skipped_count = 0
        errors = []

        for item in attendance_data:
            staff_id = item.get('staff_id')
            staff_name = item.get('staff_name')
            status = item.get('status', 'Absent')
            
            # Get new payroll fields
            attendance_type = item.get('attendance_type', 'present')
            work_type = item.get('work_type', 'full_day')
            salary_multiplier = float(item.get('salary_multiplier', 1))
            salary_multiplier_reason = item.get('salary_multiplier_reason', '')

            if not staff_id or not staff_name:
                errors.append(f"Missing staff_id or staff_name for item: {item}")
                continue

            # Check if attendance already exists for today
            existing_attendance = StaffAttendance.objects(
                staff_id=staff_id,
                date__gte=datetime.combine(today, datetime.min.time()),
                date__lt=datetime.combine(today + timedelta(days=1), datetime.min.time())
            ).first()

            if existing_attendance:
                try:
                    existing_attendance.status = status
                    existing_attendance.attendance_type = attendance_type
                    existing_attendance.work_type = work_type
                    existing_attendance.salary_multiplier = salary_multiplier
                    existing_attendance.salary_multiplier_reason = salary_multiplier_reason
                    existing_attendance.marked_by = marked_by
                    existing_attendance.marked_at = get_ist_now()
                    
                    # Handle override fields if applicable
                    interpreted_status = getAttendanceStatus(staff_id, today)
                    if interpreted_status in ["week_off", "holiday"]:
                        existing_attendance.is_override = True
                        existing_attendance.override_reason = item.get('override_reason', salary_multiplier_reason)
                    
                    existing_attendance.save()
                    updated_count += 1
                    continue
                except Exception as e:
                    errors.append(f"Failed to update attendance for {staff_name}: {str(e)}")
                    continue

            # NEW: Intelligent Attendance Logic Layer
            # Check if marking on holiday or weekly off
            interpreted_status = getAttendanceStatus(staff_id, today)
            is_override = False
            if interpreted_status in ["week_off", "holiday"]:
                is_override = True

            # Validation: If override and multiplier > 1, reason is required
            override_reason = item.get('override_reason', salary_multiplier_reason)
            if is_override and salary_multiplier > 1 and not override_reason:
                errors.append(f"Override reason required for {staff_name} on {interpreted_status} with {salary_multiplier}x multiplier")
                continue

            # Create new attendance record
            try:
                attendance = StaffAttendance(
                    staff_id=staff_id,
                    staff_name=staff_name,
                    date=datetime.combine(today, datetime.min.time()),
                    status=status,
                    attendance_type=attendance_type,
                    work_type=work_type,
                    salary_multiplier=salary_multiplier,
                    salary_multiplier_reason=salary_multiplier_reason,
                    is_override=is_override,
                    override_reason=override_reason,
                    marked_by=marked_by
                )
                attendance.save()
                marked_count += 1
            except Exception as e:
                errors.append(f"Failed to save attendance for {staff_name}: {str(e)}")

        response_data = {
            "success": True,
            "message": f"Attendance processed: {marked_count} marked, {updated_count} updated",
            "marked_count": marked_count,
            "updated_count": updated_count,
            "skipped_count": skipped_count
        }

        if errors:
            response_data["errors"] = errors

        return Response(response_data, status=200)

    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def get_today_attendance(request):
    """
    Get today's attendance summary
    Returns present_count, absent_count, total_staff, attendance_marked
    """
    try:
        # Get today's date (server-based)
        today = get_ist_now().date()
        
        # Get all active staff
        active_staff = Staff.objects(is_active=True)
        total_staff = active_staff.count()

        # Get today's attendance records
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today + timedelta(days=1), datetime.min.time())
        
        today_attendance = StaffAttendance.objects(
            date__gte=today_start,
            date__lt=today_end
        )

        # Count present and absent
        present_count = today_attendance.filter(status='Present').count()
        absent_count = today_attendance.filter(status='Absent').count()
        
        # Check if attendance is marked for all staff
        attendance_marked = (present_count + absent_count) >= total_staff and total_staff > 0

        return Response({
            "present_count": present_count,
            "absent_count": absent_count,
            "total_staff": total_staff,
            "attendance_marked": attendance_marked,
            "date": today.strftime('%Y-%m-%d')
        }, status=200)

    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def get_attendance_history(request):
    """
    View attendance history with filtering options
    Optional parameters:
    - date: Specific date in YYYY-MM-DD format
    - start_date: Start date for range in YYYY-MM-DD format
    - end_date: End date for range in YYYY-MM-DD format
    - month: Month in YYYY-MM format
    - staff_name: Filter by staff name (partial match)
    """
    from datetime import date
    try:
        date_str = request.GET.get('date')
        start_date_str = request.GET.get('start_date')
        end_date_str = request.GET.get('end_date')
        month_str = request.GET.get('month')
        staff_name = request.GET.get('staff_name', '').strip()
        
        # Determine date range based on parameters
        if month_str:
            # Filter by month (YYYY-MM)
            try:
                year, month = map(int, month_str.split('-'))
                from calendar import monthrange
                _, last_day = monthrange(year, month)
                target_date = date(year, month, 1)
                end_target_date = date(year, month, last_day)
                start_datetime = datetime.combine(target_date, datetime.min.time())
                end_datetime = datetime.combine(end_target_date + timedelta(days=1), datetime.min.time())
            except (ValueError, AttributeError):
                return Response({"error": "Invalid month format. Use YYYY-MM"}, status=400)
        elif start_date_str and end_date_str:
            # Filter by date range
            try:
                start_target = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                end_target = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                target_date = start_target  # Set target_date for response
                start_datetime = datetime.combine(start_target, datetime.min.time())
                end_datetime = datetime.combine(end_target + timedelta(days=1), datetime.min.time())
            except ValueError:
                return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=400)
        elif date_str:
            # Filter by specific date
            try:
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                start_datetime = datetime.combine(target_date, datetime.min.time())
                end_datetime = datetime.combine(target_date + timedelta(days=1), datetime.min.time())
            except ValueError:
                return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=400)
        elif staff_name:
            # If filtering by staff name only, get all attendance records for that staff
            # Default to a wide date range (last 1 year)
            target_date = get_ist_now().date()
            start_datetime = datetime.combine(target_date - timedelta(days=365), datetime.min.time())
            end_datetime = datetime.combine(target_date + timedelta(days=1), datetime.min.time())
        else:
            # Default to today
            target_date = get_ist_now().date()
            start_datetime = datetime.combine(target_date, datetime.min.time())
            end_datetime = datetime.combine(target_date + timedelta(days=1), datetime.min.time())
        
        # Get attendance for the date range
        attendance_query = StaffAttendance.objects(
            date__gte=start_datetime,
            date__lt=end_datetime
        ).order_by('-date', 'staff_name')
        
        # Filter by staff name if provided
        if staff_name:
            attendance_query = attendance_query.filter(
                staff_name__icontains=staff_name
            )
        
        attendance_records = list(attendance_query)
        
        # Get all active staff for comparison
        active_staff = Staff.objects(is_active=True).order_by('name')
        
        # Build attendance data
        attendance_data = []
        for record in attendance_records:
            attendance_data.append({
                "id": str(record.id),
                "staff_id": record.staff_id,
                "staff_name": record.staff_name,
                "status": record.status,
                "attendance_type": getattr(record, 'attendance_type', 'present'),
                "work_type": getattr(record, 'work_type', 'full_day'),
                "salary_multiplier": getattr(record, 'salary_multiplier', 1),  # Per-day multiplier
                "salary_multiplier_reason": getattr(record, 'salary_multiplier_reason', ''),
                "is_override": getattr(record, 'is_override', False),
                "override_reason": getattr(record, 'override_reason', ''),
                "date": record.date.strftime('%Y-%m-%d') if record.date else None,
                "marked_by": record.marked_by,
                "marked_at": format_date(record.marked_at) if record.marked_at else None
            })
        
        # If filtering by specific date, also include staff who weren't marked
        if date_str and not staff_name:
            attendance_map = {record.staff_id: record for record in attendance_records}
            for staff in active_staff:
                if str(staff.id) not in attendance_map:
                    attendance_data.append({
                        "id": None,
                        "staff_id": str(staff.id),
                        "staff_name": staff.name,
                        "status": "Not Marked",
                        "attendance_type": None,
                        "work_type": None,
                        "salary_multiplier": 0,
                        "date": target_date.strftime('%Y-%m-%d'),
                        "marked_by": None,
                        "marked_at": None
                    })
            # Sort by staff name
            attendance_data.sort(key=lambda x: x['staff_name'])
        
        # Calculate summary
        present_count = sum(1 for r in attendance_data if r['status'] == 'Present')
        absent_count = sum(1 for r in attendance_data if r['status'] == 'Absent')
        not_marked_count = sum(1 for r in attendance_data if r['status'] == 'Not Marked')
        
        return Response({
            "date": target_date.strftime('%Y-%m-%d') if isinstance(target_date, date) else target_date,
            "start_date": start_datetime.strftime('%Y-%m-%d'),
            "end_date": (end_datetime - timedelta(days=1)).strftime('%Y-%m-%d'),
            "attendance_data": attendance_data,
            "summary": {
                "total": len(attendance_data),
                "present": present_count,
                "absent": absent_count,
                "not_marked": not_marked_count
            }
        }, status=200)

    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def get_present_staff(request):
    """
    Get list of present staff for today with full details
    """
    try:
        today = get_ist_now().date()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today + timedelta(days=1), datetime.min.time())
        
        # Get today's attendance records with 'Present' status
        present_attendance = StaffAttendance.objects(
            date__gte=today_start,
            date__lt=today_end,
            status='Present'
        )
        
        present_staff_list = []
        for record in present_attendance:
            try:
                # Skip if staff_id is invalid
                if not record.staff_id:
                    continue
                    
                staff = Staff.objects(id=record.staff_id).first()
                if staff and staff.is_active:
                    # Handle photo_url consistently with other endpoints
                    photo_url = ""
                    if staff.photo_url:
                        photo_url = staff.photo_url.url if hasattr(staff.photo_url, 'url') else staff.photo_url
                        if not photo_url.startswith('http'):
                            photo_url = request.build_absolute_uri(photo_url)
                    
                    # Safely get email with fallback
                    email = ""
                    try:
                        email = staff.email if staff.email else ""
                    except:
                        email = ""
                    
                    present_staff_list.append({
                        "id": str(staff.id),
                        "name": staff.name,
                        "phone": staff.phone,
                        "email": email,
                        "location": staff.location,
                        "photo_url": photo_url,
                        "status": record.status,
                        "marked_at": format_date(record.marked_at) if record.marked_at else None
                    })
            except Exception as e:
                print(f"Error fetching staff {getattr(record, 'staff_id', 'unknown')}: {e}")
                continue
        
        return Response({
            "date": today.strftime('%Y-%m-%d'),
            "present_count": len(present_staff_list),
            "staff": present_staff_list
        }, status=200)

    except Exception as e:
        print(f"Error in get_present_staff: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return Response({
            "date": get_ist_now().date().strftime('%Y-%m-%d'),
            "present_count": 0,
            "staff": [],
            "error": str(e)
        }, status=200)


@api_view(['GET'])
def get_absent_staff(request):
    """
    Get list of absent staff for today with full details
    """
    try:
        today = get_ist_now().date()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today + timedelta(days=1), datetime.min.time())
        
        # Get all active staff
        active_staff = Staff.objects(is_active=True)
        active_staff_ids = [str(staff.id) for staff in active_staff]
        
        # Get today's attendance records with 'Absent' status
        absent_attendance = StaffAttendance.objects(
            date__gte=today_start,
            date__lt=today_end,
            status='Absent'
        )
        
        # Create a map of staff who have attendance marked
        marked_staff_ids = {str(record.staff_id) for record in absent_attendance}
        
        absent_staff_list = []
        
        # First, add explicitly marked absent staff
        for record in absent_attendance:
            try:
                staff = Staff.objects(id=record.staff_id).first()
                if staff and staff.is_active:
                    # Handle photo_url consistently with other endpoints
                    photo_url = ""
                    if staff.photo_url:
                        photo_url = staff.photo_url.url if hasattr(staff.photo_url, 'url') else staff.photo_url
                        if not photo_url.startswith('http'):
                            photo_url = request.build_absolute_uri(photo_url)
                    
                    absent_staff_list.append({
                        "id": str(staff.id),
                        "name": staff.name,
                        "phone": staff.phone,
                        "email": staff.email or "",
                        "location": staff.location,
                        "photo_url": photo_url,
                        "status": record.status,
                        "marked_at": format_date(record.marked_at) if record.marked_at else None
                    })
            except Exception as e:
                print(f"Error fetching staff {record.staff_id}: {e}")
                continue
        
        # Then, add staff who haven't marked attendance (not in attendance records)
        for staff in active_staff:
            if str(staff.id) not in marked_staff_ids:
                # Check if they have any attendance record for today
                today_record = StaffAttendance.objects(
                    staff_id=str(staff.id),
                    date__gte=today_start,
                    date__lt=today_end
                ).first()
                
                if not today_record:
                    # Staff didn't mark attendance at all - treat as absent
                    # Handle photo_url consistently with other endpoints
                    photo_url = ""
                    if staff.photo_url:
                        photo_url = staff.photo_url.url if hasattr(staff.photo_url, 'url') else staff.photo_url
                        if not photo_url.startswith('http'):
                            photo_url = request.build_absolute_uri(photo_url)
                    
                    absent_staff_list.append({
                        "id": str(staff.id),
                        "name": staff.name,
                        "phone": staff.phone,
                        "email": staff.email or "",
                        "location": staff.location,
                        "photo_url": photo_url,
                        "status": "Absent",
                        "marked_at": None
                    })
        
        return Response({
            "date": today.strftime('%Y-%m-%d'),
            "absent_count": len(absent_staff_list),
            "staff": absent_staff_list
        }, status=200)

    except Exception as e:
        return Response({"error": str(e)}, status=500)


    # from datetime import datetime, timedelta
    # from collections import defaultdict

    # # Get filter parameters
    # staff_name_filter = request.GET.get('staff_name', '').strip()

    # # Base query for completed complaints
    # query = BookServiceComplaint.objects(status="completed", staff_name__ne=None)

    # # Apply staff name filter if provided
    # if staff_name_filter:
    #     query = query.filter(staff_name__icontains=staff_name_filter)

    # completed_complaints = query

    # # Group by staff member
    # staff_stats = defaultdict(lambda: {
    #     'client_payments': 0.0,  # Money received from clients (remarks field)
    #     'company_payments': 0.0,  # Money paid by company (amount field)
    #     'total_jobs': 0,
    #     'daily_stats': defaultdict(int),
    #     'name': '',
    #     'phone': '',
    #     'location': ''
    # })

    # for complaint in completed_complaints:
    #     staff_name = complaint.staff_name
    #     if not staff_name:
    #         continue

    #     # Get staff details
    #     staff = Staff.objects(name=staff_name).first()
    #     if staff:
    #         staff_stats[staff_name]['name'] = staff.name
    #         staff_stats[staff_name]['phone'] = staff.phone
    #         staff_stats[staff_name]['location'] = staff.location

    #     # Add client payments (from remarks field - what clients pay)
    #     client_amount = 0.0
    #     if complaint.remarks:
    #         try:
    #             # Try to extract numeric value from remarks
    #             import re
    #             numbers = re.findall(r'\d+\.?\d*', complaint.remarks)
    #             if numbers:
    #                 client_amount = float(numbers[0])
    #         except:
    #             client_amount = 0.0
    #     staff_stats[staff_name]['client_payments'] += client_amount

    #     # Add company payments (from amount field - what company pays)
    #     company_amount = complaint.amount or 0.0
    #     staff_stats[staff_name]['company_payments'] += float(company_amount)
    #     staff_stats[staff_name]['total_jobs'] += 1

    #     # Daily stats - detailed daily breakdown
    #     if complaint.completed_at:
    #         # Ensure we work with date only (not datetime) for proper grouping
    #         if hasattr(complaint.completed_at, 'date'):
    #             completed_date = complaint.completed_at.date()
    #         else:
    #             # If it's already a date object or string, parse it
    #             try:
    #                 completed_date = datetime.strptime(str(complaint.completed_at).split(' ')[0], '%Y-%m-%d').date()
    #             except:
    #                 continue  # Skip if date parsing fails

    #         date_key = completed_date.strftime('%Y-%m-%d')  # Consistent date format

    #         # Initialize daily stats if not exists
    #         if date_key not in staff_stats[staff_name]['daily_stats']:
    #             staff_stats[staff_name]['daily_stats'][date_key] = {
    #                 'jobs': 0,
    #                 'client_payments': 0.0,
    #                 'company_payments': 0.0
    #             }

    #         # Update daily stats - accumulate all jobs with same date
    #         staff_stats[staff_name]['daily_stats'][date_key]['jobs'] += 1
    #         staff_stats[staff_name]['daily_stats'][date_key]['client_payments'] += client_amount
    #         staff_stats[staff_name]['daily_stats'][date_key]['company_payments'] += float(company_amount)

    # # Convert to list format
    # result = []
    # for staff_name, stats in staff_stats.items():
    #     # Convert daily_stats defaultdict to regular dict
    #     daily_work = dict(stats['daily_stats'])

    #     result.append({
    #         'staff_name': staff_name,
    #         'name': stats['name'],
    #         'phone': stats['phone'],
    #         'location': stats['location'],
    #         'client_payments': round(stats['client_payments'], 2),
    #         'company_payments': round(stats['company_payments'], 2),
    #         'total_jobs_completed': stats['total_jobs'],
    #         'daily_work_completion': daily_work
    #     })

    # # Sort by total company payments (highest first)
    # result.sort(key=lambda x: x['company_payments'], reverse=True)

    # return Response(result, status=200)
    # for staff_name, stats in staff_stats.items():


# ------------------------------
#   Stock Management APIs
# ------------------------------

@api_view(['POST'])
def create_stock_item(request):
    """
    Create a new stock item and record stock history.
    """
    try:
        from .models import StockItem, StockHistory
        
        data = request.data
        
        # Validate required fields
        if not data.get('name'):
            return Response({"success": False, "error": "Stock name is required"}, status=status.HTTP_400_BAD_REQUEST)
        if data.get('quantity') is None:
            return Response({"success": False, "error": "Quantity is required"}, status=status.HTTP_400_BAD_REQUEST)
        if data.get('minimum_threshold') is None:
            return Response({"success": False, "error": "Minimum threshold is required"}, status=status.HTTP_400_BAD_REQUEST)

        quantity = int(data.get('quantity', 0) or 0)

        # Create stock item directly (bypass serializer)
        stock_item = StockItem(
            name=str(data.get('name', '')),
            category=str(data.get('category', '')),
            quantity=quantity,
            unit=str(data.get('unit', 'pcs')),
            minimum_threshold=int(data.get('minimum_threshold', 2)),
            selling_price=float(data.get('selling_price', 0) or 0),
            buying_price=float(data.get('buying_price', 0) or 0),
            minimum_price=float(data.get('minimum_price', 0) or 0),
            branch_name=str(data.get('branch_name', 'Main Branch'))
        )
        stock_item.save()
        print(f"[STOCK] Created: {stock_item.stock_id} - {stock_item.name} (qty: {stock_item.quantity})")

        # === RECORD STOCK HISTORY ===
        performed_by = request.headers.get('X-User-Name', 'Unknown')
        supplier = data.get('supplier')
        purchase_price_per_unit = data.get('purchase_price_per_unit')
        total_purchase_amount = data.get('total_purchase_amount')
        date_of_purchase_str = data.get('date_of_purchase')

        # Convert date_of_purchase_str to datetime if provided
        date_of_purchase = None
        if date_of_purchase_str:
            try:
                date_of_purchase = datetime.strptime(date_of_purchase_str, '%Y-%m-%d')
            except:
                date_of_purchase = None

        # Record history using helper function
        record_stock_history(
            stock_item=stock_item,
            operation_type='initial',
            quantity=stock_item.quantity,
            previous_quantity=0,
            new_quantity=stock_item.quantity,
            unit=stock_item.unit,
            notes='Initial stock',
            performed_by=performed_by,
            supplier=supplier,
            purchase_price_per_unit=float(purchase_price_per_unit) if purchase_price_per_unit else None,
            total_purchase_amount=float(total_purchase_amount) if total_purchase_amount else None,
            date_of_purchase=date_of_purchase
        )

        return Response({
            "success": True,
            "message": "Stock item created successfully",
            "stock_item": {
                "stock_id": stock_item.stock_id,
                "name": stock_item.name,
                "quantity": stock_item.quantity,
                "unit": stock_item.unit,
                "minimum_threshold": stock_item.minimum_threshold,
                "status": stock_item.get_status()
            }
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        import traceback
        import sys
        print(f"[STOCK] CREATE EXCEPTION: {e}")
        traceback.print_exc()
        return Response({
            "success": False, 
            "error": str(e),
            "traceback": traceback.format_exc()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_stock_items(request):
    """
    Get all stock items with current quantity and status
    """
    try:
        from datetime import datetime
        branch_filter = request.GET.get('branch_name')
        
        query = StockItem.objects.all()
        if branch_filter:
            query = query.filter(branch_name=branch_filter)
            
        stock_items = query.order_by('-created_at')
        data = []
        for item in stock_items:
            # Try to get the latest history record with supplier info
            # First try records with supplier not null/empty
            latest_with_supplier = StockHistory.objects(
                stock_id=item.stock_id,
                supplier__ne=None
            ).order_by('-created_at').first()
            
            if latest_with_supplier:
                supplier = latest_with_supplier.supplier or ''
                purchase_price = latest_with_supplier.purchase_price_per_unit
                total_purchase = latest_with_supplier.total_purchase_amount
                date_purchase = latest_with_supplier.date_of_purchase.strftime('%Y-%m-%d') if latest_with_supplier.date_of_purchase else ''
            else:
                # If no record with supplier, get the latest record
                latest_history = StockHistory.objects(
                    stock_id=item.stock_id
                ).order_by('-created_at').first()
                
                if latest_history:
                    supplier = latest_history.supplier or ''
                    purchase_price = latest_history.purchase_price_per_unit
                    total_purchase = latest_history.total_purchase_amount
                    date_purchase = latest_history.date_of_purchase.strftime('%Y-%m-%d') if latest_history.date_of_purchase else ''
                else:
                    supplier = ''
                    purchase_price = None
                    total_purchase = None
                    date_purchase = ''
            
            data.append({
                "id": str(item.id),
                "stock_id": item.stock_id,
                "name": item.name,
                "category": item.category,
                "quantity": item.quantity,
                "unit": item.unit,
                "minimum_threshold": item.minimum_threshold,
                "selling_price": item.selling_price,
                "buying_price": item.buying_price,
                "minimum_price": item.minimum_price,
                "purchase_price_per_unit": purchase_price,
                "total_purchase_amount": total_purchase,
                "supplier": supplier,
                "date_of_purchase": date_purchase,
                "status": item.get_status(),
                "branch_name": item.branch_name,
                "created_at": format_date(item.created_at),
                "updated_at": format_date(item.updated_at)
            })
        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({
            "success": False,
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
def add_stock(request, stock_id):
    """
    Increase stock quantity
    """
    try:
        stock_item = StockItem.objects(stock_id=stock_id).first()
        if not stock_item:
            return Response({
                "success": False,
                "error": "Stock item not found"
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = StockAddSerializer(data=request.data)
        if serializer.is_valid():
            quantity_to_add = serializer.validated_data['quantity']
            # Extract supplier and price information from request
            supplier = serializer.validated_data.get('supplier', None)
            purchase_price_per_unit = serializer.validated_data.get('purchase_price_per_unit', None)
            total_purchase_amount = serializer.validated_data.get('total_purchase_amount', None)
            date_of_purchase_str = serializer.validated_data.get('date_of_purchase', None)
            minimum_price = serializer.validated_data.get('minimum_price', None)
            minimum_threshold = serializer.validated_data.get('minimum_threshold', None)
            
            # Debug logging
            print("=== ADD STOCK DEBUG ===")
            print(f"quantity_to_add: {quantity_to_add}")
            print(f"supplier: {supplier}")
            print(f"purchase_price_per_unit: {purchase_price_per_unit}")
            print(f"total_purchase_amount: {total_purchase_amount}")
            print(f"date_of_purchase_str: {date_of_purchase_str}")
            print("======================")
            
            # Convert date string to datetime if provided
            date_of_purchase = None
            if date_of_purchase_str:
                try:
                    date_of_purchase = datetime.strptime(date_of_purchase_str, '%Y-%m-%d')
                except:
                    date_of_purchase = None

            # Update minimum price and threshold if provided
            if minimum_price is not None:
                stock_item.minimum_price = minimum_price
            if minimum_threshold is not None:
                stock_item.minimum_threshold = minimum_threshold
            if purchase_price_per_unit is not None:
                stock_item.buying_price = purchase_price_per_unit
            
            # Update selling price if provided
            selling_price_req = request.data.get('selling_price')
            if selling_price_req is not None:
                try:
                    stock_item.selling_price = float(selling_price_req)
                except:
                    pass
            
            previous_quantity = stock_item.quantity
            success, message = stock_item.add_stock(quantity_to_add)
            
            # Record history with supplier and price information
            performed_by = request.headers.get('X-User-Name', 'Unknown')
            record_stock_history(
                stock_item=stock_item,
                operation_type='add',
                quantity=quantity_to_add,
                previous_quantity=previous_quantity,
                new_quantity=stock_item.quantity,
                performed_by=performed_by,
                notes='Stock added',
                supplier=supplier,
                purchase_price_per_unit=purchase_price_per_unit,
                total_purchase_amount=total_purchase_amount,
                date_of_purchase=date_of_purchase
            )
            
            if success:
                return Response({
                    "success": True,
                    "message": message,
                    "stock_item": {
                        "stock_id": stock_item.stock_id,
                        "name": stock_item.name,
                        "quantity": stock_item.quantity,
                        "status": stock_item.get_status()
                    }
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "success": False,
                    "message": message
                }, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            "success": False,
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
def reduce_stock(request, stock_id):
    """
    Reduce stock quantity (on sell/usage)
    """
    try:
        stock_item = StockItem.objects(stock_id=stock_id).first()
        if not stock_item:
            return Response({
                "success": False,
                "error": "Stock item not found"
            }, status=status.HTTP_404_NOT_FOUND)

        # DEBUG: Log the actual request data
        print("=== REDUCE_STOCK DEBUG ===")
        print("Request data type:", type(request.data))
        print("Request data:", request.data)
        print("Request data keys:", list(request.data.keys()) if hasattr(request.data, 'keys') else 'No keys')
        print("=========================")

        # Handle different request data formats - be very flexible
        quantity_to_reduce = None
        
        # Method 1: Direct quantity field (most common)
        if 'quantity' in request.data:
            quantity_to_reduce = request.data['quantity']
            print(f"Found quantity directly: {quantity_to_reduce}")
        
        # Method 2: If request.data is a string (sometimes happens with certain clients)
        elif isinstance(request.data, str):
            try:
                import json
                parsed_data = json.loads(request.data)
                if 'quantity' in parsed_data:
                    quantity_to_reduce = parsed_data['quantity']
                    print(f"Found quantity in parsed JSON string: {quantity_to_reduce}")
            except:
                pass
        
        # Method 3: If it's a list or other format
        elif isinstance(request.data, list) and len(request.data) > 0:
            if isinstance(request.data[0], dict) and 'quantity' in request.data[0]:
                quantity_to_reduce = request.data[0]['quantity']
                print(f"Found quantity in first array element: {quantity_to_reduce}")

        # Validate quantity
        if quantity_to_reduce is None:
            return Response({
                "success": False,
                "error": "Quantity is required",
                "message": "Please provide quantity field in the request",
                "received_data": str(request.data)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Convert to integer with more flexible parsing
        try:
            # Handle string numbers
            if isinstance(quantity_to_reduce, str):
                quantity_to_reduce = quantity_to_reduce.strip()
                if quantity_to_reduce.isdigit():
                    quantity_to_reduce = int(quantity_to_reduce)
                else:
                    # Try float then int conversion for decimal strings
                    quantity_to_reduce = int(float(quantity_to_reduce))
            else:
                quantity_to_reduce = int(quantity_to_reduce)
            
            print(f"Converted quantity: {quantity_to_reduce} (type: {type(quantity_to_reduce)})")
        except (ValueError, TypeError) as e:
            return Response({
                "success": False,
                "error": "Invalid quantity format",
                "message": f"Quantity must be a valid integer. Got: {quantity_to_reduce} (type: {type(quantity_to_reduce)})",
                "exception": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if quantity_to_reduce <= 0:
            return Response({
                "success": False,
                "error": "Invalid quantity value",
                "message": f"Quantity must be greater than 0. Got: {quantity_to_reduce}"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Perform stock reduction
        previous_quantity = stock_item.quantity
        motor_brand = request.data.get('motor_brand') or request.data.get('brand_name')
        brand_id = request.data.get('brand_id')
        source = request.data.get('source', 'manual')
        
        # ⭐ REFACTORED: Single source of truth for stock reduction (handles MotorVariant + brand_id mapping)
        success, message = stock_item.reduce_stock(quantity_to_reduce)
        
        if success:
            # Record history
            performed_by = request.headers.get('X-User-Name', 'Unknown')
            record_stock_history(
                stock_item=stock_item,
                operation_type='reduce',
                quantity=quantity_to_reduce,
                previous_quantity=previous_quantity,
                new_quantity=stock_item.quantity,
                performed_by=performed_by,
                notes=f"Stock reduced via {source}" + (f" for brand {motor_brand}" if motor_brand else ""),
                type='out',
                source=source
            )
            
            return Response({
                "success": True,
                "message": message,
                "stock_item": {
                    "stock_id": stock_item.stock_id,
                    "name": stock_item.name,
                    "quantity": stock_item.quantity,
                    "status": stock_item.get_status()
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                "success": False,
                "message": message
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        print(f"=== REDUCE_STOCK EXCEPTION ===")
        print(f"Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        print("=============================")
        
        return Response({
            "success": False,
            "error": str(e),
            "message": "An unexpected error occurred"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ------------------------------
#   Delete Stock Item
# ------------------------------
@api_view(['DELETE'])
def delete_stock_item(request, stock_id):
    """
    Delete a stock item completely from the system
    """
    try:
        stock_item = StockItem.objects(stock_id=stock_id).first()
        if not stock_item:
            return Response({
                "success": False,
                "error": "Stock item not found"
            }, status=status.HTTP_404_NOT_FOUND)

        # Delete the stock item
        stock_item.delete()
        
        return Response({
            "success": True,
            "message": f"Stock item '{stock_item.name}' deleted successfully"
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            "success": False,
            "error": str(e),
            "message": "An unexpected error occurred"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ------------------------------
#   Update Stock Item
# ------------------------------
@api_view(['PUT'])
def update_stock_item(request, stock_id):
    """
    Update an existing stock item
    """
    try:
        stock_item = StockItem.objects(stock_id=stock_id).first()
        if not stock_item:
            return Response({
                "success": False,
                "error": "Stock item not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get update data from request
        name = request.data.get('name')
        category = request.data.get('category')
        minimum_threshold = request.data.get('minimum_threshold')
        selling_price = request.data.get('selling_price')
        supplier = request.data.get('supplier')
        purchase_price_per_unit = request.data.get('purchase_price_per_unit')
        total_purchase_amount = request.data.get('total_purchase_amount')
        date_of_purchase = request.data.get('date_of_purchase')
        
        # Update stock item fields
        if name is not None:
            stock_item.name = name
        if category is not None:
            stock_item.category = category
        if minimum_threshold is not None:
            stock_item.minimum_threshold = int(minimum_threshold)
        if selling_price is not None:
            stock_item.selling_price = float(selling_price) if selling_price else None
        
        minimum_price = request.data.get('minimum_price')
        if minimum_price is not None:
            stock_item.minimum_price = float(minimum_price) if minimum_price else None
        
        stock_item.save()
        
        # Record history for the update with supplier info
        if supplier or purchase_price_per_unit or date_of_purchase:
            performed_by = request.headers.get('X-User-Name', 'Unknown')
            
            # Convert date string to datetime if provided
            date_purchase_dt = None
            if date_of_purchase:
                try:
                    date_purchase_dt = datetime.strptime(date_of_purchase, '%Y-%m-%d')
                except:
                    date_purchase_dt = None
            
            record_stock_history(
                stock_item=stock_item,
                operation_type='add',
                quantity=0,
                previous_quantity=stock_item.quantity,
                new_quantity=stock_item.quantity,
                performed_by=performed_by,
                notes='Stock item updated with supplier info',
                supplier=supplier,
                purchase_price_per_unit=float(purchase_price_per_unit) if purchase_price_per_unit else None,
                total_purchase_amount=float(total_purchase_amount) if total_purchase_amount else None,
                date_of_purchase=date_purchase_dt
            )
        
        return Response({
            "success": True,
            "message": "Stock item updated successfully",
            "stock_item": {
                "stock_id": stock_item.stock_id,
                "name": stock_item.name,
                "category": stock_item.category,
                "quantity": stock_item.quantity,
                "unit": stock_item.unit,
                "minimum_threshold": stock_item.minimum_threshold,
                "selling_price": stock_item.selling_price,
                "status": stock_item.get_status()
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({
            "success": False,
            "error": str(e),
            "message": "An unexpected error occurred"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_stock_alerts(request):
    """
    Get stock items where quantity <= minimum_threshold
    Returns items that are low or out of stock
    """
    try:
        branch_name = request.GET.get('branch_name')
        query = StockItem.objects
        if branch_name:
            query = query.filter(branch_name=branch_name)
            
        all_items = query.all()
        
        alert_items = []
        for item in all_items:
            # Check if quantity is 0 or <= minimum_threshold
            if item.quantity == 0 or (item.minimum_threshold and item.quantity <= item.minimum_threshold):
                alert_items.append(item)
        
        data = []
        for item in alert_items:
            status_text = item.get_status()
            if status_text == "Out of Stock":
                alert_type = "danger"
            elif status_text == "Low":
                alert_type = "warning"
            else:
                alert_type = "info"
                
            data.append({
                "stock_id": item.stock_id,
                "name": item.name,
                "quantity": item.quantity,
                "minimum_threshold": item.minimum_threshold,
                "status": status_text,
                "unit": item.unit,
                "alert_type": alert_type
            })
        
        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            "success": False,
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ------------------------------
#   Stock History Functions
# ------------------------------
def record_stock_history(stock_item, operation_type, quantity, previous_quantity, new_quantity, performed_by, notes=None, supplier=None, purchase_price_per_unit=None, total_purchase_amount=None, date_of_purchase=None, type=None, source=None, complaint_no=None, customer_id=None, unit=None, branch_name=None):
    """
    Helper function to record stock history.
    """
    try:
        # Debug logging
        print("=== RECORD STOCK HISTORY DEBUG ===")
        print(f"stock_id: {stock_item.stock_id}")
        print(f"stock_name: {stock_item.name}")
        print(f"operation_type: {operation_type}")
        print(f"quantity: {quantity}")
        print(f"new_quantity: {new_quantity}")
        print(f"performed_by: {performed_by}")
        print(f"notes: {notes}")
        print("==================================")

        # If branch_name not provided, use the stock_item's branch
        if not branch_name:
            branch_name = getattr(stock_item, 'branch_name', 'Main Branch')

        history = StockHistory(
            stock_id=stock_item.stock_id,
            stock_name=stock_item.name,
            operation_type=operation_type,
            quantity=quantity,
            previous_quantity=previous_quantity,
            new_quantity=new_quantity,
            unit=unit or stock_item.unit,
            notes=notes,
            performed_by=performed_by,
            supplier=supplier,
            purchase_price_per_unit=purchase_price_per_unit,
            total_purchase_amount=total_purchase_amount,
            date_of_purchase=date_of_purchase,
            type=type or ('out' if operation_type == 'reduce' else 'in'),
            source=source or 'manual',
            complaint_no=complaint_no,
            customer_id=customer_id,
            branch_name=branch_name
        )
        history.save()
        print(f"[OK] Stock history saved successfully for {stock_item.stock_id} (Operation: {operation_type})")
        return True
    except Exception as e:
        print(f"[ERROR] ERROR recording stock history: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


@api_view(['GET'])
def get_stock_history(request):
    """
    Get stock history - optionally filtered by stock_id
    """
    try:
        stock_id = request.GET.get('stock_id')
        branch_name = request.GET.get('branch_name')
        
        query_params = {}
        if stock_id:
            query_params['stock_id'] = stock_id
        if branch_name:
            query_params['branch_name'] = branch_name
            
        history = StockHistory.objects(**query_params).order_by('-created_at')
        
        # Limit to recent 100 records if no specific stock_id
        if not stock_id:
            history = history.limit(100)
        
        data = [
            {
                "id": str(h.id),
                "stock_id": h.stock_id,
                "stock_name": h.stock_name,
                "operation_type": h.operation_type,
                "quantity": h.quantity,
                "previous_quantity": h.previous_quantity,
                "new_quantity": h.new_quantity,
                "unit": h.unit,
                "notes": h.notes,
                "performed_by": h.performed_by,
                "supplier": h.supplier,
                "purchase_price_per_unit": h.purchase_price_per_unit,
                "total_purchase_amount": h.total_purchase_amount,
                "date_of_purchase": h.date_of_purchase.strftime('%Y-%m-%d') if h.date_of_purchase else None,
                "motor_brand": h.motor_brand,
                "created_at": h.created_at.strftime('%Y-%m-%d %H:%M:%S') if h.created_at else None
            }
            for h in history
        ]
        
        return Response(data)
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def backfill_stock_history(request):
    """
    Create missing 'initial' history records for existing stocks that have no history.
    Call this once to fix existing data.
    """
    try:
        from .models import StockItem, StockHistory as SH
        all_stocks = StockItem.objects.all()
        created = 0
        skipped = 0

        for stock in all_stocks:
            existing = SH.objects(stock_id=stock.stock_id).first()
            if not existing:
                performed_by = request.headers.get('X-User-Name', 'System')
                result = record_stock_history(
                    stock_item=stock,
                    operation_type='initial',
                    quantity=stock.quantity,
                    previous_quantity=0,
                    new_quantity=stock.quantity,
                    performed_by=performed_by,
                    notes='Backfilled initial stock record'
                )
                if result:
                    created += 1
            else:
                skipped += 1

        return Response({
            "success": True,
            "message": f"Backfill complete: {created} history records created, {skipped} stocks already had history"
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            "success": False,
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_product_purchase_history(request):
    """
    Get product purchase history from completed bookings
    Returns list of completed bookings with product details
    """
    try:
        branch_name = request.GET.get('branch_name')
        query_params = {'status': 'completed'}
        if branch_name:
            query_params['branch_name'] = branch_name

        # Get completed bookings with product information
        # Include all completed bookings (including motor services if they have products)
        completed_bookings = BookServiceComplaint.objects(
            **query_params
        ).order_by('-date_created').limit(200)
        
        data = []
        for booking in completed_bookings:
            # Only include bookings that have products recorded in product_name or additional_product
            # We also check that they are not just empty JSON arrays
            has_products = False
            
            if booking.product_name and booking.product_name != "[]":
                has_products = True
            elif booking.additional_product and booking.additional_product != "[]":
                has_products = True
                
            if has_products:
                # Get customer name: try booking.customer_name first, then ClientDetails fallback
                customer_name = booking.customer_name or "Unknown"
                if booking.customer_id:
                    try:
                        customer = ClientDetails.objects(customer_id=booking.customer_id).first()
                        if customer:
                            customer_name = customer.customer_name
                    except:
                        pass
                
                booking_data = {
                    "id": str(booking.id),
                    "complaint_no": booking.complaint_no,
                    "customer_id": booking.customer_id,
                    "customer_name": customer_name,
                    "phone": booking.phone,
                    "product_name": booking.product_name if booking.product_name != "[]" else None,
                    "product_quantity": booking.product_quantity or None,
                    "additional_product": booking.additional_product if booking.additional_product != "[]" else None,
                    "additional_product_quantity": booking.additional_product_quantity or None,
                    "created_at": booking.date_created.strftime('%Y-%m-%d %H:%M:%S') if booking.date_created else None,
                    "completed_at": booking.assigned_completed_at.strftime('%Y-%m-%d %H:%M:%S') if booking.assigned_completed_at else None,
                    "branch_name": booking.branch_name or "Main Branch",
                }
                data.append(booking_data)
        
        return Response(data)
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


from .invoice_utils import get_next_invoice_number

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

# ------------------------------
#   Motor Brand Management API Endpoints





# ------------------------------
#   INVOICE GENERATION
# ------------------------------
@api_view(['POST'])
@permission_classes([AllowAny])
def generate_invoice(request, complaint_id):
    """
    Generate invoice PDF for a completed complaint
    POST /api/generate-invoice/<complaint_id>/
    
    This function uses the new invoice_generator module for stable invoice creation.
    """
    try:
        from .models import BookServiceComplaint
        from .invoice_generator import generate_invoice_pdf
        
        # Fetch complaint - handle both ObjectId and complaint_no
        # Also handle URL-encoded characters like %23 -> #
        import urllib.parse
        complaint_id = urllib.parse.unquote(complaint_id)
        
        if len(str(complaint_id)) == 24 and str(complaint_id).isalnum():
            # It looks like a MongoDB ObjectId (24 chars alphanumeric)
            complaint = BookServiceComplaint.objects(id=complaint_id).first()
        else:
            # It's a complaint_no - find by complaint_no
            # Try both with and without # prefix (the complaint could be stored either way)
            complaint = BookServiceComplaint.objects(complaint_no=complaint_id).first()
            if not complaint:
                # Try with # prefix
                if not complaint_id.startswith('#'):
                    complaint = BookServiceComplaint.objects(complaint_no=f'#{complaint_id}').first()
                # Try without # prefix
                else:
                    complaint = BookServiceComplaint.objects(complaint_no=complaint_id.lstrip('#')).first()
        
        if not complaint:
            return Response({
                "error": "Complaint not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Validate complaint is completed
        if complaint.status != 'completed':
            return Response({
                "error": "Invoice can only be generated for completed jobs"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # If invoice already generated, return existing data
        if False: # complaint.invoice_number and complaint.invoice_pdf_url:
            return Response({
                "invoice_number": complaint.invoice_number,
                "pdf_url": complaint.invoice_pdf_url,
                "customer_phone": complaint.phone
            })
        
        # Generate invoice using the new module
        invoice_data = generate_invoice_pdf(complaint, request)
        
        # Save invoice details to complaint
        complaint.invoice_number = invoice_data['invoice_number']
        complaint.invoice_pdf_url = invoice_data['pdf_url']
        complaint.invoice_generated_at = get_ist_now()
        # Save grand_total and total_amount if available
        if 'grand_total' in invoice_data:
            complaint.grand_total = invoice_data['grand_total']
            complaint.total_amount = invoice_data['grand_total']  # Ensure consistency
        complaint.save()
        
        return Response({
            "invoice_number": invoice_data['invoice_number'],
            "pdf_url": invoice_data['pdf_url'],
            "customer_phone": complaint.phone
        })
        
    except Exception as e:
        import traceback
        return Response({
            "error": f"Failed to generate invoice: {str(e)}",
            "traceback": traceback.format_exc()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Keep the old generate_invoice for backward compatibility during transition
# This function is now deprecated - please use the new one above
@api_view(['POST'])
@permission_classes([AllowAny])
def generate_invoice_legacy(request, complaint_id):
    """
    DEPRECATED: Legacy generate invoice function
    Use generate_invoice instead
    """
    return generate_invoice(request, complaint_id)


@api_view(['GET'])
def get_all_invoices(request):
    """
    Get all invoices (completed complaints with invoices generated)
    GET /api/invoices/
    """
    try:
        # Get all complaints that have invoices generated
        invoices = BookServiceComplaint.objects(
            invoice_number__exists=True,
            invoice_number__ne=None
        ).order_by('-invoice_generated_at')
        
        # Get the host for full URLs
        request_host = request.get_host() if request else 'localhost:8000'
        
        data = []
        for invoice in invoices:
            # Generate full URL for PDF (use https:// for WhatsApp compatibility)
            pdf_url = invoice.invoice_pdf_url
            if pdf_url and not pdf_url.startswith('http'):
                pdf_url = f"https://{request_host}{pdf_url}"
            
            invoice_data = {
                "id": str(invoice.id),
                "complaint_no": invoice.complaint_no,
                "invoice_number": invoice.invoice_number,
                "invoice_pdf_url": pdf_url,
                "invoice_generated_at": invoice.invoice_generated_at.strftime('%Y-%m-%d %H:%M:%S') if invoice.invoice_generated_at else None,
                "customer_name": invoice.customer_name,
                "customer_phone": invoice.phone,
                "address": invoice.address,
                "product_name": invoice.product_name,
                "additional_product": invoice.additional_product,
                "product_quantity": invoice.product_quantity,
                "additional_product_quantity": invoice.additional_product_quantity,
                "grand_total": getattr(invoice, "grand_total", 0) or invoice.calculate_grand_total(),
                "amount": (getattr(invoice, "grand_total", 0) or invoice.calculate_grand_total()) or (invoice.client_amount or invoice.amount or 0),
                "status": invoice.status
            }
            data.append(invoice_data)
        
        return Response(data)
    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ------------------------------
#   DOWNLOAD INVOICE PDF
# ------------------------------
@api_view(['GET'])
def download_invoice(request, invoice_number):
    """
    Download invoice PDF with proper filename
    GET /api/download-invoice/<invoice_number>/
    """
    try:
        # Find the complaint with this invoice number
        complaint = BookServiceComplaint.objects(invoice_number=invoice_number).first()
        
        if not complaint or not complaint.invoice_pdf_url:
            return Response({
                "error": "Invoice not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Extract filename from PDF URL
        pdf_filename = complaint.invoice_pdf_url.split('/')[-1]
        pdf_path = os.path.join(settings.MEDIA_ROOT, 'invoices', pdf_filename)
        
        if not os.path.exists(pdf_path):
            return Response({
                "error": "Invoice file not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Create response with proper Content-Disposition header
        response = FileResponse(
            open(pdf_path, 'rb'),
            content_type='application/pdf'
        )
        response['Content-Disposition'] = f'attachment; filename="{pdf_filename}"'
        
        return response
        
    except Exception as e:
        return Response({
            "error": f"Failed to download invoice: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ------------------------------
@api_view(['GET'])
def calculate_payroll(request):
    """
    Calculate payroll for all staff for a given month and year or a custom date range.
    GET /api/payroll/calculate/?month=3&year=2026
    GET /api/payroll/calculate/?start_date=2026-06-01&end_date=2026-06-15
    """
    try:
        now = get_ist_now()
        start_date_str = request.GET.get('start_date', None)
        end_date_str = request.GET.get('end_date', None)
        
        if start_date_str and end_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
            if start_date > end_date:
                start_date, end_date = end_date, start_date
            
            date_list = []
            curr = start_date
            while curr <= end_date:
                date_list.append(curr)
                curr += timedelta(days=1)
                
            month = start_date.month
            year = start_date.year
            days_in_period = len(date_list)
            
            # Preserve existing adjustments for custom range if calculated before
            existing_payrolls = StaffPayroll.objects(start_date=start_date, end_date=end_date)
            payroll_adjustments = {str(p.staff_id): {'bonus': p.bonus or 0, 'deduction': p.deduction or 0} for p in existing_payrolls}
            StaffPayroll.objects(start_date=start_date, end_date=end_date).delete()
        else:
            month = int(request.GET.get('month', now.month))
            year = int(request.GET.get('year', now.year))
            days_in_month = calendar.monthrange(year, month)[1]
            date_list = [datetime(year, month, d) for d in range(1, days_in_month + 1)]
            days_in_period = days_in_month
            
            # Preserve existing adjustments for standard month range
            existing_payrolls = StaffPayroll.objects(month=month, year=year, start_date=None, end_date=None)
            payroll_adjustments = {str(p.staff_id): {'bonus': p.bonus or 0, 'deduction': p.deduction or 0} for p in existing_payrolls}
            StaffPayroll.objects(month=month, year=year, start_date=None, end_date=None).delete()
            
        # Get all active staff
        staff_list = Staff.objects(is_active=True)
        
        if staff_list.count() == 0:
            return Response({
                'success': True,
                'month': month,
                'year': year,
                'start_date': start_date_str,
                'end_date': end_date_str,
                'payroll': [],
                'message': 'No active staff found'
            }, status=status.HTTP_200_OK)
        
        # Step 1: Auto-generate Sundays in HolidayCalendar for this period globally
        for date_obj in date_list:
            if date_obj.strftime("%A") == "Sunday":
                # Check for global Sunday entry
                existing = HolidayCalendar.objects(date=date_obj, staff_id=None).first()
                if not existing:
                    try:
                        HolidayCalendar(
                            date=date_obj,
                            name="Week Off",
                            type="weekly_off",
                            is_paid=True,
                            is_auto=True
                        ).save()
                    except: # Catch potential race conditions
                        pass

        payroll_data = []
        
        for staff in staff_list:
            staff_id = str(staff.id)
            per_day_salary = float(staff.per_day_salary or 0)
            
            total_salary = 0
            total_multiplier = 0
            present_days = 0
            half_days = 0
            leave_days = 0
            absent_days = 0
            holiday_days = 0
            paid_holiday_days = 0
            unpaid_holiday_days = 0

            for current_date in date_list:
                res = resolve_attendance(staff_id, current_date)
                
                status_val = res.get("status")
                attn_type = res.get("attendance_type")
                work_type = res.get("work_type", "full_day")
                multiplier = float(res.get("salary_multiplier", 1))
                source = res.get("source")
                is_paid = res.get("is_paid", True)

                # Bonus multiplier logic for working on holidays/weekly-offs
                if source == "manual" and multiplier <= 1.0 and attn_type != "holiday":
                    holiday_check = HolidayCalendar.objects(
                        date=current_date, 
                        is_active=True, 
                        staff_id__in=[None, staff_id]
                    ).first()
                    
                    if holiday_check:
                        multiplier = 2.0  # Bonus multiplier for working on holiday
                    else:
                        if current_date.strftime("%A") in (staff.weekly_off_days or []):
                            multiplier = 2.0

                if status_val == "Present":
                    if attn_type == "holiday":
                        holiday_days += 1
                        if is_paid:
                            paid_holiday_days += 1
                        else:
                            unpaid_holiday_days += 1
                        total_salary += per_day_salary * multiplier
                    elif attn_type == "leave":
                        leave_days += 1
                        total_salary += per_day_salary * multiplier
                    elif work_type == "half_day":
                        half_days += 1
                        total_salary += (per_day_salary * 0.5) * multiplier
                    else:
                        present_days += 1
                        total_salary += per_day_salary * multiplier
                    
                    total_multiplier += multiplier
                else:
                    # ONLY increment absent_days if the day has already passed or is today
                    if current_date.date() <= now.date():
                        absent_days += 1

            # Calculate attendance percentage
            total_worked_days = present_days + (half_days * 0.5) + paid_holiday_days + leave_days
            passed_days_in_period = sum(1 for d in date_list if d.date() <= now.date())
            denominator = passed_days_in_period if passed_days_in_period > 0 else len(date_list)
            attendance_percentage = (total_worked_days / denominator * 100) if denominator > 0 else 0
            
            payroll_data.append({
                'staff_id': staff_id,
                'staff_name': staff.name,
                'phone': getattr(staff, 'phone', ''),
                'per_day_salary': per_day_salary,
                'monthly_salary': getattr(staff, 'monthly_salary', 0) or 0,
                'present_days': present_days,
                'half_days': half_days,
                'holiday_days': holiday_days,
                'paid_holiday_days': paid_holiday_days,
                'unpaid_holiday_days': unpaid_holiday_days,
                'leave_days': leave_days,
                'absent_days': absent_days,
                'total_multiplier': round(total_multiplier, 2),
                'total_salary': round(total_salary, 2),
                'days_in_month': days_in_period,
                'calculation_up_to': denominator,
                'attendance_percentage': round(attendance_percentage, 2),
                'bonus': 0,
                'deduction': 0,
                'total_incentives': 0,
                'final_salary': round(total_salary, 2)
            })
            
            # Calculate adjustments - preserve from existing records if they were there
            bonus = 0
            deduction = 0
            
            if staff_id in payroll_adjustments:
                bonus = float(payroll_adjustments[staff_id].get('bonus', 0))
                deduction = float(payroll_adjustments[staff_id].get('deduction', 0))
            
            payroll_data[-1]['bonus'] = bonus
            payroll_data[-1]['deduction'] = deduction

            # ✅ Sum all staff_incentive amounts from completed bookings in this period
            if start_date_str and end_date_str:
                period_start = start_date
                period_end = end_date + timedelta(days=1)
            else:
                period_start = datetime(year, month, 1)
                if month == 12:
                    period_end = datetime(year + 1, 1, 1)
                else:
                    period_end = datetime(year, month + 1, 1)

            completed_bookings = BookServiceComplaint.objects(
                staff_name__iexact=staff.name,
                status='completed',
                assigned_completed_at__gte=period_start,
                assigned_completed_at__lt=period_end
            )
            total_incentives = sum(float(getattr(b, 'staff_incentive', 0) or 0) for b in completed_bookings)
            payroll_data[-1]['total_incentives'] = round(total_incentives, 2)
            payroll_data[-1]['final_salary'] = round(total_salary + bonus - deduction + total_incentives, 2)
        
        return Response({
            'success': True,
            'month': month,
            'year': year,
            'start_date': start_date_str,
            'end_date': end_date_str,
            'payroll': payroll_data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def save_payroll(request):
    """
    Save calculated payroll to database.
    POST /api/payroll/save
    Body: { "month": 3, "year": 2026, "payroll": [...], "start_date": "2026-06-01", "end_date": "2026-06-15" }
    """
    try:
        month = int(request.data.get('month'))
        year = int(request.data.get('year'))
        start_date_str = request.data.get('start_date', None)
        end_date_str = request.data.get('end_date', None)
        payroll_list = request.data.get('payroll', [])
        
        start_date = None
        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str.split('T')[0], '%Y-%m-%d')
            except:
                pass
        end_date = None
        if end_date_str:
            try:
                end_date = datetime.strptime(end_date_str.split('T')[0], '%Y-%m-%d')
            except:
                pass
                
        saved_records = []
        
        for item in payroll_list:
            staff_id = item.get('staff_id')
            staff_name = item.get('staff_name')
            
            # Check if payroll already exists for this staff/range
            if start_date and end_date:
                existing = StaffPayroll.objects(
                    staff_id=staff_id,
                    start_date=start_date,
                    end_date=end_date
                ).first()
            else:
                existing = StaffPayroll.objects(
                    staff_id=staff_id,
                    month=month,
                    year=year,
                    start_date=None,
                    end_date=None
                ).first()
            
            if existing:
                # Update existing record
                existing.present_days = item.get('present_days', 0)
                existing.half_days = item.get('half_days', 0)
                existing.holiday_days = item.get('holiday_days', 0)
                existing.paid_holiday_days = item.get('paid_holiday_days', 0)
                existing.unpaid_holiday_days = item.get('unpaid_holiday_days', 0)
                existing.leave_days = item.get('leave_days', 0)
                existing.absent_days = item.get('absent_days', 0)
                existing.per_day_salary = item.get('per_day_salary', 0)
                existing.monthly_salary = item.get('monthly_salary', 0)
                existing.total_salary = item.get('total_salary', 0)
                existing.total_multiplier = item.get('total_multiplier', 0)
                existing.attendance_percentage = item.get('attendance_percentage', 0)
                existing.days_in_month = item.get('days_in_month', 0)
                existing.bonus = item.get('bonus', 0)
                existing.deduction = item.get('deduction', 0)
                existing.total_incentives = item.get('total_incentives', 0)
                existing.final_salary = round(existing.total_salary + (existing.bonus or 0) - (existing.deduction or 0) + (existing.total_incentives or 0), 2)
                existing.status = item.get('status', existing.status or 'paid')
                existing.start_date = start_date
                existing.end_date = end_date
                existing.generated_at = get_ist_now()
                existing.save()
                saved_records.append(str(existing.id))
            else:
                # Create new record
                bonus_val = item.get('bonus', 0)
                deduction_val = item.get('deduction', 0)
                total_salary_val = item.get('total_salary', 0)
                total_multiplier_val = item.get('total_multiplier', 0)
                payroll = StaffPayroll(
                    staff_id=staff_id,
                    staff_name=staff_name,
                    month=month,
                    year=year,
                    present_days=item.get('present_days', 0),
                    half_days=item.get('half_days', 0),
                    holiday_days=item.get('holiday_days', 0),
                    paid_holiday_days=item.get('paid_holiday_days', 0),
                    unpaid_holiday_days=item.get('unpaid_holiday_days', 0),
                    leave_days=item.get('leave_days', 0),
                    absent_days=item.get('absent_days', 0),
                    per_day_salary=item.get('per_day_salary', 0),
                    monthly_salary=item.get('monthly_salary', 0),
                    total_salary=total_salary_val,
                    total_multiplier=total_multiplier_val,
                    attendance_percentage=item.get('attendance_percentage', 0),
                    days_in_month=item.get('days_in_month', 0),
                    bonus=bonus_val,
                    deduction=deduction_val,
                    total_incentives=item.get('total_incentives', 0),
                    final_salary=round(total_salary_val + bonus_val - deduction_val + item.get('total_incentives', 0), 2),
                    status=item.get('status', 'paid') or 'paid',
                    start_date=start_date,
                    end_date=end_date
                )
                payroll.save()
                saved_records.append(str(payroll.id))
        
        return Response({
            'success': True,
            'message': f'Payroll saved for {len(saved_records)} staff',
            'saved_count': len(saved_records)
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_payroll_history(request):
    """
    Get saved payroll history.
    GET /api/payroll/history/?month=3&year=2026
    GET /api/payroll/history/?start_date=2026-06-01&end_date=2026-06-15
    """
    try:
        month = request.GET.get('month')
        year = request.GET.get('year')
        start_date_str = request.GET.get('start_date')
        end_date_str = request.GET.get('end_date')
        
        query = {}
        if start_date_str and end_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
            query['start_date'] = start_date
            query['end_date'] = end_date
        else:
            if month:
                query['month'] = int(month)
            if year:
                query['year'] = int(year)
                query['start_date'] = None
                query['end_date'] = None
        
        if query:
            payroll_records = StaffPayroll.objects(__raw__=query).order_by('-year', '-month')
        else:
            payroll_records = StaffPayroll.objects.order_by('-year', '-month')
        
        data = []
        for record in payroll_records:
            calculated_final_salary = round((record.total_salary or 0) + (record.bonus or 0) - (record.deduction or 0) + (getattr(record, 'total_incentives', 0) or 0), 2)
            data.append({
                'id': str(record.id),
                'staff_id': record.staff_id,
                'staff_name': record.staff_name,
                'month': record.month,
                'year': record.year,
                'present_days': record.present_days,
                'half_days': record.half_days,
                'holiday_days': getattr(record, 'holiday_days', 0) or 0,
                'paid_holiday_days': getattr(record, 'paid_holiday_days', 0) or 0,
                'unpaid_holiday_days': getattr(record, 'unpaid_holiday_days', 0) or 0,
                'leave_days': record.leave_days,
                'absent_days': record.absent_days,
                'total_multiplier': getattr(record, 'total_multiplier', 0) or 0,
                'per_day_salary': record.per_day_salary,
                'monthly_salary': getattr(record, 'monthly_salary', 0) or 0,
                'total_salary': record.total_salary,
                'bonus': record.bonus,
                'deduction': record.deduction,
                'total_incentives': getattr(record, 'total_incentives', 0) or 0,
                'final_salary': calculated_final_salary,
                'days_in_month': getattr(record, 'days_in_month', 0) or 0,
                'attendance_percentage': getattr(record, 'attendance_percentage', 0) or 0,
                'status': getattr(record, 'status', 'paid') or 'paid',
                'start_date': record.start_date.strftime('%Y-%m-%d') if getattr(record, 'start_date', None) else None,
                'end_date': record.end_date.strftime('%Y-%m-%d') if getattr(record, 'end_date', None) else None,
                'generated_at': record.generated_at.strftime('%Y-%m-%d %H:%M:%S') if record.generated_at else None
            })
        
        return Response({
            'success': True,
            'data': data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
def update_payroll_adjustments(request):
    """
    Update bonus and deduction for a payroll record.
    PUT /api/payroll/update-adjustments
    Body: { "payroll_id": "xxx", "bonus": 500, "deduction": 100 }
    """
    try:
        payroll_id = request.data.get('payroll_id')
        bonus = float(request.data.get('bonus', 0))
        deduction = float(request.data.get('deduction', 0))
        
        payroll = StaffPayroll.objects(id=payroll_id).first()
        if not payroll:
            return Response({
                'success': False,
                'error': 'Payroll record not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        payroll.bonus = bonus
        payroll.deduction = deduction
        payroll.final_salary = payroll.total_salary + bonus - deduction
        payroll.save()
        
        return Response({
            'success': True,
            'message': 'Payroll adjustments updated',
            'data': {
                'bonus': payroll.bonus,
                'deduction': payroll.deduction,
                'final_salary': payroll.final_salary
            }
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
def update_payroll_status(request):
    """
    Update payment status for a payroll record.
    PUT /api/payroll/update-status
    Body: { "payroll_id": "xxx", "status": "paid" }
    """
    try:
        payroll_id = request.data.get('payroll_id')
        status_val = request.data.get('status', 'paid')
        
        if status_val not in ["paid", "pending", "stopped"]:
            return Response({
                'success': False,
                'error': 'Invalid status value'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        payroll = StaffPayroll.objects(id=payroll_id).first()
        if not payroll:
            return Response({
                'success': False,
                'error': 'Payroll record not found'
            }, status=status.HTTP_404_NOT_FOUND)
            
        payroll.status = status_val
        payroll.save()
        
        return Response({
            'success': True,
            'message': 'Payroll status updated',
            'data': {
                'status': payroll.status
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_payroll_by_staff(request):
    """
    Get payroll details for a specific staff member.
    GET /api/payroll/by-staff/?staff_id=xxx&month=3&year=2026
    GET /api/payroll/by-staff/?staff_id=xxx&start_date=2026-06-01&end_date=2026-06-15
    """
    try:
        staff_id = request.GET.get('staff_id')
        month = request.GET.get('month')
        year = request.GET.get('year')
        start_date_str = request.GET.get('start_date')
        end_date_str = request.GET.get('end_date')
        
        if not staff_id:
            return Response({
                'success': False,
                'error': 'staff_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        if start_date_str and end_date_str:
            start_date = datetime.strptime(start_date_str.split('T')[0], '%Y-%m-%d')
            end_date = datetime.strptime(end_date_str.split('T')[0], '%Y-%m-%d')
            payroll = StaffPayroll.objects(
                staff_id=staff_id,
                start_date=start_date,
                end_date=end_date
            ).first()
        else:
            if not month or not year:
                return Response({
                    'success': False,
                    'error': 'month and year are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            payroll = StaffPayroll.objects(
                staff_id=staff_id,
                month=int(month),
                year=int(year),
                start_date=None,
                end_date=None
            ).first()
        
        if not payroll:
            return Response({
                'success': False,
                'error': 'Payroll record not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get staff details
        staff = Staff.objects(id=staff_id).first()
        
        # Calculate final_salary correctly: total_salary + bonus - deduction
        calculated_final_salary = round((payroll.total_salary or 0) + (payroll.bonus or 0) - (payroll.deduction or 0) + (getattr(payroll, 'total_incentives', 0) or 0), 2)
        
        return Response({
            'success': True,
            'data': {
                'staff_id': payroll.staff_id,
                'staff_name': payroll.staff_name,
                'month': payroll.month,
                'year': payroll.year,
                'start_date': payroll.start_date.strftime('%Y-%m-%d') if getattr(payroll, 'start_date', None) else None,
                'end_date': payroll.end_date.strftime('%Y-%m-%d') if getattr(payroll, 'end_date', None) else None,
                'status': getattr(payroll, 'status', 'paid') or 'paid',
                'phone': staff.phone if staff else '',
                'present_days': payroll.present_days,
                'half_days': payroll.half_days,
                'holiday_days': getattr(payroll, 'holiday_days', 0) or 0,
                'paid_holiday_days': getattr(payroll, 'paid_holiday_days', 0) or 0,
                'unpaid_holiday_days': getattr(payroll, 'unpaid_holiday_days', 0) or 0,
                'leave_days': payroll.leave_days,
                'absent_days': payroll.absent_days,
                'total_multiplier': getattr(payroll, 'total_multiplier', 0) or 0,  # Sum of all daily multipliers
                'per_day_salary': payroll.per_day_salary,
                'monthly_salary': staff.monthly_salary if staff and staff.monthly_salary else (payroll.per_day_salary * 30),
                'total_salary': payroll.total_salary,
                'bonus': payroll.bonus,
                'deduction': payroll.deduction,
                'total_incentives': getattr(payroll, 'total_incentives', 0) or 0,
                'final_salary': calculated_final_salary,
                'generated_at': payroll.generated_at.strftime('%Y-%m-%d') if payroll.generated_at else None,
                'special_days': [
                    {
                        'date': record.date.strftime('%Y-%m-%d'),
                        'multiplier': record.salary_multiplier,
                        'reason': record.salary_multiplier_reason or record.override_reason or 'No reason provided'
                    }
                    for record in StaffAttendance.objects(
                        staff_id=staff_id,
                        date__gte=datetime(int(year), int(month), 1),
                        date__lt=datetime(int(year), int(month) + 1, 1) if int(month) < 12 else datetime(int(year) + 1, 1, 1),
                        salary_multiplier__gt=1,
                        status='Present'
                    )
                ]
            }
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


import calendar

@api_view(['GET'])
def get_staff_attendance_ranking(request):
    """
    Get staff ranking based on attendance for a given month or a custom range.
    GET /api/payroll/ranking/?month=3&year=2026
    GET /api/payroll/ranking/?start_date=2026-06-01&end_date=2026-06-15
    """
    try:
        now = get_ist_now()
        start_date_str = request.GET.get('start_date', None)
        end_date_str = request.GET.get('end_date', None)
        
        if start_date_str and end_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
            if start_date > end_date:
                start_date, end_date = end_date, start_date
            
            date_list = []
            curr = start_date
            while curr <= end_date:
                date_list.append(curr)
                curr += timedelta(days=1)
                
            month = start_date.month
            year = start_date.year
        else:
            month = int(request.GET.get('month', now.month))
            year = int(request.GET.get('year', now.year))
            days_in_month = calendar.monthrange(year, month)[1]
            date_list = [datetime(year, month, d) for d in range(1, days_in_month + 1)]
        
        # Get all active staff
        staff_list = Staff.objects(is_active=True)
        
        rankings = []
        
        for staff in staff_list:
            staff_id = str(staff.id)
            
            present_days = 0
            half_days = 0
            holiday_days = 0
            leave_days = 0
            absent_days = 0
            total_worked_days = 0
            
            for current_date in date_list:
                res = resolve_attendance(staff_id, current_date)
                
                status_val = res.get("status")
                attn_type = res.get("attendance_type")
                work_type = res.get("work_type", "full_day")
                
                if status_val == "Present":
                    if attn_type == "holiday":
                        holiday_days += 1
                        total_worked_days += 1
                    elif attn_type == "leave":
                        leave_days += 1
                        total_worked_days += 1
                    elif work_type == "half_day":
                        half_days += 1
                        total_worked_days += 0.5
                    else:
                        present_days += 1
                        total_worked_days += 1
                else:
                    if current_date.date() <= now.date():
                        absent_days += 1
            
            # Calculate attendance percentage based on date_list
            passed_days_in_period = sum(1 for d in date_list if d.date() <= now.date())
            denominator = passed_days_in_period if passed_days_in_period > 0 else len(date_list)
            attendance_percentage = (total_worked_days / denominator * 100) if denominator > 0 else 0
            
            rankings.append({
                'staff_id': staff_id,
                'staff_name': staff.name,
                'present_days': present_days,
                'half_days': half_days,
                'holiday_days': holiday_days,
                'leave_days': leave_days,
                'absent_days': absent_days,
                'total_worked_days': total_worked_days,
                'total_days': denominator,
                'attendance_percentage': round(attendance_percentage, 2)
            })
        
        # Sort by attendance percentage (descending)
        rankings.sort(key=lambda x: x['attendance_percentage'], reverse=True)
        
        # Add rank
        for i, r in enumerate(rankings, 1):
            r['rank'] = i
        
        return Response({
            'success': True,
            'month': month,
            'year': year,
            'start_date': start_date_str,
            'end_date': end_date_str,
            'rankings': rankings
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Add rank
        for i, r in enumerate(rankings, 1):
            r['rank'] = i
        
        return Response({
            'success': True,
            'month': month,
            'year': year,
            'rankings': rankings
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================
# NEW ENHANCED FEATURES
# ============================================

@api_view(['GET'])
def get_all_payment_transactions(request):
    """
    Get all payment transactions from PaymentTransaction collection.
    GET /api/payment-history/ (generic, no complaint_id)
    """
    try:
        complaint_id = request.GET.get('complaint_id')
        customer_phone = request.GET.get('customer_phone')
        
        query = {}
        if complaint_id:
            query['complaint_id'] = complaint_id
        if customer_phone:
            query['customer_phone'] = customer_phone
        
        if not query:
            # If no filter, return recent transactions (last 50)
            transactions = PaymentTransaction.objects.order_by('-payment_date')[:50]
        else:
            transactions = PaymentTransaction.objects(**query).order_by('-payment_date')
        
        serializer = PaymentTransactionSerializer(transactions, many=True)
        return Response({
            "success": True,
            "count": len(transactions),
            "data": serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            "success": False,
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def create_payment_transaction(request):
    """
    Create a new payment transaction.
    POST /api/payment-transaction/
    """
    try:
        serializer = PaymentTransactionSerializer(data=request.data)
        if serializer.is_valid():
            transaction = PaymentTransaction(**serializer.validated_data)
            transaction.save()
            return Response({
                "success": True,
                "message": "Payment transaction created successfully",
                "data": PaymentTransactionSerializer(transaction).data
            }, status=status.HTTP_201_CREATED)
        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            "success": False,
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ------------------------------
# Staff Leave Balance APIs
# ------------------------------
@api_view(['GET', 'POST'])
def staff_leave_balance_list(request):
    """
    Get all staff leave balances or create new one.
    GET /api/staff-leave-balance/
    POST /api/staff-leave-balance/
    """
    if request.method == 'GET':
        try:
            year = request.GET.get('year')
            staff_id = request.GET.get('staff_id')
            
            query = {}
            if year:
                query['year'] = int(year)
            if staff_id:
                query['staff_id'] = staff_id
            
            if query:
                balances = StaffLeaveBalance.objects(**query)
            else:
                balances = StaffLeaveBalance.objects()
            
            serializer = StaffLeaveBalanceSerializer(balances, many=True)
            return Response({
                "success": True,
                "count": len(balances),
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'POST':
        try:
            serializer = StaffLeaveBalanceSerializer(data=request.data)
            if serializer.is_valid():
                balance = StaffLeaveBalance(**serializer.validated_data)
                balance.save()
                return Response({
                    "success": True,
                    "message": "Leave balance created successfully",
                    "data": StaffLeaveBalanceSerializer(balance).data
                }, status=status.HTTP_201_CREATED)
            return Response({
                "success": False,
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'DELETE'])
def staff_leave_balance_detail(request, balance_id):
    """
    Update or delete staff leave balance.
    PUT /api/staff-leave-balance/<balance_id>/
    DELETE /api/staff-leave-balance/<balance_id>/
    """
    try:
        balance = StaffLeaveBalance.objects(id=balance_id).first()
        if not balance:
            return Response({
                "success": False,
                "error": "Leave balance not found"
            }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            "success": False,
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    if request.method == 'PUT':
        try:
            for key, value in request.data.items():
                if hasattr(balance, key):
                    setattr(balance, key, value)
            balance.updated_at = get_ist_now()
            balance.save()
            return Response({
                "success": True,
                "message": "Leave balance updated successfully",
                "data": StaffLeaveBalanceSerializer(balance).data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'DELETE':
        try:
            balance.delete()
            return Response({
                "success": True,
                "message": "Leave balance deleted successfully"
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ------------------------------
# Staff Loan APIs
# ------------------------------
@api_view(['GET', 'POST'])
def staff_loan_list(request):
    """
    Get all staff loans or create new one.
    GET /api/staff-loans/
    POST /api/staff-loans/
    """
    if request.method == 'GET':
        try:
            staff_id = request.GET.get('staff_id')
            status = request.GET.get('status')
            
            query = {}
            if staff_id:
                query['staff_id'] = staff_id
            if status:
                query['status'] = status
            
            if query:
                loans = StaffLoan.objects(**query)
            else:
                loans = StaffLoan.objects()
            
            serializer = StaffLoanSerializer(loans, many=True)
            return Response({
                "success": True,
                "count": len(loans),
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'POST':
        try:
            serializer = StaffLoanSerializer(data=request.data)
            if serializer.is_valid():
                loan = StaffLoan(**serializer.validated_data)
                # Calculate remaining amount
                loan.remaining_amount = loan.loan_amount
                loan.save()
                return Response({
                    "success": True,
                    "message": "Staff loan created successfully",
                    "data": StaffLoanSerializer(loan).data
                }, status=status.HTTP_201_CREATED)
            return Response({
                "success": False,
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'DELETE'])
def staff_loan_detail(request, loan_id):
    """
    Update or delete staff loan.
    PUT /api/staff-loans/<loan_id>/
    DELETE /api/staff-loans/<loan_id>/
    """
    try:
        loan = StaffLoan.objects(id=loan_id).first()
        if not loan:
            return Response({
                "success": False,
                "error": "Staff loan not found"
            }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            "success": False,
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    if request.method == 'PUT':
        try:
            for key, value in request.data.items():
                if hasattr(loan, key):
                    setattr(loan, key, value)
            loan.save()
            return Response({
                "success": True,
                "message": "Staff loan updated successfully",
                "data": StaffLoanSerializer(loan).data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'DELETE':
        try:
            loan.delete()
            return Response({
                "success": True,
                "message": "Staff loan deleted successfully"
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ------------------------------
# API to get motor details by complaint_id for popup
# ------------------------------
@api_view(['GET'])


# ------------------------------
# YTD Payroll Summary API
# ------------------------------
@api_view(['GET'])
def get_ytd_payroll(request):
    """
    Get Year-to-Date payroll summary for staff.
    GET /api/payroll/ytd/?staff_id=xxx&year=2026
    """
    try:
        staff_id = request.GET.get('staff_id')
        year = int(request.GET.get('year', get_ist_now().year))
        
        if not staff_id:
            return Response({
                "success": False,
                "error": "staff_id is required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get all payroll records for the year
        payrolls = StaffPayroll.objects(staff_id=staff_id, year=year)
        
        total_earnings = 0
        total_bonus = 0
        total_deductions = 0
        total_present_days = 0
        
        for payroll in payrolls:
            total_earnings += payroll.total_salary or 0
            total_bonus += payroll.bonus or 0
            total_deductions += payroll.deduction or 0
            total_present_days += payroll.present_days or 0
        
        return Response({
            "success": True,
            "data": {
                "staff_id": staff_id,
                "year": year,
                "total_earnings": total_earnings,
                "total_bonus": total_bonus,
                "total_deductions": total_deductions,
                "net_earnings": total_earnings + total_bonus - total_deductions,
                "total_present_days": total_present_days,
                "months_worked": len(payrolls)
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            "success": False,
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ------------------------------
#   HOLIDAY MANAGEMENT APIS
# ------------------------------

@api_view(['GET', 'POST'])
def holiday_list(request):
    """
    List all holidays (filtered by month/year) or create a new holiday.
    GET /api/holiday-calendar/?month=3&year=2026
    POST /api/holiday-calendar/
    """
    if request.method == 'GET':
        try:
            month = request.GET.get('month')
            year = request.GET.get('year')
            
            query = {}
            if month and year:
                # Step 0: Auto-generate Sundays for the calendar view if they don't exist
                import calendar
                days_in_month = calendar.monthrange(int(year), int(month))[1]
                for d in range(1, days_in_month + 1):
                    date_obj = datetime(int(year), int(month), d)
                    if date_obj.strftime("%A") == "Sunday":
                        existing = HolidayCalendar.objects(date=date_obj, staff_id=None).first()
                        if not existing:
                            try:
                                HolidayCalendar(
                                    date=date_obj,
                                    name="Week Off",
                                    type="weekly_off",
                                    is_paid=True,
                                    is_auto=True
                                ).save()
                            except:
                                pass

                start_date = datetime(int(year), int(month), 1)
                if int(month) == 12:
                    end_date = datetime(int(year) + 1, 1, 1)
                else:
                    end_date = datetime(int(year), int(month) + 1, 1)
                query['date__gte'] = start_date
                query['date__lt'] = end_date
            
            holidays = HolidayCalendar.objects(**query).order_by('date')
            serializer = HolidayCalendarSerializer(holidays, many=True)
            return Response({
                "success": True,
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"success": False, "error": str(e)}, status=500)
            
    elif request.method == 'POST':
        try:
            # Check if multiple staff_ids are provided
            staff_ids = request.data.get('staff_ids', [])
            if not isinstance(staff_ids, list):
                # Fallback to single staff_id if staff_ids is not a list
                staff_ids = [request.data.get('staff_id')] if 'staff_id' in request.data else []
            
            # If no staff_ids provided but type is company_holiday, it's a global holiday
            if not staff_ids and request.data.get('type') == 'company_holiday':
                staff_ids = [None]
                
            if not staff_ids and request.data.get('type') == 'weekly_off':
                return Response({"success": False, "error": "At least one staff member must be selected for staff-specific off."}, status=400)
            
            results = []
            errors = []
            
            # Iterate and create holidays for each staff member
            for s_id in staff_ids:
                # Normalize staff_id (convert empty string or "null" to None)
                norm_s_id = s_id
                if s_id == "" or s_id == "null":
                    norm_s_id = None
                
                item_data = request.data.copy()
                item_data['staff_id'] = norm_s_id
                # Remove staff_ids to keep individual item data clean
                if 'staff_ids' in item_data:
                    del item_data['staff_ids']
                    
                serializer = HolidayCalendarSerializer(data=item_data)
                if serializer.is_valid():
                    try:
                        serializer.save()
                        results.append(serializer.data)
                    except Exception as db_err:
                        err_msg = str(db_err)
                        if "duplicate" in err_msg.lower() or "unique" in err_msg.lower():
                            errors.append({"staff_id": s_id, "error": f"A holiday already exists for this date for staff member {s_id}."})
                        else:
                            errors.append({"staff_id": s_id, "error": err_msg})
                else:
                    errors.append({"staff_id": s_id, "errors": serializer.errors})
            
            if errors and not results:
                # If all failed, return error response
                return Response({
                    "success": False, 
                    "error": "Failed to create holidays. All entries failed validation or already exist.",
                    "errors": errors
                }, status=400)
                
            return Response({
                "success": True,
                "message": f"Successfully created {len(results)} holiday records.",
                "data": results,
                "errors": errors if errors else None
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({"success": False, "error": str(e)}, status=400)


@api_view(['GET', 'PUT', 'DELETE'])
def holiday_detail(request, holiday_id):
    """
    Get, update or delete a specific holiday.
    """
    try:
        holiday = HolidayCalendar.objects(id=holiday_id).first()
        if not holiday:
            return Response({"success": False, "error": "Holiday not found"}, status=404)
            
        if request.method == 'GET':
            serializer = HolidayCalendarSerializer(holiday)
            return Response({"success": True, "data": serializer.data}, status=200)
            
        elif request.method == 'PUT':
            serializer = HolidayCalendarSerializer(holiday, data=request.data, partial=True)
            if serializer.is_valid():
                holiday = serializer.save()
                return Response({
                    "success": True,
                    "message": "Holiday updated successfully",
                    "data": HolidayCalendarSerializer(holiday).data
                }, status=200)
            return Response({"success": False, "errors": serializer.errors}, status=400)
            
        elif request.method == 'DELETE':
            holiday.delete()
            return Response({"success": True, "message": "Holiday deleted successfully"}, status=200)
            
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)

# ------------------------------
#   Branch Management API
# ------------------------------
@api_view(['GET'])
def get_branches(request):
    """List all active branches."""
    try:
        branches = Branch.objects(is_active=True).order_by('name')
        serializer = BranchSerializer(branches, many=True)
        return Response({
            "success": True,
            "count": len(serializer.data),
            "branches": serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from .serializers import BranchSerializer

@api_view(['POST'])
def create_branch(request):
    """Create a new branch."""
    try:
        serializer = BranchSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "Branch created successfully",
                "branch": serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
def update_branch(request, branch_id):
    """Update an existing branch."""
    try:
        branch = Branch.objects(branch_id=branch_id).first()
        if not branch:
            try:
                branch = Branch.objects(id=ObjectId(branch_id)).first()
            except Exception:
                pass
            
        if not branch:
            return Response({"success": False, "error": "Branch not found"}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = BranchSerializer(branch, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "Branch updated successfully",
                "branch": serializer.data
            }, status=status.HTTP_200_OK)
        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
def delete_branch(request, branch_id):
    """Soft delete a branch."""
    try:
        branch = Branch.objects(branch_id=branch_id).first()
        if not branch:
            try:
                branch = Branch.objects(id=ObjectId(branch_id)).first()
            except Exception:
                pass
            
        if not branch:
            return Response({"success": False, "error": "Branch not found"}, status=status.HTTP_404_NOT_FOUND)
            
        branch.is_active = False
        branch.save()
        return Response({
            "success": True,
            "message": "Branch deactivated successfully"
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==============================================================
#   Job Types APIs
# ==============================================================
@api_view(['GET', 'POST'])
def job_type_list(request):
    """
    GET  /api/job-types/  -> list all active job types
    POST /api/job-types/  -> create a new job type
    """
    if request.method == 'GET':
        try:
            job_types = JobType.objects(is_active=True).order_by('name')
            serializer = JobTypeSerializer(job_types, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'POST':
        try:
            name = request.data.get('name', '').strip()
            if not name:
                return Response({"error": "Name is required"}, status=status.HTTP_400_BAD_REQUEST)
            if JobType.objects(name=name).first():
                return Response({"error": "Job type already exists"}, status=status.HTTP_400_BAD_REQUEST)
            job_type = JobType(name=name)
            job_type.save()
            serializer = JobTypeSerializer(job_type)
            return Response({"success": True, "data": serializer.data}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
def job_type_detail(request, job_type_id):
    """
    DELETE /api/job-types/<job_type_id>/ -> soft delete a job type
    """
    try:
        try:
            job_type = JobType.objects(id=ObjectId(job_type_id)).first()
        except Exception:
            job_type = None
        if not job_type:
            return Response({"error": "Job type not found"}, status=status.HTTP_404_NOT_FOUND)
        job_type.is_active = False
        job_type.save()
        return Response({"success": True, "message": "Job type deleted"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==============================================================
#   Expired / Scrap Items APIs
# ==============================================================
@api_view(['GET'])
def expired_item_list(request):
    """
    GET /api/expired-items/  -> list all expired/scrap items
    """
    try:
        branch_name = request.GET.get('branch_name')
        query = ExpiredItem.objects
        if branch_name:
            query = query.filter(branch_name=branch_name)
            
        items = query.order_by('-buy_date')
        serializer = ExpiredItemSerializer(items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
def expired_item_detail(request, item_id):
    """
    PUT /api/expired-items/<item_id>/  -> update sold_price and sold_date
    """
    try:
        try:
            item = ExpiredItem.objects(id=ObjectId(item_id)).first()
        except Exception:
            item = None
        if not item:
            return Response({"error": "Expired item not found"}, status=status.HTTP_404_NOT_FOUND)

        sold_price = request.data.get('sold_price')
        sold_date = request.data.get('sold_date')
        name = request.data.get('name')
        buying_price = request.data.get('buying_price')

        if sold_price is not None:
            item.sold_price = float(sold_price)
        if sold_date:
            try:
                item.sold_date = datetime.fromisoformat(sold_date)
            except Exception:
                pass
        if name:
            item.name = name
        if buying_price is not None:
            item.buying_price = float(buying_price)

        item.save()
        serializer = ExpiredItemSerializer(item)
        return Response({"success": True, "data": serializer.data}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ------------------------------
#   Promotions Management APIs
# ------------------------------
@api_view(['GET'])
def promotion_list(request):
    """Retrieve all promotions."""
    try:
        from .models import Promotion
        from .serializers import PromotionSerializer
        promos = Promotion.objects().order_by('-created_at')
        serializer = PromotionSerializer(promos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def create_promotion(request):
    """Create a new promotion with optional photo upload."""
    try:
        from .models import Promotion
        from .serializers import PromotionSerializer
        from django.core.files.storage import default_storage
        
        name = request.data.get('name')
        description = request.data.get('description')
        price = request.data.get('price')
        
        if not name or not description:
            return Response({"error": "Name and description are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        photo_url = None
        if 'photo' in request.FILES:
            photo = request.FILES['photo']
            file_path = default_storage.save(f"promotions/{photo.name}", photo)
            photo_url = f"/media/{file_path}"
            
        promo = Promotion(
            name=name,
            description=description,
            price=price if price else None,
            photo_url=photo_url
        )
        promo.save()
        serializer = PromotionSerializer(promo)
        return Response({"success": True, "data": serializer.data}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
def delete_promotion(request, promo_id):
    """Delete a promotion by ID."""
    try:
        from .models import Promotion
        try:
            promo = Promotion.objects.get(id=ObjectId(promo_id))
        except Promotion.DoesNotExist:
            return Response({"error": "Promotion not found"}, status=status.HTTP_404_NOT_FOUND)
            
        promo.delete()
        return Response({"success": True, "message": "Promotion deleted successfully"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ------------------------------
#   Site Settings APIs
# ------------------------------
@api_view(['GET'])
def get_site_settings(request):
    """Return global site settings (singleton)."""
    try:
        from .models import SiteSettings
        settings_doc = SiteSettings.objects().first()
        if not settings_doc:
            # Return defaults if none saved yet
            return Response({
                "whatsapp_number": "",
                "contact_phone": "",
                "company_name": "Anbu Enterprises",
                "company_address": "No 12, Main Road, Chennai",
                "company_phone": "+91 9876543210",
                "company_landline": "044 2345 6789",
                "company_email": "contact@anbuenterprises.com",
                "bank_name": "HDFC Bank",
                "bank_branch": "Anna Nagar Branch",
                "bank_acc_no": "50100234567890",
                "bank_ifsc": "HDFC0001234",
                "company_upi": "anbu@okaxis",
                "company_gpay": "+91 9876543210"
            }, status=status.HTTP_200_OK)
        return Response({
            "whatsapp_number": settings_doc.whatsapp_number or "",
            "contact_phone": settings_doc.contact_phone or "",
            "company_name": settings_doc.company_name or "Anbu Enterprises",
            "company_address": settings_doc.company_address or "No 12, Main Road, Chennai",
            "company_phone": settings_doc.company_phone or "+91 9876543210",
            "company_landline": settings_doc.company_landline or "044 2345 6789",
            "company_email": settings_doc.company_email or "contact@anbuenterprises.com",
            "bank_name": settings_doc.bank_name or "HDFC Bank",
            "bank_branch": settings_doc.bank_branch or "Anna Nagar Branch",
            "bank_acc_no": settings_doc.bank_acc_no or "50100234567890",
            "bank_ifsc": settings_doc.bank_ifsc or "HDFC0001234",
            "company_upi": settings_doc.company_upi or "anbu@okaxis",
            "company_gpay": settings_doc.company_gpay or "+91 9876543210"
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def update_site_settings(request):
    """Create or update global site settings."""
    try:
        from .models import SiteSettings
        from user.time_utils import get_ist_now
        whatsapp_number = request.data.get("whatsapp_number", "")
        contact_phone = request.data.get("contact_phone", "")
        company_name = request.data.get("company_name", "Anbu Enterprises")
        company_address = request.data.get("company_address", "No 12, Main Road, Chennai")
        company_phone = request.data.get("company_phone", "+91 9876543210")
        company_landline = request.data.get("company_landline", "044 2345 6789")
        company_email = request.data.get("company_email", "contact@anbuenterprises.com")
        bank_name = request.data.get("bank_name", "HDFC Bank")
        bank_branch = request.data.get("bank_branch", "Anna Nagar Branch")
        bank_acc_no = request.data.get("bank_acc_no", "50100234567890")
        bank_ifsc = request.data.get("bank_ifsc", "HDFC0001234")
        company_upi = request.data.get("company_upi", "anbu@okaxis")
        company_gpay = request.data.get("company_gpay", "+91 9876543210")

        settings_doc = SiteSettings.objects().first()
        if settings_doc:
            settings_doc.whatsapp_number = whatsapp_number
            settings_doc.contact_phone = contact_phone
            settings_doc.company_name = company_name
            settings_doc.company_address = company_address
            settings_doc.company_phone = company_phone
            settings_doc.company_landline = company_landline
            settings_doc.company_email = company_email
            settings_doc.bank_name = bank_name
            settings_doc.bank_branch = bank_branch
            settings_doc.bank_acc_no = bank_acc_no
            settings_doc.bank_ifsc = bank_ifsc
            settings_doc.company_upi = company_upi
            settings_doc.company_gpay = company_gpay
            settings_doc.updated_at = get_ist_now()
            settings_doc.save()
        else:
            settings_doc = SiteSettings(
                whatsapp_number=whatsapp_number,
                contact_phone=contact_phone,
                company_name=company_name,
                company_address=company_address,
                company_phone=company_phone,
                company_landline=company_landline,
                company_email=company_email,
                bank_name=bank_name,
                bank_branch=bank_branch,
                bank_acc_no=bank_acc_no,
                bank_ifsc=bank_ifsc,
                company_upi=company_upi,
                company_gpay=company_gpay
            )
            settings_doc.save()

        return Response({"success": True, "message": "Settings saved successfully"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ------------------------------
#   Inventory Transaction APIs
# ------------------------------
@api_view(['GET'])
def get_inventory_transactions(request):
    """Retrieve all inventory and cash flow transactions, optionally filtering by branch."""
    try:
        from .models import InventoryTransaction, BookServiceComplaint, StockHistory, StaffPayroll
        from .serializers import InventoryTransactionSerializer
        from datetime import datetime
        
        branch_name = request.query_params.get('branch_name', None)
        type_filter = request.query_params.get('type', None)

        # 1. Fetch manual database transactions
        query = {}
        if branch_name and branch_name != "All":
            query['branch_name'] = branch_name
        if type_filter:
            query['type'] = type_filter

        transactions = InventoryTransaction.objects(**query).order_by('-date')
        serializer = InventoryTransactionSerializer(transactions, many=True)
        txn_list = list(serializer.data)

        # 2. Automatically load income from completed complaints (if type filter matches)
        if type_filter != 'expense':
            complaint_query = {'status': 'completed'}
            if branch_name and branch_name != "All":
                complaint_query['branch_name'] = branch_name
                
            complaints = BookServiceComplaint.objects(**complaint_query)
            
            for complaint in complaints:
                # Calculate amounts
                client_amount = float(complaint.client_amount or 0)
                grand_total = float(complaint.grand_total or complaint.total_amount or client_amount)
                product_sales = max(0.0, grand_total - client_amount)
                
                amount_received = float(complaint.amount_received or 0)
                due_amount = float(complaint.due_amount or 0)
                
                # Format completion date or creation date
                date_val = complaint.assigned_completed_at or complaint.date_created or datetime.now()
                # Ensure it's a datetime object
                if isinstance(date_val, str):
                    try:
                        date_val = datetime.fromisoformat(date_val.replace('Z', '+00:00'))
                    except:
                        date_val = datetime.now()
                date_str = date_val.strftime('%Y-%m-%d')
                
                # Service amount splitting
                if client_amount > 0:
                    rec_svc = min(amount_received, client_amount)
                    due_svc = client_amount - rec_svc
                    
                    if rec_svc > 0:
                        txn_list.append({
                            "id": f"COMP-SVC-REC-{complaint.complaint_no}",
                            "transaction_id": f"COMP-SVC-REC-{complaint.complaint_no}",
                            "branch_name": complaint.branch_name or "Branch 1",
                            "type": "income",
                            "category": "service_amount",
                            "amount": rec_svc,
                            "status": "received",
                            "description": f"Service Charge (Received) - Job {complaint.complaint_no} ({complaint.customer_name})",
                            "date": date_str
                        })
                    if due_svc > 0:
                        txn_list.append({
                            "id": f"COMP-SVC-DUE-{complaint.complaint_no}",
                            "transaction_id": f"COMP-SVC-DUE-{complaint.complaint_no}",
                            "branch_name": complaint.branch_name or "Branch 1",
                            "type": "income",
                            "category": "service_amount",
                            "amount": due_svc,
                            "status": "due",
                            "description": f"Service Charge (Due) - Job {complaint.complaint_no} ({complaint.customer_name})",
                            "date": date_str
                        })
                        
                # Product sales splitting
                if product_sales > 0:
                    rec_prd = max(0.0, amount_received - client_amount)
                    due_prd = product_sales - rec_prd
                    
                    if rec_prd > 0:
                        txn_list.append({
                            "id": f"COMP-PRD-REC-{complaint.complaint_no}",
                            "transaction_id": f"COMP-PRD-REC-{complaint.complaint_no}",
                            "branch_name": complaint.branch_name or "Branch 1",
                            "type": "income",
                            "category": "product_selling",
                            "amount": rec_prd,
                            "status": "received",
                            "description": f"Product Selling (Received) - Job {complaint.complaint_no} ({complaint.customer_name})",
                            "date": date_str
                        })
                    if due_prd > 0:
                        txn_list.append({
                            "id": f"COMP-PRD-DUE-{complaint.complaint_no}",
                            "transaction_id": f"COMP-PRD-DUE-{complaint.complaint_no}",
                            "branch_name": complaint.branch_name or "Branch 1",
                            "type": "income",
                            "category": "product_selling",
                            "amount": due_prd,
                            "status": "due",
                            "description": f"Product Selling (Due) - Job {complaint.complaint_no} ({complaint.customer_name})",
                            "date": date_str
                        })

        # 3. Automatically load dynamic expenses (if type filter matches)
        if type_filter != 'income':
            # A. Load product purchase expenses from StockHistory
            stock_query = {'total_purchase_amount__gt': 0}
            if branch_name and branch_name != "All":
                stock_query['branch_name'] = branch_name
            purchases = StockHistory.objects(**stock_query)
            for purchase in purchases:
                amount = float(purchase.total_purchase_amount or 0.0)
                if amount > 0:
                    date_val = purchase.date_of_purchase or purchase.created_at or datetime.now()
                    if isinstance(date_val, str):
                        try:
                            date_val = datetime.fromisoformat(date_val.replace('Z', '+00:00'))
                        except:
                            date_val = datetime.now()
                    date_str = date_val.strftime('%Y-%m-%d')
                    
                    txn_list.append({
                        "id": f"STOCK-PURCHASE-{purchase.id}",
                        "transaction_id": f"STOCK-PURCHASE-{purchase.id}",
                        "branch_name": purchase.branch_name or "Branch 1",
                        "type": "expense",
                        "category": "product_purchase",
                        "amount": amount,
                        "status": "paid",
                        "description": f"Product Purchase - {purchase.stock_name} ({purchase.quantity} {purchase.unit or 'pcs'})",
                        "date": date_str
                    })

            # B. Load payroll expenses from StaffPayroll
            payroll_query = {}
            if branch_name and branch_name != "All":
                payroll_query['branch_name'] = branch_name
            payrolls = StaffPayroll.objects(**payroll_query)
            for payroll in payrolls:
                status_val = getattr(payroll, 'status', 'paid') or 'paid'
                if status_val == 'stopped':
                    continue
                amount = float(payroll.final_salary or 0.0)
                if amount > 0:
                    date_val = payroll.generated_at
                    if not date_val:
                        try:
                            date_val = datetime(payroll.year, payroll.month, 28)
                        except:
                            date_val = datetime.now()
                    if isinstance(date_val, str):
                        try:
                            date_val = datetime.fromisoformat(date_val.replace('Z', '+00:00'))
                        except:
                            date_val = datetime.now()
                    date_str = date_val.strftime('%Y-%m-%d')
                    
                    try:
                        month_name = datetime(2000, payroll.month, 1).strftime('%B')
                    except:
                        month_name = f"Month {payroll.month}"
                        
                    txn_list.append({
                        "id": f"STAFF-PAYROLL-{payroll.id}",
                        "transaction_id": f"STAFF-PAYROLL-{payroll.id}",
                        "branch_name": payroll.branch_name or "Branch 1",
                        "type": "expense",
                        "category": "staff_salary",
                        "amount": amount,
                        "status": "paid" if status_val == 'paid' else "pending",
                        "description": f"Staff Payroll - {payroll.staff_name} for {month_name} {payroll.year}",
                        "date": date_str
                    })

            # C. Load staff assignment allowance/given amount from BookServiceComplaint
            assigned_query = {'assigned': True, 'amount__gt': 0}
            if branch_name and branch_name != "All":
                assigned_query['branch_name'] = branch_name
            assigned_complaints = BookServiceComplaint.objects(**assigned_query)
            for comp in assigned_complaints:
                amount = float(comp.amount or 0.0)
                date_val = comp.assigned_at or comp.date_created or datetime.now()
                if isinstance(date_val, str):
                    try:
                        date_val = datetime.fromisoformat(date_val.replace('Z', '+00:00'))
                    except:
                        date_val = datetime.now()
                date_str = date_val.strftime('%Y-%m-%d')
                
                txn_list.append({
                    "id": f"STAFF-ASSIGN-{comp.complaint_no}",
                    "transaction_id": f"STAFF-ASSIGN-{comp.complaint_no}",
                    "branch_name": comp.branch_name or "Branch 1",
                    "type": "expense",
                    "category": "petrol",
                    "amount": amount,
                    "status": "paid",
                    "description": f"Staff Assignment Allowance (Petrol) ({comp.staff_name}) - Job {comp.complaint_no}",
                    "date": date_str
                })

            # D. Load staff incentive from BookServiceComplaint
            incentive_query = {'status': 'completed', 'staff_incentive__gt': 0}
            if branch_name and branch_name != "All":
                incentive_query['branch_name'] = branch_name
            incentive_complaints = BookServiceComplaint.objects(**incentive_query)
            for comp in incentive_complaints:
                amount = float(comp.staff_incentive or 0.0)
                date_val = comp.assigned_completed_at or comp.date_created or datetime.now()
                if isinstance(date_val, str):
                    try:
                        date_val = datetime.fromisoformat(date_val.replace('Z', '+00:00'))
                    except:
                        date_val = datetime.now()
                date_str = date_val.strftime('%Y-%m-%d')
                
                txn_list.append({
                    "id": f"STAFF-INCENTIVE-{comp.complaint_no}",
                    "transaction_id": f"STAFF-INCENTIVE-{comp.complaint_no}",
                    "branch_name": comp.branch_name or "Branch 1",
                    "type": "expense",
                    "category": "staff_incentive",
                    "amount": amount,
                    "status": "paid",
                    "description": f"Staff Incentive ({comp.staff_name}) - Job {comp.complaint_no}",
                    "date": date_str
                })

        # 4. Sort list by date descending
        txn_list.sort(key=lambda x: x.get('date', '') or '', reverse=True)
        return Response(txn_list, status=status.HTTP_200_OK)
    except Exception as e:
        import traceback
        return Response({"error": str(e), "traceback": traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def create_inventory_transaction(request):
    """Create a new income or expense transaction."""
    try:
        import uuid
        from .serializers import InventoryTransactionSerializer
        
        data = request.data.copy()
        if not data.get('transaction_id'):
            data['transaction_id'] = f"TXN-{uuid.uuid4().hex[:8].upper()}"

        serializer = InventoryTransactionSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "Transaction created successfully",
                "transaction": serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
def update_inventory_transaction(request, trans_id):
    """Update an existing transaction by ID."""
    try:
        from bson import ObjectId
        from .models import InventoryTransaction
        from .serializers import InventoryTransactionSerializer
        
        transaction = InventoryTransaction.objects(transaction_id=trans_id).first()
        if not transaction:
            try:
                transaction = InventoryTransaction.objects(id=ObjectId(trans_id)).first()
            except Exception:
                pass

        if not transaction:
            return Response({"success": False, "error": "Transaction not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = InventoryTransactionSerializer(transaction, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "Transaction updated successfully",
                "transaction": serializer.data
            }, status=status.HTTP_200_OK)
        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
def delete_inventory_transaction(request, trans_id):
    """Delete a transaction by ID."""
    try:
        from bson import ObjectId
        from .models import InventoryTransaction
        
        transaction = InventoryTransaction.objects(transaction_id=trans_id).first()
        if not transaction:
            try:
                transaction = InventoryTransaction.objects(id=ObjectId(trans_id)).first()
            except Exception:
                pass

        if not transaction:
            return Response({"success": False, "error": "Transaction not found"}, status=status.HTTP_404_NOT_FOUND)

        transaction.delete()
        return Response({"success": True, "message": "Transaction deleted successfully"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


