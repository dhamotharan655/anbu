from user.time_utils import get_ist_now
from rest_framework import serializers
from datetime import datetime
import json
from django.contrib.auth.hashers import make_password
from .models import (
    User, Staff, BookServiceComplaint, ClientDetails, Products, 
    StockItem, MotorDetails, MotorVariant, HolidayCalendar,
    Branch, JobType, Service, ExpiredItem, Promotion, InventoryTransaction
)



# -------------------------------
# User Serializer
# -------------------------------
class UserSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    full_name = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    role = serializers.CharField(read_only=True)
    permissions = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=[]
    )

    def create(self, validated_data):
        # 🔐 HASH PASSWORD
        validated_data["password"] = make_password(validated_data["password"])

        # ✅ Set default role
        validated_data["role"] = "admin"

        user = User(**validated_data)
        user.save()
        return user

class LoginSerializer(serializers.Serializer):
    full_name = serializers.CharField()
    password = serializers.CharField()
# -------------------------------
# Staff Serializer
# -------------------------------
class StaffSerializer(serializers.ModelSerializer):
    # Ensure id is always serialized as string
    id = serializers.SerializerMethodField()
    
    def get_id(self, obj):
        """Always return ID as string"""
        if hasattr(obj, 'id') and obj.id:
            return str(obj.id)
        if hasattr(obj, '_id') and obj._id:
            return str(obj._id)
        return None
    
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Staff
        fields = ['id', 'name', 'phone', 'location', 'photo_url']

    def get_photo_url(self, obj):
        request = self.context.get('request')
        if obj.photo:
            return request.build_absolute_uri(obj.photo.url)
        return None


# -------------------------------
# BookServiceComplaint Serializer (Merged Model)
# -------------------------------
class BookServiceComplaintSerializer(serializers.Serializer):

    # Explicitly define id field to ensure it's always available
    id = serializers.SerializerMethodField()
    
    # Also include _id for compatibility
    _id = serializers.SerializerMethodField()
    
    def get_id(self, obj):
        """Always return ID as string, handling different MongoDB ID formats"""
        if hasattr(obj, 'id') and obj.id:
            if isinstance(obj.id, str):
                return obj.id
            # Handle ObjectId
            return str(obj.id)
        if hasattr(obj, '_id') and obj._id:
            # Handle MongoDB _id field
            if isinstance(obj._id, str):
                return obj._id
            return str(obj._id)
        # Fallback: generate from complaint_no
        return obj.complaint_no if hasattr(obj, 'complaint_no') else None
    
    def get__id(self, obj):
        """Return _id as string for MongoDB compatibility"""
        return self.get_id(obj)

    # complaint_no should be optional (auto-generate server side)
    complaint_no = serializers.CharField(max_length=50, required=False)
    customer_id = serializers.CharField(max_length=50,required=False,allow_blank=True)  # Auto-generated
    customer_name = serializers.CharField(max_length=100)
    customer_email = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    product_name = serializers.CharField(max_length=2000, required=False, allow_blank=True)
    product_quantity = serializers.IntegerField(min_value=0, default=0)  # Fixed: No hardcoded default=1
    product_discount_percent = serializers.FloatField(default=0)  # Discount percentage for product
    completed_remarks = serializers.CharField(max_length=500, required=False, allow_blank=True)
    customer_phone = serializers.CharField(source='phone', max_length=15)
    alternate_number = serializers.CharField(max_length=15, required=False, allow_blank=True, allow_null=True)
    address = serializers.CharField()

    complaint_details = serializers.CharField(source='details', required=False, allow_blank=True)

    customer_type = serializers.CharField(required=False, allow_blank=True, default="our_customer")

    assigned = serializers.BooleanField(default=False)
    assigned_staff = serializers.CharField(source='staff_name', required=False, allow_blank=True)
    staff_phone = serializers.SerializerMethodField()

    status = serializers.CharField(default="pending")
    
    # Service type: in_service (at customer location) or out_service (at service center/shop)
    service_type = serializers.CharField(required=False, allow_blank=True, default="in_service")
    
    # ⭐ NEW: Job type for motor services (legacy)
    job_type = serializers.CharField(required=False, allow_blank=True, default="")
    
    # ⭐ NEW: Job category for motor services and filtering
    job_category = serializers.CharField(required=False, allow_blank=True, default="")
    
    # ⭐ NEW: Flag to identify initial records (created from Add Customer)
    is_initial = serializers.BooleanField(default=False)
    
    # ⭐ NEW: Motor data - used to create motor details when booking is submitted
    motor_data = serializers.JSONField(required=False, allow_null=True)
    
    payment_method = serializers.CharField(allow_blank=True, required=False)
    remarks = serializers.CharField(allow_blank=True, required=False)
    client_amount = serializers.FloatField(required=False, default=0.0)
    amount = serializers.FloatField(required=False, default=0.0)

    assigned_at = serializers.DateTimeField(read_only=True)
    assigned_completed_at = serializers.DateTimeField(read_only=True)
    date_created = serializers.DateTimeField(read_only=True)

    # New fields for warranty and service
    warranty_photo = serializers.CharField(required=False, allow_blank=True)

    # Date fields — accept YYYY-MM-DD as input
    warranty_date = serializers.DateTimeField(required=False, allow_null=True)
    next_service_date = serializers.DateTimeField(required=False, allow_null=True)

    # NEW: Additional product fields for completion flow
    additional_product = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    additional_product_quantity = serializers.IntegerField(default=0)
    staff_incentive = serializers.FloatField(required=False, default=0.0)
    
    # Computed fields for totals (calculated in to_representation)
    booking_total = serializers.SerializerMethodField()
    additional_total = serializers.SerializerMethodField()
    grand_total = serializers.SerializerMethodField()
    
    # Store products as structured arrays for easier frontend processing
    booking_products = serializers.SerializerMethodField()
    additional_products = serializers.SerializerMethodField()
    
    # Payment related fields
    amount_received = serializers.FloatField(required=False, default=0.0)
    payment_due_date = serializers.DateTimeField(required=False, allow_null=True)
    payment_status = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    due_amount = serializers.FloatField(required=False, default=0.0)
    total_amount = serializers.FloatField(required=False, default=0.0)

    # WhatsApp notification tracking
    whatsapp_sent_to_customer = serializers.BooleanField(required=False, default=False)
    whatsapp_sent_to_staff = serializers.BooleanField(required=False, default=False)
    booking_whatsapp_sent = serializers.BooleanField(required=False, default=False)
    
    # Branch assignment
    branch_name = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)

    # ⭐ NEW: Computed fields for dashboard
    payment_history = serializers.SerializerMethodField()
    payment_details = serializers.SerializerMethodField() # Alias for frontend compatibility
    payment_indicator = serializers.SerializerMethodField()
    expired_items = serializers.SerializerMethodField()

    def get_expired_items(self, obj):
        items_list = []
        try:
            from .models import ExpiredItem
            if hasattr(obj, 'complaint_no') and obj.complaint_no:
                items = ExpiredItem.objects(complaint_no=obj.complaint_no)
                for ei in items:
                    items_list.append({
                        "name": getattr(ei, 'name', ''),
                        "buying_price": getattr(ei, 'buying_price', 0),
                        "buy_date": ei.buy_date.isoformat() if getattr(ei, 'buy_date', None) else None
                    })
        except Exception:
            pass
        return items_list

    def get_payment_history(self, obj):
        """Return full payment history for this complaint from PaymentDetails"""
        history = []
        try:
            from .models import PaymentDetails
            # Use str(obj.id) as complaint_id is stored as string in PaymentDetails
            records = PaymentDetails.objects(complaint_id=str(obj.id)).order_by('-payment_date')
            for r in records:
                history.append({
                    'payment_date': r.payment_date.isoformat() if r.payment_date else None,
                    'amount_paid': r.amount_paid or 0,
                    'remaining_amount': r.remaining_amount or 0,
                    'payment_method': r.payment_method,
                    'payment_mode': r.payment_method
                })
        except:
            pass
        return history

    def get_payment_details(self, obj):
        """Alias for payment_history to support frontend field naming"""
        return self.get_payment_history(obj)

    def get_payment_indicator(self, obj):
        """Calculate indicator (paid, due, overdue) consistently"""
        # Use calculate_grand_total to be 100% sure we compare against correct value
        total = obj.calculate_grand_total()
        received = obj.amount_received or 0
        
        if total > 0 and received >= total:
            return "paid"
            
        if obj.payment_due_date:
            try:
                due_date = obj.payment_due_date.date() if hasattr(obj.payment_due_date, 'date') else obj.payment_due_date
                if get_ist_now().date() > due_date:
                    return "overdue"
            except:
                pass
        
        return "due" if total > received else "paid"

    def get_staff_phone(self, obj):
        """Get staff phone number from Staff model"""
        try:
            from .models import Staff
            if obj.staff_name:
                staff = Staff.objects(name=obj.staff_name).first()
                if staff:
                    return staff.phone
        except:
            pass
        return None

    def validate_warranty_date(self, value):
        if isinstance(value, str):
            return datetime.strptime(value, "%Y-%m-%d")
        return value

    def validate_next_service_date(self, value):
        if isinstance(value, str):
            return datetime.strptime(value, "%Y-%m-%d")
        return value
    
    def _parse_product_array(self, product_field, quantity_field=None):
        """Parse product field (supports JSON array and legacy string) with price lookup from StockItem"""
        from .models import StockItem, calculate_discounted_price
        
        if not product_field:
            return []
        try:
            parsed = json.loads(product_field) if isinstance(product_field, str) else product_field
            if isinstance(parsed, list):
                result = []
                for p in parsed:
                    product_name = p.get('productName') or p.get('name') or p.get('product_name', '')
                    quantity = p.get('quantity') or p.get('qty') or 1
                    selling_price = p.get('selling_price') or p.get('sellingPrice') or p.get('price') or 0
                    buying_price = p.get('buying_price') or p.get('buyingPrice') or 0
                    discount_percent = p.get('discount_percent') or p.get('discountPercent') or p.get('discount') or 0
                    
                    # ⭐ CRITICAL: Use final_price if stored, otherwise calculate
                    final_price_from_product = p.get('final_price')
                    
                    # Get buying_price from stock if not provided in product
                    if not buying_price and product_name:
                        stock_item = StockItem.objects(name=product_name).first()
                        if stock_item:
                            buying_price = stock_item.buying_price or 0
                            if not selling_price:
                                selling_price = stock_item.selling_price or 0
                    
                    # Calculate final price with discount - use stored if available
                    if final_price_from_product is not None and final_price_from_product > 0:
                        final_price = final_price_from_product
                    else:
                        final_price = selling_price
                        if discount_percent > 0 and selling_price > 0:
                            # Calculate discount based on selling price
                            discount_amount = (selling_price * discount_percent) / 100
                            final_price = selling_price - discount_amount
                    
                    result.append({
                        'product_name': product_name,
                        'quantity': quantity,
                        'selling_price': selling_price,
                        'buying_price': buying_price,
                        'discount_percent': discount_percent,
                        'final_price': final_price,
                        # ⭐ NEW: Pass additional metadata for history
                        'serial_no': p.get('serial_no') or p.get('serialNo'),
                        'motor_brand': p.get('motor_brand') or p.get('brand_name') or p.get('brand'),
                        'motor_make': p.get('motor_make'),
                        'kw': p.get('kw'),
                        'hp': p.get('hp'),
                        'rpm': p.get('rpm')
                    })
                return result
            product_name_str = str(product_field) if product_field else ''
            qty_default = quantity_field or 1
            return [{'product_name': product_name_str, 'quantity': qty_default, 'selling_price': 0, 'buying_price': 0, 'discount_percent': 0, 'final_price': 0, 'serial_no': None}]

        except Exception as e:
            product_name = str(product_field) if product_field else ''
            quantity = quantity_field or 1
            selling_price = 0
            buying_price = 0
            
            return [{'product_name': product_name, 'quantity': quantity, 'selling_price': selling_price, 'buying_price': buying_price, 'discount_percent': 0, 'final_price': selling_price, 'serial_no': None}]

    
    def get_booking_products(self, obj):
        """Return structured booking products array"""
        return self._parse_product_array(obj.product_name, obj.product_quantity)
    
    def get_additional_products(self, obj):
        """Return structured additional products array"""
        return self._parse_product_array(obj.additional_product, obj.additional_product_quantity)
    
    def get_booking_total(self, obj):
        """Calculate booking products total with price from StockItem (uses final_price with discount)"""
        products = self.get_booking_products(obj)
        return sum(p.get('quantity', 0) * p.get('final_price', 0) for p in products)
    
    def get_additional_total(self, obj):
        """Calculate additional products total with price from StockItem (uses final_price with discount)"""
        products = self.get_additional_products(obj)
        return sum(p.get('quantity', 0) * p.get('final_price', 0) for p in products)
    
    def get_grand_total(self, obj):
        """Get grand total from model if available, otherwise calculate"""
        if obj.grand_total:
            return obj.grand_total
        return 0
    
    def to_representation(self, instance):
        """Add computed totals to response - always use model-based calculation for consistency"""
        data = super().to_representation(instance)
        
        # ⭐ CRITICAL: Use the model's centralized calculation logic
        # This ensures Dashboard, Invoices, and API always match
        grand_total_value = instance.calculate_grand_total()
        
        # Re-save to database if the stored grand_total is different or missing
        # This progressively fixes legacy data as it is accessed
        if instance.grand_total != grand_total_value:
            instance.grand_total = grand_total_value
            instance.save()
            
        data['booking_total'] = round(self.get_booking_total(instance), 2)
        data['additional_total'] = round(self.get_additional_total(instance), 2)
        data['grand_total'] = grand_total_value
        
        # Calculate motor_total separately for frontend display if needed
        motor_total = round(max(0, grand_total_value - (data['booking_total'] + data['additional_total'] + (instance.client_amount or 0))), 2)
        data['motor_total'] = motor_total
        
        # Add payment fields from model
        amount_received = instance.amount_received or 0
        data['amount_received'] = amount_received
        
        # Ensure due_amount is consistent with grand_total
        calculated_due = round(max(0, grand_total_value - amount_received), 2)
        data['due_amount'] = calculated_due
        
        # Add expired_items to the representation if not handled by SerializerMethodField magically 
        # (Though SerializerMethodField usually adds it automatically, this ensures it's always present)
        data['expired_items'] = self.get_expired_items(instance)
        
        return data

    def create(self, validated_data):
        # ------------------------------------
        # 🔥 Always map FIRST before popping
        # ------------------------------------
        if 'customer_phone' in validated_data:
            validated_data['phone'] = validated_data.pop('customer_phone')

        if 'complaint_details' in validated_data:
            validated_data['details'] = validated_data.pop('complaint_details')

        if 'assigned_staff' in validated_data:
            validated_data['staff_name'] = validated_data.pop('assigned_staff')

        # defaults
        validated_data.setdefault('status', 'pending')
        validated_data.setdefault('assigned', False)
        validated_data.setdefault('payment_method', "")
        validated_data.setdefault('remarks', "")

        # ------------------------------------
        # ✅ Ensure unique complaint number is generated
        # ------------------------------------
        if 'complaint_no' not in validated_data or not validated_data['complaint_no']:
            validated_data['complaint_no'] = BookServiceComplaint.generate_complaint_no()

        # ⭐ Extract motor_data BEFORE creating complaint (it doesn't exist on the model)
        motor_data = validated_data.pop('motor_data', None)
        
        # Debug: Print what we received
        print(f"[DEBUG] motor_data received: {motor_data}")
        
        # ⭐ Also extract separate motor_amount and discount_percent fields if sent as separate form fields
        motor_amount = validated_data.pop('motor_amount', None)
        motor_discount_percent = validated_data.pop('motor_discount_percent', None)
        minimum_price = validated_data.pop('minimum_price', None)
        
        print(f"[DEBUG] motor_amount: {motor_amount}, discount_percent: {motor_discount_percent}, minimum_price: {minimum_price}")

        # create document
        complaint = BookServiceComplaint(**validated_data)
        complaint.save()
        
        # ⭐ NEW: Save motor details AFTER complaint is created (with complaint_id and customer_name)
        # This ensures motor history has complaint_id and customer_name from the start
        if motor_data:
            try:
                from user.models import MotorDetails
                import json
                
                # Parse motor_data if it's a string
                if isinstance(motor_data, str):
                    motor_data = json.loads(motor_data)
                
                # Get created_by from the request context or use default
                created_by = "System"
                if hasattr(self, 'context') and self.context.get('request'):
                    user = self.context['request'].user
                    if hasattr(user, 'full_name'):
                        created_by = user.full_name
                    elif hasattr(user, 'username'):
                        created_by = user.username
                
                # Helper function to sanitize numeric/empty fields
                def sanitize(val, target_type=str):
                    if val is None or (isinstance(val, str) and val.strip() == ""):
                        return None
                    try:
                        return target_type(val)
                    except (ValueError, TypeError):
                        return None

                # Create motor record with complaint_id and customer_name
                motor = MotorDetails(
                    serial_no=motor_data.get('serial_no'),
                    company_name=motor_data.get('company_name'),
                    motor_make=motor_data.get('motor_make'),
                    motor_brand=motor_data.get('motor_brand'),
                    kw=motor_data.get('kw'),
                    hp=motor_data.get('hp'),
                    rpm=sanitize(motor_data.get('rpm'), int),
                    no_of_slots=sanitize(motor_data.get('no_of_slots'), int),
                    core_length=sanitize(motor_data.get('core_length'), int),
                    load_current=sanitize(motor_data.get('load_current'), float),
                    swg=motor_data.get('swg'),
                    total_set=sanitize(motor_data.get('total_set'), int),
                    total_weight=motor_data.get('total_weight'),
                    resistance_value=motor_data.get('resistance_value'),
                    winder_name=motor_data.get('winder_name'),
                    remarks=motor_data.get('remarks'),
                    winding_details=motor_data.get('winding_details', []),
                    # ⭐ Set complaint_id and customer_name from complaint
                    complaint_id=complaint.complaint_no,
                    customer_name=complaint.customer_name,
                    customer_phone=complaint.phone,
                    # ⭐ NEW: Set job_type and job_category from complaint
                    job_type=getattr(complaint, 'job_category', None) or getattr(complaint, 'job_type', None) or "motor_service",
                    job_category=getattr(complaint, 'job_category', None) or getattr(complaint, 'job_type', None) or "motor_service",
                    created_by=created_by
                )
                
                # Sanitize connection to match choices if provided
                conn = motor_data.get('connection')
                if conn in ['Star', 'Delta', 'Star-Delta']:
                    motor.connection = conn
                else:
                    # Map common variations or set to None
                    mapping = {'star': 'Star', 'delta': 'Delta', 'star-delta': 'Star-Delta', 'Stardelta': 'Star-Delta'}
                    motor.connection = mapping.get(conn) if conn else None

                # Date sanitization
                if motor_data.get('opening_date'):
                    try:
                        motor.opening_date = datetime.fromisoformat(motor_data.get('opening_date').replace('Z', '+00:00'))
                    except: pass
                if motor_data.get('closing_date'):
                    try:
                        motor.closing_date = datetime.fromisoformat(motor_data.get('closing_date').replace('Z', '+00:00'))
                    except: pass

                # ⭐ NEW: Save motor_amount, discount_percent, minimum_price for motor_sales
                # Check both motor_data JSON and separate form fields
                if motor_data.get('motor_amount'):
                    motor.motor_amount = sanitize(motor_data.get('motor_amount'), float)
                elif motor_amount:
                    motor.motor_amount = sanitize(motor_amount, float)
                    
                if motor_data.get('discount_percent'):
                    motor.discount_percent = sanitize(motor_data.get('discount_percent'), float)
                elif motor_discount_percent:
                    motor.discount_percent = sanitize(motor_discount_percent, float)
                    
                if motor_data.get('minimum_price'):
                    motor.minimum_price = sanitize(motor_data.get('minimum_price'), float)
                elif minimum_price:
                    motor.minimum_price = sanitize(minimum_price, float)
                motor.save()
                print(f"✅ Created motor record {motor.serial_no} with complaint_id {complaint.complaint_no}")
            except Exception as e:
                print(f"⚠️ Error saving motor record: {str(e)}")
                import traceback
                traceback.print_exc()
        else:
            print("[DEBUG] No motor_data in request - skipping motor service record creation")
            
        # ⭐ NEW: Automatically record motor sales in history
        self._create_motor_history_records(complaint)
        
        # ⭐ OLD: Link motor record with complaint after booking is submitted (kept for backward compatibility)
        # Check if this is a motor job (product_name contains motor details)
        product_name = validated_data.get('product_name', '')
        if product_name and 'Motor:' in str(product_name):
            try:
                # Extract serial number from product_name (format: "Motor: Company - Make (S/N: SerialNo)")
                import re
                serial_match = re.search(r'S/N:\s*([^)]+)', str(product_name))
                if serial_match:
                    serial_no = serial_match.group(1).strip()
                    # Find the motor record by serial number that doesn't have complaint_id yet
                    from user.models import MotorDetails
                    motor = MotorDetails.objects(serial_no=serial_no, complaint_id__exists=False).first()
                    if motor:
                        # Update motor record with complaint_id and customer_name
                        motor.complaint_id = complaint.complaint_no
                        motor.customer_name = complaint.customer_name
                        motor.save()
                        print(f"✅ Linked motor record {serial_no} to complaint {complaint.complaint_no}")
            except Exception as e:
                print(f"⚠️ Error linking motor record: {str(e)}")
        
        # ------------------------------------
        # ✅ Calculate and save grand_total for NEW complaints
        # ------------------------------------
        try:
            # Calculate grand_total using the same logic as in to_representation
            booking_total = self.get_booking_total(complaint)
            additional_total = self.get_additional_total(complaint)
            client_amount = complaint.client_amount or 0
            motor_total = 0
            
            # Add motor_total for motor_sale jobs
            if hasattr(complaint, 'job_type') and complaint.job_type == 'motor_sale':
                from .models import MotorDetails
                motor = MotorDetails.objects(complaint_id=complaint.complaint_no).first()
                if not motor and complaint.complaint_no:
                    if complaint.complaint_no.startswith('#'):
                        motor = MotorDetails.objects(complaint_id=complaint.complaint_no.lstrip('#')).first()
                    else:
                        motor = MotorDetails.objects(complaint_id=f'#{complaint.complaint_no}').first()
                
                if motor and motor.motor_amount:
                    motor_price = float(motor.motor_amount or 0)
                    motor_discount = float(getattr(motor, 'discount_percent', 0) or 0)
                    if motor_discount > 0:
                        motor_price = motor_price - (motor_price * motor_discount / 100)
                    motor_total = motor_price
            
            grand_total_value = round(booking_total + additional_total + client_amount + motor_total, 2)
            complaint.grand_total = grand_total_value
            complaint.save()
            print(f"✅ Calculated and saved grand_total: {grand_total_value} for complaint {complaint.complaint_no}")
        except Exception as e:
            print(f"⚠️ Error calculating grand_total: {str(e)}")
        
        return complaint

    def _create_motor_history_records(self, complaint):
        """Scan product fields for motor items and record in Motor History"""
        try:
            from .models import MotorDetails
            
            # Combine all products from main and additional list
            all_products = self.get_booking_products(complaint)
            all_products.extend(self.get_additional_products(complaint))
            
            # Identify current user for created_by
            created_by = "System"
            if hasattr(self, 'context') and self.context.get('request'):
                user = self.context['request'].user
                created_by = getattr(user, 'full_name', getattr(user, 'username', "System"))

            def sanitize(val, target_type=str):
                if val in [None, ""] or (isinstance(val, str) and val.strip() == ""):
                    return None
                try: return target_type(val)
                except: return None

            for prod in all_products:
                name = (prod.get('product_name') or "").lower()
                serial_no = prod.get('serial_no')
                
                # Check for "motor" AND existence of serial number
                if 'motor' in name and serial_no:
                    # Avoid duplicated entries if already linked via legacy path or motor_data
                    existing = MotorDetails.objects(serial_no=serial_no, complaint_id=complaint.complaint_no).first()
                    if existing:
                        continue
                    
                    # Create new historical record for the sale
                    motor = MotorDetails(
                        complaint_id=complaint.complaint_no,
                        customer_name=complaint.customer_name,
                        customer_phone=complaint.phone,
                        job_type="motor_sale",
                        job_category="motor_sale",
                        company_name=prod.get('motor_brand') or prod.get('product_name'),
                        motor_brand=prod.get('motor_brand'),
                        motor_make=prod.get('motor_make'),
                        serial_no=serial_no,
                        kw=prod.get('kw'),
                        hp=prod.get('hp'),
                        rpm=sanitize(prod.get('rpm'), int),
                        motor_amount=sanitize(prod.get('final_price'), float),
                        discount_percent=sanitize(prod.get('discount_percent'), float),
                        created_by=created_by
                    )
                    motor.save()
                    print(f"✅ Automatically recorded Motor Sale {serial_no} in History")
        except Exception as e:
            print(f"⚠️ Error recording motor sale in history: {str(e)}")

    # ==== 3. keep your update() below ====
    def update(self, instance, validated_data):
        instance.phone = validated_data.get('customer_phone', instance.phone)
        instance.details = validated_data.get('complaint_details', instance.details)
        instance.staff_name = validated_data.get('assigned_staff', instance.staff_name)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # ------------------------------------
        # ✅ Calculate and save grand_total after UPDATE
        # ------------------------------------
        try:
            # Calculate grand_total using the same logic as in to_representation
            booking_total = self.get_booking_total(instance)
            additional_total = self.get_additional_total(instance)
            client_amount = instance.client_amount or 0
            motor_total = 0
            
            # Add motor_total for motor_sale jobs
            if hasattr(instance, 'job_type') and instance.job_type == 'motor_sale':
                from .models import MotorDetails
                motor = MotorDetails.objects(complaint_id=instance.complaint_no).first()
                if not motor and instance.complaint_no:
                    if instance.complaint_no.startswith('#'):
                        motor = MotorDetails.objects(complaint_id=instance.complaint_no.lstrip('#')).first()
                    else:
                        motor = MotorDetails.objects(complaint_id=f'#{instance.complaint_no}').first()
                
                if motor and motor.motor_amount:
                    motor_price = float(motor.motor_amount or 0)
                    motor_discount = float(getattr(motor, 'discount_percent', 0) or 0)
                    if motor_discount > 0:
                        motor_price = motor_price - (motor_price * motor_discount / 100)
                    motor_total = motor_price
            
            grand_total_value = round(booking_total + additional_total + client_amount + motor_total, 2)
            instance.grand_total = grand_total_value
            instance.save()
            print(f"✅ Updated grand_total: {grand_total_value} for complaint {instance.complaint_no}")
        except Exception as e:
            print(f"⚠️ Error calculating grand_total on update: {str(e)}")
        
        return instance


# -------------------------------
# ClientDetails Serializer
# -------------------------------
class ClientDetailsSerializer(serializers.Serializer):
    # Ensure id is always serialized as string
    id = serializers.SerializerMethodField()
    
    def get_id(self, obj):
        """Always return ID as string"""
        if hasattr(obj, 'id') and obj.id:
            return str(obj.id)
        if hasattr(obj, '_id') and obj._id:
            return str(obj._id)
        return None
    customer_id = serializers.CharField(read_only=True)  # Auto-generated
    customer_name = serializers.CharField(max_length=100)
    customer_email = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(max_length=15)
    alternate_number = serializers.CharField(max_length=15, required=False, allow_blank=True)
    address = serializers.CharField()
    status = serializers.CharField(default="online")
    customer_type = serializers.ChoiceField(choices=['our_customer', 'external_customer'])

    def create(self, validated_data):
        client = ClientDetails(**validated_data)
        client.save()
        return client

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

# -------------------------------
# Products Serializer
# -------------------------------
class ProductsSerializer(serializers.Serializer):
    # Ensure id is always serialized as string
    id = serializers.SerializerMethodField()
    
    def get_id(self, obj):
        """Always return ID as string"""
        if hasattr(obj, 'id') and obj.id:
            return str(obj.id)
        if hasattr(obj, '_id') and obj._id:
            return str(obj._id)
        return None
    product_name = serializers.CharField(max_length=100)
    description = serializers.CharField(required=False, allow_blank=True)

    def create(self, validated_data):
        product = Products(**validated_data)
        product.save()
        return product

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


# -------------------------------
# StockItem Serializer
# -------------------------------
# -------------------------------
# Motor Variant Serializer
# -------------------------------
class MotorVariantSerializer(serializers.Serializer):
    """Full serializer for MotorVariant details."""
    id = serializers.CharField(read_only=True)
    brand = serializers.CharField()
    count = serializers.IntegerField()
    supplier = serializers.CharField(required=False, allow_null=True)
    purchase_date = serializers.DateTimeField(required=False, allow_null=True)
    purchase_price = serializers.FloatField(required=False, allow_null=True)
    selling_price = serializers.FloatField(required=False, allow_null=True)
    minimum_price = serializers.FloatField(required=False, allow_null=True)
    
    # Technical fields (Synchronized with MotorDetails)
    company_name = serializers.CharField(required=False, allow_null=True)
    motor_make = serializers.CharField(required=False, allow_null=True)
    serial_no = serializers.CharField(required=False, allow_null=True)
    kw = serializers.CharField(required=False, allow_null=True)
    hp = serializers.FloatField(required=False, allow_null=True)
    rpm = serializers.IntegerField(required=False, allow_null=True)
    phase = serializers.CharField(required=False, allow_null=True)
    voltage = serializers.CharField(required=False, allow_null=True)
    motor_type = serializers.CharField(required=False, allow_null=True)
    warranty = serializers.CharField(required=False, allow_null=True)
    
    no_of_slots = serializers.IntegerField(required=False, allow_null=True)
    core_length = serializers.CharField(required=False, allow_null=True)
    load_current = serializers.CharField(required=False, allow_null=True)
    swg = serializers.CharField(required=False, allow_null=True)
    connection = serializers.CharField(required=False, allow_null=True)
    total_set = serializers.CharField(required=False, allow_null=True)
    total_weight = serializers.CharField(required=False, allow_null=True)
    resistance_value = serializers.CharField(required=False, allow_null=True)
    winder_name = serializers.CharField(required=False, allow_null=True)
    opening_date = serializers.DateTimeField(required=False, allow_null=True)
    closing_date = serializers.DateTimeField(required=False, allow_null=True)
    remarks = serializers.CharField(required=False, allow_null=True)
    winding_details = serializers.ListField(child=serializers.DictField(), required=False, allow_null=True)

    created_at = serializers.DateTimeField(read_only=True)

class StockItemSerializer(serializers.Serializer):
    # Ensure id is always serialized as string
    id = serializers.SerializerMethodField()
    
    def get_id(self, obj):
        """Always return ID as string"""
        if hasattr(obj, 'id') and obj.id:
            return str(obj.id)
        if hasattr(obj, '_id') and obj._id:
            return str(obj._id)
        return None
    stock_id = serializers.CharField(read_only=True)
    name = serializers.CharField(max_length=100)
    category = serializers.CharField(max_length=50, required=False, allow_blank=True)
    quantity = serializers.IntegerField(min_value=0)
    unit = serializers.CharField(max_length=20, default="pcs")
    minimum_threshold = serializers.IntegerField(min_value=0)
    selling_price = serializers.FloatField(required=False, allow_null=True)
    minimum_price = serializers.FloatField(required=False, allow_null=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    status = serializers.SerializerMethodField()
    # Supplier and price fields - Mandatory for non-motors, optional for motors
    supplier = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    purchase_price_per_unit = serializers.FloatField(required=False, allow_null=True)
    total_purchase_amount = serializers.FloatField(required=False, allow_null=True)
    date_of_purchase = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    # ⭐ NEW: Motor-specific fields
    is_motor = serializers.BooleanField(required=False, default=False)
    motor_brand = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    motor_model = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    motor_specs = serializers.DictField(required=False, allow_null=True)
    # ⭐ NEW: Motor brands with counts (for multi-brand support)
    motor_brands = serializers.ListField(required=False, allow_null=True)
    buying_price = serializers.FloatField(required=False, allow_null=True)

    def get_status(self, obj):
        """Get stock status based on current quantity and threshold."""
        return obj.get_status()

    def validate(self, data):
        """Conditional validation for purchase fields based on product name."""
        name = data.get('name', '').lower()
        is_motor = 'motor' in name or data.get('is_motor', False)

        if not is_motor:
            # For non-motor products, purchase fields are strictly required
            errors = {}
            if not data.get('supplier'):
                errors['supplier'] = "Supplier is required for non-motor products."
            if data.get('purchase_price_per_unit') is None:
                errors['purchase_price_per_unit'] = "Purchase price is required for non-motor products."
            if data.get('total_purchase_amount') is None:
                errors['total_purchase_amount'] = "Total purchase amount is required for non-motor products."
            if not data.get('date_of_purchase'):
                errors['date_of_purchase'] = "Date of purchase is required for non-motor products."
            
            if errors:
                raise serializers.ValidationError(errors)
        
        return data

    def create(self, validated_data):
        # ⭐ Extract all special fields first to ensure they are defined in scope
        supplier = validated_data.pop('supplier', None)
        purchase_price_per_unit = validated_data.pop('purchase_price_per_unit', None)
        total_purchase_amount = validated_data.pop('total_purchase_amount', None)
        date_of_purchase_str = validated_data.pop('date_of_purchase', None)
        
        is_motor_flag = validated_data.pop('is_motor', False)
        motor_brands = validated_data.pop('motor_brands', None)
        motor_brand = validated_data.pop('motor_brand', None)
        motor_model = validated_data.pop('motor_model', None)
        motor_specs = validated_data.pop('motor_specs', None)
        
        # Determine if this is a motor item
        name_lower = validated_data.get('name', '').lower()
        is_motor = is_motor_flag or 'motor' in name_lower
        
        # If it's a motor and parent fields are missing, set defaults or summary values
        if is_motor:
            if not supplier and motor_brands:
                # Use first brand's supplier as summary if available
                first_brand = motor_brands[0]
                supplier = first_brand.get('supplier') or "Multiple Suppliers"
            
            if purchase_price_per_unit is None and motor_brands:
                # Use max purchase price as summary
                prices = [float(b.get('purchase_price_per_unit') or b.get('purchase_price') or 0) for b in motor_brands]
                purchase_price_per_unit = max(prices) if prices else 0
            
            if total_purchase_amount is None and motor_brands:
                total_purchase_amount = sum([float(b.get('total_purchase_amount') or 0) for b in motor_brands])
            
            if not date_of_purchase_str:
                from datetime import datetime
                date_of_purchase_str = get_ist_now().strftime('%Y-%m-%d')

        stock_item = StockItem(**validated_data)
        
        # ⭐ NEW: Set motor fields if this is a motor item
        if is_motor:
            stock_item.is_motor = True
            stock_item.motor_brand = motor_brand
            stock_item.motor_model = motor_model
            stock_item.motor_specs = motor_specs
            stock_item.motor_brands = motor_brands
            
            # Store summary purchase info as private attributes for history recording
            stock_item._supplier = supplier
            stock_item._purchase_price_per_unit = purchase_price_per_unit
            stock_item._total_purchase_amount = total_purchase_amount
            stock_item._date_of_purchase = date_of_purchase_str
        
        stock_item.save()
        
        # ⭐ SYNC MOTOR VARIANTS (New robust logic)
        self._sync_motor_variants(stock_item, motor_brands, supplier)
        
        # Return the saved item with the extracted data for history recording
        stock_item._supplier = supplier
        stock_item._purchase_price_per_unit = purchase_price_per_unit
        stock_item._total_purchase_amount = total_purchase_amount
        stock_item._date_of_purchase = date_of_purchase_str
        
        return stock_item

    def update(self, instance, validated_data):
        # Determine if this is a motor item
        name_lower = validated_data.get('name', instance.name).lower()
        is_motor = validated_data.get('is_motor', instance.is_motor) or 'motor' in name_lower
        
        # Extract motor_brands before popping
        motor_brands = validated_data.pop('motor_brands', None)
        
        # Get potential supplier from validated_data or instance
        supplier = validated_data.get('supplier') or getattr(instance, 'supplier', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if is_motor and motor_brands:
            instance.motor_brands = motor_brands
            instance.is_motor = True

        instance.save()
        
        # ⭐ SYNC MOTOR VARIANTS ON UPDATE
        if is_motor and (motor_brands or instance.motor_brands):
            self._sync_motor_variants(instance, motor_brands or instance.motor_brands, supplier)

        return instance

    def _sync_motor_variants(self, stock_item, motor_brands, default_supplier=None):
        """Helper to synchronize MotorVariant documents with StockItem brand list."""
        if not motor_brands:
            return

        try:
            # 1. Clear existing variants for this product to ensure synchronization
            from .models import MotorVariant
            MotorVariant.objects(product=stock_item).delete()
            
            # 2. Re-create variants from the current brand list
            for mb in motor_brands:
                try:
                    # --- Technical Specification Fields ---
                    spec = mb.get('specification') or {}
                    motor_make = spec.get('motor_make') or mb.get('motor_make')
                    serial_no = spec.get('serial_no') or mb.get('serial_no')
                    kw = spec.get('kw') or mb.get('kw')
                    hp = spec.get('hp') or spec.get('horsepower') or mb.get('hp') or mb.get('horsepower')
                    rpm = spec.get('rpm') or mb.get('rpm')
                    phase = spec.get('phase') or mb.get('phase')
                    voltage = spec.get('voltage') or mb.get('voltage')
                    motor_type = spec.get('motor_type') or mb.get('motor_type')
                    warranty = spec.get('warranty') or mb.get('warranty')
                    
                    no_of_slots = spec.get('no_of_slots') or mb.get('no_of_slots')
                    core_length = spec.get('core_length') or mb.get('core_length')
                    load_current = spec.get('load_current') or mb.get('load_current')
                    swg = spec.get('swg') or mb.get('swg')
                    connection = spec.get('connection') or mb.get('connection')
                    total_set = spec.get('total_set') or mb.get('total_set')
                    total_weight = spec.get('total_weight') or mb.get('total_weight')
                    resistance_value = spec.get('resistance_value') or mb.get('resistance_value')
                    winder_name = spec.get('winder_name') or mb.get('winder_name')
                    remarks = spec.get('remarks') or mb.get('remarks')
                    winding_details = spec.get('winding_details') or mb.get('winding_details')

                    # Formatting dates
                    def parse_dt(dt_str):
                        if not dt_str: return None
                        try:
                            return datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
                        except:
                            try:
                                return datetime.strptime(dt_str, '%Y-%m-%d')
                            except:
                                return None

                    opening_date = parse_dt(spec.get('opening_date') or mb.get('opening_date'))
                    closing_date = parse_dt(spec.get('closing_date') or mb.get('closing_date'))

                    # --- Pricing Fields ---
                    pricing = mb.get('pricing') or mb
                    p_price = pricing.get('purchase_price') or mb.get('purchase_price')
                    if pricing.get('purchase_price_per_unit'):
                        p_price = pricing.get('purchase_price_per_unit')
                    
                    if p_price == '' or p_price is None: p_price = None
                    s_price = pricing.get('selling_price') or mb.get('selling_price')
                    if s_price == '': s_price = None
                    min_price = pricing.get('minimum_price') or mb.get('minimum_price')
                    if min_price == '': min_price = None
                    
                    supp = pricing.get('supplier') or mb.get('supplier') or default_supplier

                    try:
                        date_str = pricing.get('date_of_purchase') or pricing.get('purchase_date') or mb.get('purchase_date')
                        p_date = datetime.strptime(date_str, '%Y-%m-%d') if date_str else get_ist_now()
                    except:
                        p_date = get_ist_now()

                    mv = MotorVariant(
                        product=stock_item,
                        brand=mb.get('brand_name') or mb.get('brand') or 'Unknown',
                        count=int(mb.get('quantity') or mb.get('count') or 0),
                        supplier=supp,
                        purchase_date=p_date,
                        purchase_price=float(p_price) if p_price else None,
                        selling_price=float(s_price) if s_price else None,
                        minimum_price=float(min_price) if min_price else None,
                        
                        # Technical fields
                        motor_make=str(motor_make) if motor_make else None,
                        serial_no=str(serial_no) if serial_no else None,
                        kw=str(kw) if kw else None,
                        hp=float(hp) if hp else None,
                        rpm=int(rpm) if rpm else None,
                        phase=str(phase) if phase else None,
                        voltage=str(voltage) if voltage else None,
                        motor_type=str(motor_type) if motor_type else None,
                        warranty=str(warranty) if warranty else None,
                        
                        no_of_slots=int(no_of_slots) if no_of_slots else None,
                        core_length=str(core_length) if core_length else None,
                        load_current=str(load_current) if load_current else None,
                        swg=str(swg) if swg else None,
                        connection=str(connection) if connection else None,
                        total_set=str(total_set) if total_set else None,
                        total_weight=str(total_weight) if total_weight else None,
                        resistance_value=str(resistance_value) if resistance_value else None,
                        winder_name=str(winder_name) if winder_name else None,
                        opening_date=opening_date,
                        closing_date=closing_date,
                        remarks=str(remarks) if remarks else None,
                        winding_details=winding_details
                    )
                    mv.save()
                except Exception as e:
                    print(f"Error saving MotorVariant {mb}: {e}")
        except Exception as ex:
            print(f"CRITICAL: Failed to sync MotorVariants: {ex}")


class StockAddSerializer(serializers.Serializer):
    """Serializer for adding stock quantity."""
    quantity = serializers.IntegerField(min_value=1, required=True)
    # Supplier and price fields - NOW MANDATORY
    supplier = serializers.CharField(required=True)
    purchase_price_per_unit = serializers.FloatField(required=True)
    total_purchase_amount = serializers.FloatField(required=True)
    date_of_purchase = serializers.CharField(required=True)
    minimum_price = serializers.FloatField(required=False, allow_null=True)
    minimum_threshold = serializers.IntegerField(required=False, allow_null=True)
    message = serializers.CharField(read_only=True)

    def validate_purchase_price_per_unit(self, value):
        """Handle empty string or None values for float field."""
        if value is None or value == '':
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None

    def validate_total_purchase_amount(self, value):
        """Handle empty string or None values for float field."""
        if value is None or value == '':
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None


class StockReduceSerializer(serializers.Serializer):
    """Serializer for reducing stock quantity."""
    quantity = serializers.IntegerField(min_value=1, required=True)
    message = serializers.CharField(read_only=True)


class StockAlertSerializer(serializers.Serializer):
    """Serializer for stock alerts."""
    stock_id = serializers.CharField()
    name = serializers.CharField()
    quantity = serializers.IntegerField()
    minimum_threshold = serializers.IntegerField()
    status = serializers.CharField()
    unit = serializers.CharField()


# -------------------------------
# Motor Brand Serializer
# -------------------------------
class MotorBrandSerializer(serializers.Serializer):
    """Serializer for motor brand data."""
    brand_name = serializers.CharField(max_length=100, required=True)
    quantity = serializers.IntegerField(min_value=1, required=True)
    specification_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    purchase_price = serializers.FloatField(required=False, allow_null=True)
    selling_price = serializers.FloatField(required=False, allow_null=True)
    minimum_price = serializers.FloatField(required=False, allow_null=True)
    created_at = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class AddMotorBrandSerializer(serializers.Serializer):
    """Serializer for adding a motor brand."""
    brand_name = serializers.CharField(max_length=100, required=True)
    quantity = serializers.IntegerField(min_value=1, required=True)
    specification_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    purchase_price = serializers.FloatField(required=False, allow_null=True)
    selling_price = serializers.FloatField(required=False, allow_null=True)
    minimum_price = serializers.FloatField(required=False, allow_null=True)


class UpdateMotorBrandSerializer(serializers.Serializer):
    """Serializer for updating a motor brand."""
    quantity = serializers.IntegerField(min_value=1, required=False)
    specification_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    purchase_price = serializers.FloatField(required=False, allow_null=True)
    selling_price = serializers.FloatField(required=False, allow_null=True)
    minimum_price = serializers.FloatField(required=False, allow_null=True)

# -------------------------------
# Motor Details Serializer
# -------------------------------
class MotorDetailsSerializer(serializers.Serializer):
    """Serializer for Three Phase Motor Details."""
    id = serializers.CharField(read_only=True)
    
    # ⭐ NEW: Complaint linkage
    complaint_id = serializers.CharField(required=False, allow_blank=True)
    customer_name = serializers.CharField(required=False, allow_blank=True)
    customer_phone = serializers.CharField(required=False, allow_blank=True)
    
    # ⭐ NEW: Job Type
    job_type = serializers.CharField(required=False, allow_blank=True)
    job_category = serializers.CharField(required=False, allow_blank=True)
    
    # Motor Information
    company_name = serializers.CharField(required=True)
    motor_make = serializers.CharField(required=False, allow_blank=True)
    motor_brand = serializers.CharField(required=False, allow_blank=True)
    serial_no = serializers.CharField(required=True)
    kw = serializers.CharField(required=False, allow_blank=True)
    hp = serializers.CharField(required=False, allow_blank=True)
    rpm = serializers.IntegerField(required=False, allow_null=True)
    no_of_slots = serializers.IntegerField(required=False, allow_null=True)
    core_length = serializers.IntegerField(required=False, allow_null=True)
    load_current = serializers.FloatField(required=False, allow_null=True)
    swg = serializers.CharField(required=False, allow_blank=True)
    connection = serializers.CharField(required=False, allow_blank=True)
    total_set = serializers.IntegerField(required=False, allow_null=True)
    total_weight = serializers.CharField(required=False, allow_blank=True)
    resistance_value = serializers.CharField(required=False, allow_blank=True)
    winder_name = serializers.CharField(required=False, allow_blank=True)
    opening_date = serializers.DateTimeField(required=False, allow_null=True)
    closing_date = serializers.DateTimeField(required=False, allow_null=True)
    
    # ⭐ NEW: Motor Amount
    motor_amount = serializers.FloatField(required=False, allow_null=True)
    
    # ⭐ NEW: Discount Percent for Motor Sales
    discount_percent = serializers.FloatField(required=False, allow_null=True)
    
    # ⭐ NEW: Minimum Price for Motor Sales
    minimum_price = serializers.FloatField(required=False, allow_null=True)
    
    # Winding Details
    winding_details = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=[]
    )
    
    # Remarks
    remarks = serializers.CharField(required=False, allow_blank=True)
    
    # Metadata
    created_by = serializers.CharField(required=False, allow_blank=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    
    def create(self, validated_data):
        motor = MotorDetails(**validated_data)
        motor.save()
        return motor
    
    def update(self, instance, validated_data):
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        return instance


# -------------------------------
# Payment Transaction Serializer
# -------------------------------
class PaymentTransactionSerializer(serializers.Serializer):
    """Serializer for Payment Transaction model."""
    id = serializers.CharField(read_only=True)
    complaint_id = serializers.CharField(required=True)
    complaint_no = serializers.CharField(required=False, allow_blank=True)
    customer_name = serializers.CharField(required=False, allow_blank=True)
    customer_phone = serializers.CharField(required=False, allow_blank=True)
    
    amount = serializers.FloatField(required=True)
    remaining_amount = serializers.FloatField(required=False, default=0)
    total_bill_amount = serializers.FloatField(required=False, allow_null=True)
    
    payment_mode = serializers.CharField(required=False, default='cash')
    payment_status = serializers.CharField(required=False, default='partial')
    
    payment_date = serializers.DateTimeField(read_only=True)
    due_date = serializers.DateTimeField(required=False, allow_null=True)
    
    notes = serializers.CharField(required=False, allow_blank=True)
    created_by = serializers.CharField(required=False, allow_blank=True)
    created_at = serializers.DateTimeField(read_only=True)


# -------------------------------
# Staff Leave Balance Serializer
# -------------------------------
class StaffLeaveBalanceSerializer(serializers.Serializer):
    """Serializer for Staff Leave Balance model."""
    id = serializers.CharField(read_only=True)
    staff_id = serializers.CharField(required=True)
    staff_name = serializers.CharField(required=True)
    year = serializers.IntegerField(required=True)
    
    total_leave_days = serializers.IntegerField(required=False, default=12)
    leave_taken = serializers.IntegerField(required=False, default=0)
    leave_remaining = serializers.IntegerField(required=False, default=12)
    
    sick_leave_total = serializers.IntegerField(required=False, default=7)
    sick_leave_taken = serializers.IntegerField(required=False, default=0)
    sick_leave_remaining = serializers.IntegerField(required=False, default=7)
    
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


# -------------------------------
# Staff Loan Serializer
# -------------------------------
class StaffLoanSerializer(serializers.Serializer):
    """Serializer for Staff Loan model."""
    id = serializers.CharField(read_only=True)
    staff_id = serializers.CharField(required=True)
    staff_name = serializers.CharField(required=True)
    
    loan_amount = serializers.FloatField(required=True)
    emi_amount = serializers.FloatField(required=False, allow_null=True)
    total_emi_count = serializers.IntegerField(required=False, default=1)
    emi_paid_count = serializers.IntegerField(required=False, default=0)
    remaining_amount = serializers.FloatField(required=False, allow_null=True)
    
    status = serializers.CharField(required=False, default='active')
    
    start_date = serializers.DateTimeField(read_only=True)
    end_date = serializers.DateTimeField(required=False, allow_null=True)
    
    notes = serializers.CharField(required=False, allow_blank=True)
    created_at = serializers.DateTimeField(read_only=True)
# -------------------------------
# Holiday Calendar Serializer
# -------------------------------
class HolidayCalendarSerializer(serializers.Serializer):
    id = serializers.SerializerMethodField()
    date = serializers.DateTimeField()
    name = serializers.CharField()
    type = serializers.CharField()
    staff_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    is_paid = serializers.BooleanField(default=True)
    is_auto = serializers.BooleanField(default=False)
    is_active = serializers.BooleanField(default=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def get_id(self, obj):
        return str(obj.id) if hasattr(obj, 'id') else None

    def validate_staff_id(self, value):
        # Convert empty string to None for consistency (Global Holiday)
        if value == "" or value == "null" or value is None:
            return None
        return value

    def validate(self, data):
        # Check if a holiday already exists for this date and staff member
        date = data.get('date')
        staff_id = data.get('staff_id')
        
        # Standardize date to naive datetime at midnight for reliable comparison
        if date:
            standard_date = datetime(date.year, date.month, date.day)
            data['date'] = standard_date

        # For create, check for existing
        if not self.instance:
            existing = HolidayCalendar.objects(date=data['date'], staff_id=staff_id).first()
            if existing:
                raise serializers.ValidationError(
                    f"A holiday already exists for {data['date'].strftime('%Y-%m-%d')} for this staff selection."
                )
        return data

    def create(self, validated_data):
        holiday = HolidayCalendar(**validated_data)
        holiday.save()
        return holiday

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


# -------------------------------
# Branch Serializer
# -------------------------------
class BranchSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    branch_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    name = serializers.CharField(required=True)
    location = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    whatsapp_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    contact_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    is_active = serializers.BooleanField(default=True)
    created_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        if not validated_data.get('branch_id'):
            import uuid
            validated_data['branch_id'] = f"BR_{uuid.uuid4().hex[:8].upper()}"
        branch = Branch(**validated_data)
        branch.save()
        return branch

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


# -------------------------------
# Job Type Serializer
# -------------------------------
class JobTypeSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(required=True)
    is_active = serializers.BooleanField(default=True)
    created_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        job_type = JobType(**validated_data)
        job_type.save()
        return job_type


# -------------------------------
# Expired / Scrap Item Serializer
# -------------------------------
class ExpiredItemSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(required=True)
    complaint_no = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    customer_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    buying_price = serializers.FloatField(required=False, default=0.0)
    sold_price = serializers.FloatField(required=False, allow_null=True)
    
    buy_date = serializers.DateTimeField(required=False)
    sold_date = serializers.DateTimeField(required=False, allow_null=True)
    
    created_at = serializers.DateTimeField(read_only=True)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


# -------------------------------
# Promotion Serializer
# -------------------------------
class PromotionSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(required=True)
    description = serializers.CharField(required=True)
    price = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    photo_url = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    job_type_id = serializers.SerializerMethodField(read_only=True)
    job_type_name = serializers.SerializerMethodField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)

    def get_job_type_id(self, obj):
        return str(obj.job_type.id) if obj.job_type else ""

    def get_job_type_name(self, obj):
        return obj.job_type.name if obj.job_type else ""

    def create(self, validated_data):
        promo = Promotion(**validated_data)
        promo.save()
        return promo

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


# -------------------------------
# Inventory Transaction Serializer
# -------------------------------
class InventoryTransactionSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    transaction_id = serializers.CharField(required=True)
    branch_name = serializers.CharField(required=True)
    type = serializers.CharField(required=True)
    category = serializers.CharField(required=True)
    amount = serializers.FloatField(required=True)
    status = serializers.CharField(required=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    date = serializers.DateTimeField(required=False)
    created_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        from .models import InventoryTransaction
        transaction = InventoryTransaction(**validated_data)
        transaction.save()
        return transaction

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


# -------------------------------
# Service Serializer
# -------------------------------
class ServiceSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(required=True)
    price = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    time = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    desc = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    job_type_id = serializers.SerializerMethodField(read_only=True)
    job_type_name = serializers.SerializerMethodField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)

    def get_job_type_id(self, obj):
        return str(obj.job_type.id) if obj.job_type else ""

    def get_job_type_name(self, obj):
        return obj.job_type.name if obj.job_type else ""


