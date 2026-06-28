from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static
from .views import customer_list


urlpatterns = [
    # ------------------------------
    # ✅ Authentication
    # ------------------------------
    path('login/', views.login, name='login'),

    # ------------------------------
    # ✅ Staff Management
    # ------------------------------
    path('staff/add/', views.add_staff, name='add_staff'),
    path('staff/', views.get_staff, name='get_staff'),
    path('staff/<str:staff_id>/', views.get_staff_detail, name='get_staff_detail'),
    path('staff/<str:staff_id>/edit/', views.edit_staff, name='edit_staff'),
    path('staff/<str:staff_id>/delete/', views.delete_staff, name='delete_staff'),

    # Deleted Staff Management
    path('staff/deleted-staffs/', views.deleted_staff_list, name='deleted_staff_list'),
    path('staff/<str:staff_id>/restore/', views.restore_staff, name='restore_staff'),

    # ------------------------------
    # ✅ Complaints Management
    # ------------------------------
    path('complaints/', views.complaint_list, name='complaint_list'),
    path('complaints/<str:pk>/', views.complaint_detail, name='complaint_detail'),
    path('get-complaints/', views.get_complaints, name='get_complaints'),
    path('update-complaint/<str:complaint_id>/', views.update_complaint, name='update_complaint'),
    path('service-reminders/', views.service_reminders, name='service_reminders'),

    # ------------------------------
    # ✅ Dashboard
    # ------------------------------
    path('dashboard-stats/', views.dashboard_stats, name='dashboard_stats'),
    path('staff-performance/', views.staff_performance_report, name='staff_performance_report'),
    path('daily-performance/', views.daily_performance_report, name='daily_performance_report'),

    # ------------------------------
    # ✅ Email
    # ------------------------------
    path('send-email/', views.send_email, name='send_email'),

    # ------------------------------
    # ✅ Booking Services
    # ------------------------------
    path('bookservice/', views.BookServiceCreateView.as_view(), name='bookservice_create'),
    path('selectstaff/', views.SelectStaffListView.as_view(), name='select_staff'),
    path('assignstaff/', views.AssignStaffToComplaintView.as_view(), name='assign_staff'),
    path('customers/', views.customer_list, name='customers'),
    path('customers/<str:customer_id>/', views.customer_list, name='customer_detail'),
    path('customer-by-phone/', views.get_customer_by_phone, name='get_customer_by_phone'),
    path('customer-by-id/', views.get_customer_by_id, name='get_customer_by_id'),
    path('complaintperson/',views.complaint_person,name='complaints'),
    path('products/', views.get_products, name='get_products'),
    path('products/create/', views.create_product, name='create_product'),
    path('products/<str:product_id>/update/', views.update_product, name='update_product'),
    path('products/<str:product_id>/delete/', views.delete_product, name='delete_product'),
    path('staff-daily-jobs/', views.staff_daily_jobs, name='staff_daily_jobs'),
    # path('api/complaints/<str:complaint_id>/warranty-photo/', views.get_warranty_photo),

    # ------------------------------
    #   WhatsApp Notification Tracking
    # ------------------------------
    path('update-whatsapp-status/', views.update_whatsapp_status, name='update_whatsapp_status'),
    path('pending-whatsapp-messages/', views.get_pending_whatsapp_messages, name='pending_whatsapp_messages'),
    
    # ------------------------------
    # ✅ Staff Attendance APIs
    # ------------------------------
    path('staff-attendance/mark/', views.mark_staff_attendance, name='mark_staff_attendance'),
    path('staff-attendance/today/', views.get_today_attendance, name='get_today_attendance'),
    path('staff-attendance/list/', views.get_attendance_history, name='get_attendance_history'),
    path('staff-attendance/present/', views.get_present_staff, name='get_present_staff'),
    path('staff-attendance/absent/', views.get_absent_staff, name='get_absent_staff'),
    
    # Debug endpoint
    path('debug/customers-count/', views.debug_customers_count, name='debug_customers_count'),
    
    path("users/", views.get_admins),
    path("users/create/", views.create_user),
    path("users/<str:user_id>/delete/", views.delete_user),
    path("user/<str:user_id>/", views.get_user),
    path("update-permissions/<str:user_id>/", views.update_permissions),

    # ------------------------------
    #   Stock Management APIs
    # ------------------------------
    path('stocks/create/', views.create_stock_item, name='create_stock_item'),
    path('stocks/', views.get_stock_items, name='get_stock_items'),
    path('stocks/alerts/', views.get_stock_alerts, name='get_stock_alerts'),
    path('stocks/history/', views.get_stock_history, name='get_stock_history'),
    path('stocks/backfill-history/', views.backfill_stock_history, name='backfill_stock_history'),
    path('stocks/product-purchase-history/', views.get_product_purchase_history, name='get_product_purchase_history'),
    path('stocks/<str:stock_id>/', views.update_stock_item, name='update_stock_item'),
    path('stocks/<str:stock_id>/add/', views.add_stock, name='add_stock'),
    path('stocks/<str:stock_id>/reduce/', views.reduce_stock, name='reduce_stock'),
    path('stocks/<str:stock_id>/delete/', views.delete_stock_item, name='delete_stock_item'),

    # ------------------------------
    #   Invoice Generation
    # ------------------------------
    path('generate-invoice/<str:complaint_id>/', views.generate_invoice, name='generate_invoice'),
    path('invoices/', views.get_all_invoices, name='get_all_invoices'),
    path('download-invoice/<str:invoice_number>/', views.download_invoice, name='download_invoice'),

    # ------------------------------
    #   Payment Details APIs
    # ------------------------------
    # Main endpoint with complaint_id
    path('update-payment/<str:complaint_id>/', views.update_payment, name='update_payment'),
    # Fallback endpoint without complaint_id for debugging
    path('update-payment/', views.update_payment_debug, name='update_payment_debug'),
    path('payment-due-jobs/', views.get_payment_due_jobs, name='payment_due_jobs'),
    path('completed-jobs-payment/', views.get_completed_jobs_with_payment, name='completed_jobs_payment'),
    # NEW: Payment history endpoint with complaint_id
    path('payment-history/<str:complaint_id>/', views.get_payment_history, name='payment_history'),

    # ------------------------------
    #   Payroll Management APIs
    # ------------------------------
    path('payroll/calculate/', views.calculate_payroll, name='calculate_payroll'),
    path('payroll/save/', views.save_payroll, name='save_payroll'),
    path('payroll/history/', views.get_payroll_history, name='get_payroll_history'),
    path('payroll/update-adjustments/', views.update_payroll_adjustments, name='update_payroll_adjustments'),
    path('payroll/update-status/', views.update_payroll_status, name='update_payroll_status'),
    path('payroll/by-staff/', views.get_payroll_by_staff, name='get_payroll_by_staff'),
    path('payroll/ranking/', views.get_staff_attendance_ranking, name='get_staff_attendance_ranking'),
    path('payroll/ytd/', views.get_ytd_payroll, name='get_ytd_payroll'),

    # ------------------------------
    #   NEW: Payment Transaction APIs
    # ------------------------------
    path('payment-history/', views.get_all_payment_transactions, name='get_payment_history'),
    path('payment-transaction/', views.create_payment_transaction, name='create_payment_transaction'),

    # ------------------------------
    #   NEW: Staff Holiday Calendar APIs
    # ------------------------------
    path('holiday-calendar/', views.holiday_list, name='holiday_list'),
    path('holiday-calendar/<str:holiday_id>/', views.holiday_detail, name='holiday_detail'),

    # ------------------------------
    #   NEW: Staff Leave Balance APIs
    # ------------------------------
    path('staff-leave-balance/', views.staff_leave_balance_list, name='staff_leave_balance_list'),
    path('staff-leave-balance/<str:balance_id>/', views.staff_leave_balance_detail, name='staff_leave_balance_detail'),

    # ------------------------------
    #   NEW: Staff Loan APIs
    # ------------------------------
    path('staff-loans/', views.staff_loan_list, name='staff_loan_list'),
    path('staff-loans/<str:loan_id>/', views.staff_loan_detail, name='staff_loan_detail'),

    # ------------------------------
    #   Branch Management APIs
    # ------------------------------
    path('branches/', views.get_branches, name='get_branches'),
    path('branches/create/', views.create_branch, name='create_branch'),
    path('branches/<str:branch_id>/update/', views.update_branch, name='update_branch'),
    path('branches/<str:branch_id>/delete/', views.delete_branch, name='delete_branch'),

    # ------------------------------
    #   Job Types APIs
    # ------------------------------
    path('job-types/', views.job_type_list, name='job_type_list'),
    path('job-types/<str:job_type_id>/delete/', views.job_type_detail, name='job_type_detail'),

    # ------------------------------
    #   Expired / Scrap Items APIs
    # ------------------------------
    path('expired-items/', views.expired_item_list, name='expired_item_list'),
    path('expired-items/<str:item_id>/', views.expired_item_detail, name='expired_item_detail'),

    # ------------------------------
    #   Promotions APIs
    # ------------------------------
    path('promotions/', views.promotion_list, name='promotion_list'),
    path('promotions/create/', views.create_promotion, name='create_promotion'),
    path('promotions/<str:promo_id>/delete/', views.delete_promotion, name='delete_promotion'),

    # ------------------------------
    #   Site Settings APIs
    # ------------------------------
    path('site-settings/', views.get_site_settings, name='get_site_settings'),
    path('site-settings/update/', views.update_site_settings, name='update_site_settings'),

    # ------------------------------
    #   Inventory/Financial Transaction APIs
    # ------------------------------
    path('inventory-transactions/', views.get_inventory_transactions, name='get_inventory_transactions'),
    path('inventory-transactions/create/', views.create_inventory_transaction, name='create_inventory_transaction'),
    path('inventory-transactions/<str:trans_id>/update/', views.update_inventory_transaction, name='update_inventory_transaction'),
    path('inventory-transactions/<str:trans_id>/delete/', views.delete_inventory_transaction, name='delete_inventory_transaction'),

]

# ✅ Serve media files in both development and production
# For production, use a proper web server (nginx) in front of Django
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
