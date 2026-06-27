from user.time_utils import get_ist_now
from mongoengine import Document, StringField, ListField , BooleanField, DateTimeField, ReferenceField, ImageField, signals, IntField, FloatField, DictField
from datetime import datetime
import json

# ------------------------------
#   Discount Calculation Utility
# ------------------------------
def calculate_discounted_price(selling_price, buying_price, discount_percent):
    """
    Calculate discounted price with validation to prevent loss.
    
    Args:
        selling_price: Original selling price
        buying_price: Cost price (minimum allowed)
        discount_percent: Discount percentage (0-100)
    
    Returns:
        dict with discounted_price and error (if any)
    
    Rules:
        - Final price must NOT go below buying price
        - Discount must be between 0 and 100
    """
    # Validate discount percent
    if discount_percent < 0 or discount_percent > 100:
        return {"discounted_price": selling_price, "error": "Discount must be between 0 and 100"}
    
    # If no discount, return selling price
    if discount_percent == 0:
        return {"discounted_price": selling_price, "error": None}
    
    # Calculate discounted price
    discount_amount = (selling_price * discount_percent) / 100
    discounted_price = selling_price - discount_amount
    
    # Validate against buying price
    if discounted_price < buying_price:
        # Calculate maximum allowed discount
        max_discount = ((selling_price - buying_price) / selling_price) * 100 if selling_price > 0 else 0
        return {
            "discounted_price": buying_price, 
            "error": f"Discount too high! Maximum allowed is {round(max_discount, 2)}%. Price cannot be below buying price."
        }
    
    return {"discounted_price": round(discounted_price, 2), "error": None}


# ✅ Admin/User model

class User(Document):
    full_name = StringField(required=True, unique=True)
    password = StringField(required=True)

    role = StringField(
        required=True,
        choices=("bigadmin", "admin"),
        default="admin"
    )

    # Permission fields ONLY for admin
    permissions = ListField(StringField())  # Example: ["staff", "booking"]
    
    # Additional fields to match MongoDB document structure
    is_active = BooleanField(default=True)
    created_at = DateTimeField(default=get_ist_now)

    meta = {'collection': 'users'}

# ✅ Staff model
from mongoengine import Document, StringField, BooleanField, DateTimeField, FloatField
from datetime import datetime

class Staff(Document):
    name = StringField(required=True, max_length=100)
    email = StringField(required=False,null=True)
    phone = StringField(max_length=15)
    alternate_number = StringField(max_length=15, null=True)
    location = StringField(max_length=200)
    photo_url = StringField()
    is_active = BooleanField(default=True)
    created_at = DateTimeField(default=get_ist_now)
    
    # Salary fields
    per_day_salary = FloatField(default=0)
    monthly_salary = FloatField(default=0)
    salary_last_updated = DateTimeField(null=True)

    # Weekly off days (e.g., ["Sunday", "Saturday"])
    weekly_off_days = ListField(StringField(), default=[])
    
    # Branch assignment
    branch_name = StringField(max_length=100, null=True, blank=True)

    meta = {'collection': 'staffs'}

    def save(self, *args, **kwargs):
        """
        Auto-calculate per_day_salary when monthly_salary is set.
        If monthly_salary is provided, calculate per_day_salary = monthly_salary / 30
        """
        # Auto-calculate per_day_salary from monthly_salary if monthly_salary is set
        if self.monthly_salary and self.monthly_salary > 0:
            # Only update if per_day_salary hasn't been manually set or if monthly changed
            calculated_per_day = self.monthly_salary / 30
            # If monthly salary changed, update per_day_salary
            if not hasattr(self, '_updating_salary_manually'):
                self.per_day_salary = round(calculated_per_day, 2)
        
        # Update salary_last_updated timestamp
        self.salary_last_updated = get_ist_now()
        
        return super().save(*args, **kwargs)


class DeletedStaff(Document):
    name = StringField(required=True, max_length=100)
    email = StringField(required=False)
    phone = StringField(max_length=15)
    location = StringField(max_length=200)
    branch_name = StringField(max_length=100, null=True, blank=True)
    photo_url = StringField()
    deleted_at = DateTimeField(default=get_ist_now)

    meta = {'collection': 'deleted_staffs'}



class SentEmail(Document):
    to = StringField(required=True)
    subject = StringField(required=True)
    message = StringField(required=True)
    sent_at = DateTimeField(default=get_ist_now)


from mongoengine import Document, StringField, BooleanField, DateTimeField
from datetime import datetime

from mongoengine import *
from datetime import datetime

from datetime import datetime
from mongoengine import (
    Document, StringField, BooleanField,
    DateTimeField, FloatField, DictField
)

class BookServiceComplaint(Document):
    complaint_no = StringField(max_length=50, unique=True, required=True)
    customer_id = StringField(required=False, null=True, unique=False)
    customer_name = StringField(max_length=100, required=True)
    customer_email = StringField(max_length=100, null=True)
    phone = StringField(max_length=15, required=True)
    alternate_number = StringField(max_length=15, null=True)
    address = StringField(required=True)
    product_name = StringField(max_length=2000)
    product_quantity = IntField(default=1)  # NEW: Product quantity for stock management
    product_discount_percent = FloatField(default=0)  # Discount percentage for product
    remarks = StringField(max_length=200, null=True)
    client_amount = FloatField(null=True, default=0.0)
    completed_remarks = StringField(max_length=500, null=True)
    details = StringField()

    customer_type = StringField(
        choices=['our_customer', 'external_customer'],
        default='our_customer',
        required=True
    )

    assigned = BooleanField(default=False)
    staff_name = StringField(null=True)
    assigned_at = DateTimeField(null=True)
    stock_reduced = BooleanField(default=False)  # NEW: Prevent double stock deduction

    status = StringField(
        choices=['initial', 'pending', 'assigned', 'completed'],
        default='pending'
    )

    # Service type: in_service (at customer location) or out_service (at service center/shop)
    service_type = StringField(
        choices=['in_service', 'out_service'],
        default='in_service'
    )

    # ⭐ NEW: Job type for motor services (legacy)
    job_type = StringField(max_length=50, null=True)
    
    # ⭐ NEW: Job category for consistent filtering (motor_sale, motor_service, etc.)
    job_category = StringField(max_length=50, null=True)
    
    # ⭐ NEW: Flag to identify initial records (created from Add Customer)
    # Initial records are not real jobs - no staff assignment, payment, or invoice
    is_initial = BooleanField(default=False)

    payment_method = StringField(max_length=20, null=True)
    amount = FloatField(null=True, default=0.0)
    date_created = DateTimeField(default=get_ist_now)

    assigned_completed_at = DateTimeField(null=True)

    warranty_photo = StringField(null=True)
    warranty_date = DateTimeField(null=True)
    next_service_date = DateTimeField(null=True)

    warranty_completed = BooleanField(default=False)
    warranty_completed_at = DateTimeField(null=True)

    reminder_sent = BooleanField(default=False)
    reminder_sent_at = DateTimeField(null=True)

    # NEW: Additional product fields for completion flow
    additional_product = StringField(required=False, null=True)
    additional_product_quantity = IntField(default=0)
    staff_incentive = FloatField(default=0.0)

    # Payment related fields (may exist in older documents)
    payment_due_date = DateTimeField(null=True)
    payment_completed_date = DateTimeField(null=True)
    payment_status = StringField(null=True)
    due_amount = FloatField(null=True, default=0.0)
    amount_received = FloatField(null=True, default=0.0)
    total_amount = FloatField(null=True, default=0.0)
    grand_total = FloatField(null=True, default=0.0)

    # Invoice fields
    invoice_number = StringField(max_length=50, null=True)
    invoice_pdf_url = StringField(null=True)
    invoice_generated_at = DateTimeField(null=True)

    # WhatsApp notification tracking
    whatsapp_sent_to_customer = BooleanField(default=False)
    whatsapp_sent_to_staff = BooleanField(default=False)
    booking_whatsapp_sent = BooleanField(default=False)
    
    # Branch assignment
    branch_name = StringField(max_length=100, null=True, blank=True)

    meta = {'collection': 'book_service_complaints', 'strict': False}

    # ✅ Generate complaint number
    @staticmethod
    def generate_complaint_no():
        # Try to get the highest complaint number by parsing all existing complaint numbers
        try:
            # Get all complaint numbers that match our pattern
            complaints = BookServiceComplaint.objects.only('complaint_no')
            max_num = 0
            
            for complaint in complaints:
                if complaint.complaint_no and complaint.complaint_no.startswith('#WP-COMP-'):
                    try:
                        num = int(complaint.complaint_no.split('-')[-1])
                        if num > max_num:
                            max_num = num
                    except (ValueError, IndexError):
                        continue
            
            new_num = max_num + 1
        except Exception:
            # Fallback to a simple increment approach if the above fails
            new_num = 1

        return f"#WP-COMP-{new_num}"

    def calculate_grand_total(self):
        """
        Calculates the grand total for this complaint by summing:
        1. Booking products (excluding motors if motor_sale)
        2. Additional products
        3. Client amount (service charge)
        4. Motor amount (if motor_sale)
        """
        def parse_products(product_field):
            if not product_field:
                return []
            try:
                parsed = json.loads(product_field) if isinstance(product_field, str) else product_field
                return parsed if isinstance(parsed, list) else []
            except:
                return []

        # 1. Calculate Booking Products Total
        booking_products = parse_products(self.product_name)
        booking_total = 0
        for p in booking_products:
            # ⭐ FIX: More robust motor skipping for motor_sale jobs
            # Skip if explicit flags are set OR if product name contains "motor"
            is_motor_product = p.get('isMotorSale') or p.get('isMotor') or 'motor' in (p.get('productName') or p.get('name') or p.get('product_name', '')).lower()
            
            if self.job_type == 'motor_sale' and is_motor_product:
                continue
                
            qty = p.get('quantity') or p.get('qty') or 1
            # Use final_price if available, otherwise fallback to selling_price
            price = p.get('final_price')
            if price is None:
                selling = p.get('selling_price') or p.get('sellingPrice') or 0
                discount = p.get('discount_percent') or p.get('discount') or 0
                price = selling - (selling * discount / 100) if discount > 0 else selling
            
            booking_total += float(price) * int(qty)

        # 2. Calculate Additional Products Total
        additional_products = parse_products(self.additional_product)
        additional_total = 0
        for p in additional_products:
            qty = p.get('quantity') or p.get('qty') or 1
            price = p.get('final_price')
            if price is None:
                selling = p.get('selling_price') or p.get('sellingPrice') or 0
                discount = p.get('discount_percent') or p.get('discount') or 0
                price = selling - (selling * discount / 100) if discount > 0 else selling
            
            additional_total += float(price) * int(qty)

        # 3. Client Amount
        client_amount = float(self.client_amount or 0)

        # 4. Motor Total (from MotorDetails table for motor_sale jobs)
        motor_total = 0
        if self.job_type == 'motor_sale':
            try:
                from .models import MotorDetails
                motor = MotorDetails.objects(complaint_id=self.complaint_no).first()
                if not motor and self.complaint_no:
                    if self.complaint_no.startswith('#'):
                        motor = MotorDetails.objects(complaint_id=self.complaint_no.lstrip('#')).first()
                    else:
                        motor = MotorDetails.objects(complaint_id=f'#{self.complaint_no}').first()
                
                if motor and motor.motor_amount:
                    m_price = float(motor.motor_amount or 0)
                    m_discount = float(getattr(motor, 'discount_percent', 0) or 0)
                    motor_total = m_price - (m_price * m_discount / 100) if m_discount > 0 else m_price
            except Exception as e:
                print(f"Error fetching motor total in calculate_grand_total: {e}")

        # 5. Expired / Scrap Items Deduction
        expired_total = 0
        try:
            # Import locally to avoid circular dependencies if needed
            # (ExpiredItem is in the same file, but this is safe)
            expired_items = ExpiredItem.objects(complaint_no=self.complaint_no)
            for ei in expired_items:
                expired_total += float(ei.buying_price or 0)
        except Exception as e:
            print(f"Error fetching expired items total in calculate_grand_total: {e}")

        return round(max(0, booking_total + additional_total + client_amount + motor_total - expired_total), 2)

    def save(self, *args, **kwargs):
        """
        Rules:
        - Auto-generate complaint_no (only once)
        - status == completed → assigned_completed_at set once
        - warranty_completed == True → warranty_completed_at set once
        """

        # 🔹 Complaint number logic (ONLY ON CREATE)
        if not self.complaint_no:
            self.complaint_no = self.generate_complaint_no()

        # 🔹 Assigned completion logic
        if self.status == 'completed':
            if self.assigned_completed_at is None:
                self.assigned_completed_at = get_ist_now()
        else:
            self.assigned_completed_at = None

        # 🔹 Warranty completion logic
        if self.warranty_completed:
            if self.warranty_completed_at is None:
                self.warranty_completed_at = get_ist_now()
        else:
            self.warranty_completed_at = None

        # 🔹 Recalculate grand_total and due_amount
        # We recalculate for all non-initial records to ensure consistency
        if not self.is_initial:
            old_grand_total = self.grand_total or 0
            self.grand_total = self.calculate_grand_total()
            
            # If grand_total changed, adjust due_amount (total - received)
            # This ensures due_amount is always in sync with grand_total
            self.due_amount = round(max(0, self.grand_total - (self.amount_received or 0)), 2)

        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.complaint_no} - {self.customer_name} ({self.status})"

# ------ SIGNAL FOR AUTO SETTING ASSIGNED TIME ------
@signals.pre_save.connect
def set_assigned_time(sender, document, **kwargs):
    if isinstance(document, BookServiceComplaint):
        # convert string to datetime if needed
        if isinstance(document.assigned_at, str):
            try:
                document.assigned_at = datetime.fromisoformat(document.assigned_at)
            except:
                document.assigned_at = get_ist_now()

        # set time only when assigned=True
        if document.assigned and document.assigned_at is None:
            document.assigned_at = get_ist_now()

class ClientDetails(Document):
    customer_id = StringField()  # Removed unique=True to avoid index conflicts
    customer_name = StringField(max_length=100, required=True)
    customer_email = StringField(max_length=100, null=True)
    phone = StringField(max_length=15, required=True, unique=True)
    alternate_number = StringField(max_length=15, null=True)
    address = StringField(required=True)
    location = DictField()  # GPS data: {"latitude": float, "longitude": float}
    status = StringField(
        choices=['online', 'offline'],
        default='online'
    )
    customer_type = StringField(
        choices=['our_customer', 'external_customer'],
        default='our_customer',
        required=True
    )
    
    # Meta settings to allow legacy fields in existing documents
    meta = {
        'strict': False  # Ignore extra fields not defined in model (like old client_id)
    }
    
    # Keep client_id for backward compatibility with existing data
    # But it's now computed from customer_id - not stored separately
    @property
    def client_id(self):
        return self.customer_id

    def save(self, *args, **kwargs):
        """
        Auto-generate customer_id with pattern: cust_CustomerName_X
        Example: cust_John_1, cust_Jane_2, etc.
        Prevents overwriting existing IDs and avoids race conditions.
        """
        # Auto-generate customer_id only for new records
        if not self.customer_id:
            # Find the highest customer_id number to avoid duplicates
            # Look for pattern cust_<name>_<number>
            last = ClientDetails.objects(customer_id__startswith="cust_").order_by("-customer_id").first()
            
            if last and last.customer_id:
                try:
                    # Extract number from format cust_Name_X
                    number = int(last.customer_id.split("_")[-1])
                except:
                    number = 0
                new_number = number + 1
            else:
                new_number = 1
            
            # Create customer_id with name: cust_John_1
            name_part = "".join(c for c in self.customer_name[:10] if c.isalnum()) if self.customer_name else "Customer"
            self.customer_id = f"cust_{name_part}_{new_number}"

        super().save(*args, **kwargs)

class Products(Document):
    product_name = StringField(max_length=100, required=True)
    #model_number = StringField(max_length=100, required=True)
    description = StringField(null=True)
    branch_name = StringField(max_length=100, null=True, blank=True)

    meta = {'collection': 'products', 'strict': False}

    def __str__(self):
        return self.product_name

# ------------------------------
#   Staff Attendance Model
# ------------------------------
class StaffAttendance(Document):
    staff_id = StringField(required=True)  # Reference to Staff ID
    staff_name = StringField(required=True)  # Staff name for easier queries
    date = DateTimeField(required=True)  # Date only (server-based)
    status = StringField(
        required=True,
        choices=['Present', 'Absent'],
        default='Absent'
    )
    # Extended payroll fields
    attendance_type = StringField(
        choices=['present', 'absent', 'leave', 'holiday'],
        default='absent'
    )  # present, absent, leave, holiday
    work_type = StringField(
        choices=['full_day', 'half_day'],
        default='full_day'
    )  # full_day, half_day
    salary_multiplier = FloatField(default=1)  # 1 = normal, 1.5 = 1.5x, 2 = double pay
    salary_multiplier_reason = StringField(null=True) # Reason for the multiplier
    is_override = BooleanField(default=False)  # If attendance is on holiday/weekoff
    override_reason = StringField(null=True)   # Reason if multiplier > 1 on special day
    marked_by = StringField(required=True)  # Admin user who marked attendance
    marked_at = DateTimeField(default=get_ist_now)
    branch_name = StringField(max_length=100, null=True, blank=True)

    meta = {'collection': 'staff_attendance', 'strict': False}

    def __str__(self):
        return f"{self.staff_name} - {self.date.strftime('%Y-%m-%d')} - {self.status}"


# ------------------------------
#   Payroll Model
# ------------------------------
class StaffPayroll(Document):
    """
    Payroll model for storing calculated monthly salary for staff.
    This is a read-only calculation based on attendance data.
    """
    staff_id = StringField(required=True)
    staff_name = StringField(required=True)
    month = IntField(required=True)  # 1-12
    year = IntField(required=True)
    
    # Attendance counts
    present_days = IntField(default=0)
    half_days = IntField(default=0)
    holiday_days = IntField(default=0)
    paid_holiday_days = IntField(default=0)
    unpaid_holiday_days = IntField(default=0)
    leave_days = IntField(default=0)
    absent_days = IntField(default=0)
    
    # Salary calculation
    per_day_salary = FloatField(default=0)
    monthly_salary = FloatField(default=0)  # Base salary (monthly)
    total_salary = FloatField(default=0)
    
    # Multiplier calculation - sum of all daily multipliers
    total_multiplier = FloatField(default=0)  # Sum of salary_multiplier for all days
    
    # Attendance percentage based on actual days in month
    attendance_percentage = FloatField(default=0)
    days_in_month = IntField(default=0)
    
    # Optional adjustments
    bonus = FloatField(default=0)
    deduction = FloatField(default=0)
    total_incentives = FloatField(default=0)
    final_salary = FloatField(default=0)
    # Custom date range and status management
    start_date = DateTimeField(null=True, blank=True)
    end_date = DateTimeField(null=True, blank=True)
    status = StringField(choices=["paid", "pending", "stopped"], default="paid")
    
    # Branch assignment
    branch_name = StringField(max_length=100, null=True, blank=True)
    
    # Metadata
    generated_at = DateTimeField(default=get_ist_now)
    
    meta = {'collection': 'staff_payroll', 'strict': False}


# ------------------------------
#   Holiday Calendar Model
# ------------------------------
class HolidayCalendar(Document):
    """
    Model for storing holidays and weekly offs.
    A null staff_id applies to all staff (global holiday).
    """
    date = DateTimeField(required=True)  # Unique per staff/global handled by index
    name = StringField(required=True)  # e.g., "Diwali", "Sunday Off"
    type = StringField(
        choices=['company_holiday', 'weekly_off'],
        default='company_holiday'
    )
    staff_id = StringField(null=True)  # null = global holiday
    is_paid = BooleanField(default=True)
    is_auto = BooleanField(default=False)
    is_active = BooleanField(default=True)
    
    # Branch assignment
    branch_name = StringField(max_length=100, null=True, blank=True)
    
    created_at = DateTimeField(default=get_ist_now)
    updated_at = DateTimeField(default=get_ist_now)

    meta = {
        'collection': 'holiday_calendar',
        'strict': False,
        'indexes': [
            {'fields': ['date', 'staff_id'], 'unique': True},
            'staff_id'
        ]
    }

    def save(self, *args, **kwargs):
        self.updated_at = get_ist_now()
        return super().save(*args, **kwargs)


# ------------------------------
#   Stock Management Model
# ------------------------------
class StockItem(Document):
    """
    Stock management model for tracking inventory items.
    This model is completely isolated from existing booking/complaint flows.
    """
    stock_id = StringField(unique=True, required=True)
    name = StringField(max_length=100, required=True)
    category = StringField(max_length=50, null=True, blank=True)
    quantity = IntField(min_value=0, default=0, required=True)
    unit = StringField(max_length=20, default="pcs", required=True)
    minimum_threshold = IntField(min_value=0, default=0, required=True)
    selling_price = FloatField(null=True, blank=True)  # Selling price per unit
    buying_price = FloatField(null=True, blank=True)  # Cost price per unit
    minimum_price = FloatField(null=True, blank=True)  # Minimum price for discounting
    created_at = DateTimeField(default=get_ist_now)
    updated_at = DateTimeField(default=get_ist_now)
    
    # ⭐ NEW: Motor-specific fields
    is_motor = BooleanField(default=False)  # Flag to identify motor items
    motor_brand = StringField(max_length=100, null=True, blank=True)  # Motor brand (e.g., Crompton, Kirloskar)
    motor_model = StringField(max_length=100, null=True, blank=True)  # Motor model
    motor_specs = DictField(null=True, blank=True)  # Motor specifications (kw, hp, rpm, slots, etc.)
    # ⭐ NEW: Motor brands with detailed structure (for multi-brand support)
    motor_brands = ListField(DictField(), null=True, blank=True)  # List of {brand_name: str, quantity: int, specification_id: str, purchase_price: float, selling_price: float, minimum_price: float, created_at: date}
    
    # Branch assignment
    branch_name = StringField(max_length=100, null=True, blank=True)

    meta = {'collection': 'stock_items', 'strict': False}

    def save(self, *args, **kwargs):
        """
        Stock validation rules:
        - Auto-generate stock_id if not provided
        - Prevent negative quantity
        - Update updated_at timestamp
        - For motor items, calculate total quantity from motor_brands
        """
        # Auto-generate stock_id only for new records
        if not self.stock_id:
            # ⭐ Better: Only consider items that follow the "STOCK_" pattern
            # Find all stock IDs with the prefix and find the maximum numerical value
            stock_items = StockItem.objects(stock_id__startswith="STOCK_").only('stock_id')
            
            max_num = 0
            for item in stock_items:
                try:
                    # Extract number from format STOCK_XXX or STOCK_XXXX
                    num_str = item.stock_id.split("_")[-1]
                    num = int(num_str)
                    if num > max_num:
                        max_num = num
                except (ValueError, IndexError):
                    continue
            
            new_number = max_num + 1
            self.stock_id = f"STOCK_{new_number:03d}"

        # Ensure quantity is never negative
        if self.quantity < 0:
            self.quantity = 0

        # For motor items, calculate total quantity from motor_brands
        if self.is_motor and self.motor_brands:
            total_quantity = sum(brand.get('quantity', 0) for brand in self.motor_brands)
            self.quantity = total_quantity

        # Update timestamp
        self.updated_at = get_ist_now()

        return super().save(*args, **kwargs)

    def add_stock(self, quantity_to_add):
        """
        Add stock quantity.
        Returns: (success: bool, message: str)
        """
        if quantity_to_add <= 0:
            return False, "Quantity to add must be greater than 0"
        
        previous_quantity = self.quantity
        self.quantity += quantity_to_add
        self.save()
        
        return True, f"Added {quantity_to_add} units. New quantity: {self.quantity}"

    def reduce_stock(self, quantity_to_reduce, brand_name=None, brand_id=None, check_threshold=False):
        """
        Reduce stock quantity with validation.
        Supports brand-specific reduction for motors using MotorVariant.
        Returns: (success: bool, message: str)
        """
        if quantity_to_reduce <= 0:
            return False, "Quantity to reduce must be greater than 0"
        
        previous_quantity = self.quantity
        
        # If it's a motor and brand is specified (name or ID)
        if self.is_motor and (brand_name or brand_id):
            # Local import to avoid circular dependencies
            from .models import MotorVariant
            
            # 0. RESOLVE brand_name if only ID is provided
            if brand_id and not brand_name:
                if self.motor_brands:
                    selected = next((b for b in self.motor_brands if str(b.get('id','')) == str(brand_id)), None)
                    if selected:
                        brand_name = selected.get('brand_name') or selected.get('brand')
            
            if not brand_name:
                return False, "Brand name or ID is required for motor products."
 
            # 1. Fetch MotorVariant
            variant = MotorVariant.objects(product=self, brand__iexact=brand_name).first()
            if not variant:
                return False, f"Motor brand '{brand_name}' not found in variants."
            
            if quantity_to_reduce > variant.count:
                return False, f"Insufficient stock for brand '{brand_name}'. Available: {variant.count}"
            
            # Check threshold if requested
            if check_threshold and (variant.count - quantity_to_reduce) < self.minimum_threshold:
                return False, f"Stock for brand '{brand_name}' would fall below minimum threshold of {self.minimum_threshold}. Available: {variant.count}"
            
            # 2. Reduce variant count
            variant.count -= quantity_to_reduce
            variant.save()
            print(f"MotorVariant '{brand_name}' reduced by {quantity_to_reduce}. New count: {variant.count}")
            
            # 3. Keep internal motor_brands list in sync for UI/legacy support
            if self.motor_brands:
                for i, brand in enumerate(self.motor_brands):
                    current_brand_name = brand.get('brand_name') or brand.get('brand')
                    if current_brand_name and current_brand_name.lower() == brand_name.lower():
                        # Create a new dict to ensure MongoEngine tracks the change
                        brand_copy = dict(brand)
                        brand_copy['quantity'] = variant.count
                        brand_copy['count'] = variant.count
                        self.motor_brands[i] = brand_copy
                        print(f"Synced self.motor_brands[{i}]: {variant.count}")
                        break
            
            # 4. RECALCULATE total quantity from all MotorVariants
            all_variants = MotorVariant.objects(product=self)
            total_qty = sum(v.count for v in all_variants)
            self.quantity = total_qty
            print(f"Total stock recalculated from variants: {self.quantity}")
        else:
            # Normal product reduction
            if quantity_to_reduce > self.quantity:
                return False, f"Insufficient stock. Available: {self.quantity}"
            
            # Check threshold if requested
            if check_threshold and (self.quantity - quantity_to_reduce) < self.minimum_threshold:
                return False, f"Stock would fall below minimum threshold of {self.minimum_threshold}. Available: {self.quantity}"

            self.quantity -= quantity_to_reduce
        
        self.save()
        
        return True, f"Reduced {quantity_to_reduce} units. New quantity: {self.quantity}"

    def get_status(self):
        """
        Get stock status based on current quantity and threshold.
        Returns: 'Available', 'Low', or 'Out of Stock'
        """
        if self.quantity == 0:
            return "Out of Stock"
        elif self.quantity <= self.minimum_threshold:
            return "Low"
        else:
            return "Available"

    def __str__(self):
        return f"{self.stock_id} - {self.name} ({self.quantity} {self.unit})"

    # ⭐ NEW: Motor brand management methods
    def add_motor_brand(self, brand_name, quantity, specification_id=None, purchase_price=None, selling_price=None, minimum_price=None):
        """
        Add a new motor brand to this stock item.
        Returns: (success: bool, message: str)
        """
        if not self.is_motor:
            return False, "This stock item is not a motor"
        
        if not brand_name or not brand_name.strip():
            return False, "Brand name is required"
        
        if quantity <= 0:
            return False, "Quantity must be greater than 0"
        
        # Initialize motor_brands if None
        if not self.motor_brands:
            self.motor_brands = []
        
        # Check if brand already exists
        for brand in self.motor_brands:
            if brand.get('brand_name', '').lower() == brand_name.lower():
                return False, f"Brand '{brand_name}' already exists"
        
        # Add new brand
        new_brand = {
            'brand_name': brand_name.strip(),
            'quantity': quantity,
            'specification_id': specification_id,
            'purchase_price': purchase_price,
            'selling_price': selling_price,
            'minimum_price': minimum_price,
            'created_at': get_ist_now().isoformat()
        }
        self.motor_brands.append(new_brand)
        
        # Update total quantity
        self.quantity = sum(brand.get('quantity', 0) for brand in self.motor_brands)
        
        self.save()
        return True, f"Added brand '{brand_name}' with quantity {quantity}"

    def update_motor_brand(self, brand_name, quantity=None, specification_id=None, purchase_price=None, selling_price=None, minimum_price=None):
        """
        Update an existing motor brand.
        Returns: (success: bool, message: str)
        """
        if not self.is_motor:
            return False, "This stock item is not a motor"
        
        if not self.motor_brands:
            return False, "No motor brands found"
        
        for brand in self.motor_brands:
            if brand.get('brand_name', '').lower() == brand_name.lower():
                if quantity is not None:
                    if quantity <= 0:
                        return False, "Quantity must be greater than 0"
                    brand['quantity'] = quantity
                if specification_id is not None:
                    brand['specification_id'] = specification_id
                if purchase_price is not None:
                    brand['purchase_price'] = purchase_price
                if selling_price is not None:
                    brand['selling_price'] = selling_price
                if minimum_price is not None:
                    brand['minimum_price'] = minimum_price
                
                # Update total quantity
                self.quantity = sum(b.get('quantity', 0) for b in self.motor_brands)
                
                self.save()
                return True, f"Updated brand '{brand_name}'"
        
        return False, f"Brand '{brand_name}' not found"

    def remove_motor_brand(self, brand_name):
        """
        Remove a motor brand from this stock item.
        Returns: (success: bool, message: str)
        """
        if not self.is_motor:
            return False, "This stock item is not a motor"
        
        if not self.motor_brands:
            return False, "No motor brands found"
        
        for i, brand in enumerate(self.motor_brands):
            if brand.get('brand_name', '').lower() == brand_name.lower():
                removed_brand = self.motor_brands.pop(i)
                
                # Update total quantity
                self.quantity = sum(b.get('quantity', 0) for b in self.motor_brands)
                
                self.save()
                return True, f"Removed brand '{brand_name}'"
        
        return False, f"Brand '{brand_name}' not found"

    def reduce_motor_brand_quantity(self, brand_name, quantity_to_reduce):
        """
        Reduce quantity for a specific motor brand.
        Returns: (success: bool, message: str)
        """
        if not self.is_motor:
            return False, "This stock item is not a motor"
        
        if not self.motor_brands:
            return False, "No motor brands found"
        
        if quantity_to_reduce <= 0:
            return False, "Quantity to reduce must be greater than 0"
        
        for brand in self.motor_brands:
            if brand.get('brand_name', '').lower() == brand_name.lower():
                current_quantity = brand.get('quantity', 0)
                if quantity_to_reduce > current_quantity:
                    return False, f"Cannot reduce {quantity_to_reduce} units. Available for '{brand_name}': {current_quantity}"
                
                brand['quantity'] = current_quantity - quantity_to_reduce
                
                # Update total quantity
                self.quantity = sum(b.get('quantity', 0) for b in self.motor_brands)
                
                self.save()
                return True, f"Reduced {quantity_to_reduce} units from '{brand_name}'. New quantity: {brand['quantity']}"
        
        return False, f"Brand '{brand_name}' not found"

    def get_motor_brand(self, brand_name):
        """
        Get a specific motor brand by name.
        Returns: brand dict or None
        """
        if not self.is_motor or not self.motor_brands:
            return None
        
        for brand in self.motor_brands:
            if brand.get('brand_name', '').lower() == brand_name.lower():
                return brand
        
        return None

    def get_all_motor_brands(self):
        """
        Get all motor brands for this stock item.
        Returns: list of brand dicts
        """
        if not self.is_motor:
            return []
        
        return self.motor_brands or []


# ------------------------------
#   Motor Variant Model
# ------------------------------
class MotorVariant(Document):
    """
    Sub-model specifically tracking motor variants by brand, linked to a parent Motor StockItem.
    """
    product = ReferenceField('StockItem', required=True)
    brand = StringField(max_length=100, required=True)
    count = IntField(default=0)
    supplier = StringField(max_length=100, null=True, blank=True)
    purchase_date = DateTimeField(null=True)
    purchase_price = FloatField(null=True)
    selling_price = FloatField(null=True)
    minimum_price = FloatField(null=True)
    
    # --- Technical Specification Fields (Synchronized with MotorDetails) ---
    company_name = StringField(max_length=200, null=True, blank=True)
    motor_make = StringField(max_length=100, null=True, blank=True)
    serial_no = StringField(max_length=100, null=True, blank=True)  # Format/pattern only - actual serial entered at sale
    kw = StringField(max_length=50, null=True, blank=True)
    hp = FloatField(null=True, blank=True) # Maps to hp in MotorDetails
    rpm = IntField(null=True, blank=True)
    phase = StringField(max_length=50, null=True, blank=True) # Single / Three
    voltage = StringField(max_length=50, null=True, blank=True)
    motor_type = StringField(max_length=100, null=True, blank=True)
    warranty = StringField(max_length=100, null=True, blank=True)
    
    # Winding & Coil Details
    no_of_slots = IntField(null=True, blank=True)
    core_length = StringField(max_length=50, null=True, blank=True)
    load_current = StringField(max_length=50, null=True, blank=True)
    swg = StringField(max_length=50, null=True, blank=True)
    connection = StringField(max_length=50, null=True, blank=True)
    total_set = StringField(max_length=50, null=True, blank=True)
    total_weight = StringField(max_length=50, null=True, blank=True)
    resistance_value = StringField(max_length=50, null=True, blank=True)
    winder_name = StringField(max_length=100, null=True, blank=True)
    opening_date = DateTimeField(null=True)
    closing_date = DateTimeField(null=True)
    remarks = StringField(null=True)
    winding_details = ListField(DictField(), null=True)
    
    # Branch assignment
    branch_name = StringField(max_length=100, null=True, blank=True)
    
    created_at = DateTimeField(default=get_ist_now)

    meta = {'collection': 'motor_variants', 'strict': False}

    def __str__(self):
        return f"{self.brand} ({self.count})"


# ------------------------------
#   Stock History Model
# ------------------------------
class StockHistory(Document):
    """
    Stock history model for tracking all stock operations.
    Records every add, reduce, and delete operation.
    """
    stock_id = StringField(required=True)
    stock_name = StringField(required=True)
    operation_type = StringField(
        required=True,
        choices=['purchase', 'add', 'reduce', 'delete', 'initial'],
        default='add'
    )
    quantity = IntField(required=True)
    previous_quantity = IntField(required=True)
    new_quantity = IntField(required=True)
    unit = StringField(max_length=20, default="pcs")
    notes = StringField(max_length=200, null=True, blank=True)
    performed_by = StringField(required=True)
    # New fields for supplier and price information
    supplier = StringField(max_length=100, null=True, blank=True)
    purchase_price_per_unit = FloatField(null=True, blank=True)
    total_purchase_amount = FloatField(null=True, blank=True)
    date_of_purchase = DateTimeField(null=True)
    # ⭐ NEW: Motor brand field for tracking motor brand-specific operations
    motor_brand = StringField(max_length=100, null=True, blank=True)
    # ⭐ NEW: Inventory flow type (in/out) for tracking inventory movement direction
    type = StringField(
        max_length=10,
        null=True,
        blank=True
    )
    # ⭐ NEW: Source of the stock operation (e.g., manual, booking, model)
    source = StringField(
        max_length=50,
        null=True,
        blank=True
    )
    # ⭐ NEW: Link to job context
    complaint_no = StringField(max_length=50, null=True, blank=True)
    customer_id = StringField(max_length=50, null=True, blank=True)
    
    # Branch assignment
    branch_name = StringField(max_length=100, null=True, blank=True)
    
    created_at = DateTimeField(default=get_ist_now)
    
    meta = {'collection': 'stock_history', 'strict': False}

    def __str__(self):
        return f"{self.stock_name} - {self.operation_type} - {self.quantity} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"

# ------------------------------
#   Motor Details Model (Three Phase Motor)
# ------------------------------
class MotorDetails(Document):
    """
    Motor details model for recording three-phase motor winding details.
    """
    # ⭐ NEW: Complaint linkage
    complaint_id = StringField(max_length=50)
    customer_name = StringField(max_length=200)
    customer_phone = StringField(max_length=20)
    
    # ⭐ NEW: Job Type - motor_service or motor_sales
    job_type = StringField(max_length=50, null=True)
    
    # ⭐ NEW: Job category for consistent filtering
    job_category = StringField(max_length=50, null=True)
    
    # Motor Information
    company_name = StringField(max_length=200, required=True)
    motor_make = StringField(max_length=100)
    # ⭐ NEW: Motor brand for tracking brand-specific motor sales
    motor_brand = StringField(max_length=100, null=True, blank=True)
    serial_no = StringField(max_length=100, required=True)
    kw = StringField(max_length=20)
    hp = StringField(max_length=20)
    rpm = IntField()
    no_of_slots = IntField()
    core_length = IntField()
    load_current = FloatField()
    swg = StringField(max_length=20)
    connection = StringField(
        choices=['Star', 'Delta', 'Star-Delta'],
        max_length=20
    )
    total_set = IntField()
    total_weight = StringField(max_length=20)
    resistance_value = StringField(max_length=20)
    winder_name = StringField(max_length=100)
    opening_date = DateTimeField()
    closing_date = DateTimeField()
    
    # ⭐ NEW: Motor Amount - only for motor_sales
    motor_amount = FloatField(null=True, default=0.0)
    # ⭐ NEW: Discount percent for motor_sales
    discount_percent = FloatField(null=True, default=0.0)
    # ⭐ NEW: Minimum price for motor_sales
    minimum_price = FloatField(null=True, blank=True)
    
    # Winding Details - Pitch, Turns & Set Weight (stored as list of dicts)
    winding_details = ListField(DictField())
    
    # Remarks
    remarks = StringField()
    
    # Metadata
    created_by = StringField(max_length=100)
    
    # Branch assignment
    branch_name = StringField(max_length=100, null=True, blank=True)
    
    created_at = DateTimeField(default=get_ist_now)
    updated_at = DateTimeField(default=get_ist_now)
    
    meta = {'collection': 'motor_details', 'strict': False}

    def __str__(self):
        return f"{self.company_name} - {self.motor_make} - {self.serial_no}"


# ------------------------------
#   Payment Transaction Model
# ------------------------------
class PaymentTransaction(Document):
    """
    Payment Transaction model for logging all payments per complaint.
    Tracks partial payments and payment history.
    """
    complaint_id = StringField(required=True)
    complaint_no = StringField()
    customer_name = StringField()
    customer_phone = StringField()
    
    # Payment Amount
    amount = FloatField(required=True)
    remaining_amount = FloatField(default=0)
    total_bill_amount = FloatField()
    
    # Payment Mode
    payment_mode = StringField(
        choices=['cash', 'upi', 'bank_transfer', 'cheque', 'card'],
        default='cash'
    )
    
    # Payment Status
    payment_status = StringField(
        choices=['partial', 'completed'],
        default='partial'
    )
    
    # Payment Date
    payment_date = DateTimeField(default=get_ist_now)
    due_date = DateTimeField(null=True)
    
    # Notes
    notes = StringField(null=True)
    
    # Created by
    created_by = StringField()
    created_at = DateTimeField(default=get_ist_now)
    
    meta = {'collection': 'payment_transactions'}

    def __str__(self):
        return f"{self.complaint_no} - {self.amount} - {self.payment_status}"


# ------------------------------
#   Staff Leave Balance Model
# ------------------------------
class StaffLeaveBalance(Document):
    """
    Staff Leave Balance model for tracking annual leave entitlements and usage.
    """
    staff_id = StringField(required=True)
    staff_name = StringField(required=True)
    year = IntField(required=True)
    
    # Leave entitlements
    total_leave_days = IntField(default=12)  # Annual leave entitlement
    leave_taken = IntField(default=0)
    leave_remaining = IntField(default=12)
    
    # Sick leave
    sick_leave_total = IntField(default=7)
    sick_leave_taken = IntField(default=0)
    sick_leave_remaining = IntField(default=7)
    
    created_at = DateTimeField(default=get_ist_now)
    updated_at = DateTimeField(default=get_ist_now)
    
    # Branch assignment
    branch_name = StringField(max_length=100, null=True, blank=True)
    
    meta = {'collection': 'staff_leave_balance', 'strict': False}

    def __str__(self):
        return f"{self.staff_name} - {self.year} - {self.leave_remaining} days remaining"


# ------------------------------
#   Staff Loan Model
# ------------------------------
class StaffLoan(Document):
    """
    Staff Loan model for managing staff advances and loans.
    """
    staff_id = StringField(required=True)
    staff_name = StringField(required=True)
    
    # Loan details
    loan_amount = FloatField(required=True)
    emi_amount = FloatField()
    total_emi_count = IntField(default=1)
    emi_paid_count = IntField(default=0)
    remaining_amount = FloatField()
    
    # Status
    status = StringField(
        choices=['active', 'completed', 'defaulted'],
        default='active'
    )
    
    # Dates
    start_date = DateTimeField(default=get_ist_now)
    end_date = DateTimeField(null=True)
    
    notes = StringField(null=True)
    created_at = DateTimeField(default=get_ist_now)
    
    # Branch assignment
    branch_name = StringField(max_length=100, null=True, blank=True)
    
    meta = {'collection': 'staff_loans', 'strict': False}

    def __str__(self):
        return f"{self.staff_name} - {self.loan_amount} - {self.status}"


# ------------------------------
#   Payment Details Collection (NEW)
# ------------------------------
class PaymentDetails(Document):
    """
    Payment transaction history model.
    Stores each payment as a separate document (append-only).
    """
    complaint_no = StringField(required=True)
    complaint_id = StringField(required=True)
    customer_id = StringField(null=True)
    customer_name = StringField(null=True)
    customer_phone = StringField(null=True)
    
    amount_paid = FloatField(required=True)
    payment_date = DateTimeField(default=get_ist_now)
    
    total_amount = FloatField(required=True)
    remaining_amount = FloatField(required=True)
    
    next_due_date = DateTimeField(null=True)
    
    payment_method = StringField(null=True)
    
    status = StringField(
        choices=['partial', 'completed'],
        default='partial'
    )
    
    created_at = DateTimeField(default=get_ist_now)
    
    # Branch assignment
    branch_name = StringField(max_length=100, null=True, blank=True)
    
    meta = {'collection': 'payment_details', 'strict': False}
    
    def __str__(self):
        return f"{self.complaint_no} - ₹{self.amount_paid} - {self.status}"


# ------------------------------
#   Branch Management Model
# ------------------------------
class Branch(Document):
    """
    Branch management model for tracking different business locations.
    """
    branch_id = StringField(required=True, unique=True)
    name = StringField(required=True, max_length=100)
    location = StringField(max_length=200, null=True, blank=True)
    whatsapp_number = StringField(max_length=20, null=True, blank=True)
    contact_number = StringField(max_length=20, null=True, blank=True)
    is_active = BooleanField(default=True)
    created_at = DateTimeField(default=get_ist_now)

    meta = {'collection': 'branches', 'strict': False}

    def __str__(self):
        return self.name


# ------------------------------
#   Job Types Model
# ------------------------------
class JobType(Document):
    """
    Dynamic job types for service complaints and bookings.
    """
    name = StringField(required=True, unique=True)
    is_active = BooleanField(default=True)
    created_at = DateTimeField(default=get_ist_now)

    meta = {'collection': 'job_types', 'strict': False}

    def __str__(self):
        return self.name


# ------------------------------
#   Expired / Scrap Items Model
# ------------------------------
class ExpiredItem(Document):
    """
    Model for tracking scrap/expired items collected from customers.
    """
    name = StringField(required=True)
    complaint_no = StringField(null=True, blank=True)
    customer_name = StringField(null=True, blank=True)
    
    buying_price = FloatField(default=0.0)
    sold_price = FloatField(null=True)
    
    buy_date = DateTimeField(default=get_ist_now)
    sold_date = DateTimeField(null=True)
    
    created_at = DateTimeField(default=get_ist_now)
    
    # Branch assignment
    branch_name = StringField(max_length=100, null=True, blank=True)

    meta = {'collection': 'expired_items', 'strict': False}

    def __str__(self):
        return f"{self.name} - {self.customer_name}"


# ------------------------------
#   Promotions Model
# ------------------------------
class Promotion(Document):
    """
    Model for tracking active promotions.
    """
    name = StringField(required=True, max_length=200)
    description = StringField(required=True)
    price = StringField(required=False, null=True)
    photo_url = StringField(required=False, null=True)
    created_at = DateTimeField(default=get_ist_now)

    meta = {'collection': 'promotions', 'strict': False}

    def __str__(self):
        return self.name


# ------------------------------
#   Site Settings Model
# ------------------------------
class SiteSettings(Document):
    """
    Global site settings - only one document stored (singleton pattern).
    """
    whatsapp_number = StringField(default="", null=True)
    contact_phone = StringField(default="", null=True)
    updated_at = DateTimeField(default=get_ist_now)

    meta = {'collection': 'site_settings', 'strict': False}

    def __str__(self):
        return f"SiteSettings (WhatsApp: {self.whatsapp_number})"


# ------------------------------
#   Inventory Transaction Model (Expenses & Income)
# ------------------------------
class InventoryTransaction(Document):
    """
    Inventory and Cash Flow model to track income and expenses by category, branch, and payment status.
    """
    transaction_id = StringField(required=True, unique=True)
    branch_name = StringField(max_length=100, required=True)
    type = StringField(choices=["income", "expense"], required=True)
    category = StringField(required=True) # e.g. product_purchasing, staff_salary, shop_rent, petrol, product_sale, service_amount, etc.
    amount = FloatField(default=0.0)
    status = StringField(choices=["received", "due", "paid", "pending"], default="received")
    description = StringField(null=True, blank=True)
    date = DateTimeField(default=get_ist_now)
    created_at = DateTimeField(default=get_ist_now)

    meta = {'collection': 'inventory_transactions', 'strict': False}

    def __str__(self):
        return f"{self.type.upper()} - {self.category} - ₹{self.amount} ({self.status})"

