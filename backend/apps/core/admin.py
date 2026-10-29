from django.contrib import admin
from .models import (
    ServiceCategory, Service, Order, OrderItem,
    PickupRecord, LaundryHandoverRecord, LaundryStageLog, DeliveryRecord,
    Invoice, Notification, SupportTicket, ContentFAQ, ContentPolicy,
    ComplaintReport
)

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

class LaundryStageLogInline(admin.TabularInline):
    model = LaundryStageLog
    extra = 0
    readonly_fields = ('created_at',)

@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'display_order', 'is_active')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'unit', 'turnaround_time', 'is_active')
    list_filter = ('category', 'is_active')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_id', 'customer', 'pickup_full_name', 'status', 'payment_status', 'total_amount', 'pickup_date', 'created_at')
    list_filter = ('status', 'payment_status', 'payment_method')
    search_fields = ('order_id', 'pickup_full_name', 'pickup_phone')
    inlines = [OrderItemInline, LaundryStageLogInline]

@admin.register(PickupRecord)
class PickupRecordAdmin(admin.ModelAdmin):
    list_display = ('order', 'driver', 'collected_bags_count', 'collected_weight_kg', 'collected_at')

@admin.register(LaundryHandoverRecord)
class LaundryHandoverRecordAdmin(admin.ModelAdmin):
    list_display = ('order', 'laundry_staff', 'received_bags_count', 'discrepancy_found', 'received_at')

@admin.register(DeliveryRecord)
class DeliveryRecordAdmin(admin.ModelAdmin):
    list_display = ('order', 'driver', 'recipient_name', 'status', 'delivered_at')

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'order', 'total_payable', 'payment_status', 'paid_at')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'type', 'is_read', 'created_at')
    list_filter = ('type', 'is_read', 'created_at')

@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'subject', 'status', 'created_at')
    list_filter = ('status', 'created_at')

@admin.register(ContentFAQ)
class ContentFAQAdmin(admin.ModelAdmin):
    list_display = ('question', 'category', 'display_order', 'is_active')

@admin.register(ContentPolicy)
class ContentPolicyAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'updated_at')


@admin.register(ComplaintReport)
class ComplaintReportAdmin(admin.ModelAdmin):
    list_display = ('order_id_display', 'customer_name', 'failure_reason', 'reported_by_name', 'report_date', 'rescheduled_date', 'status')
    list_filter = ('status', 'failure_reason', 'report_date')
    search_fields = ('order_id_display', 'customer_name', 'failure_reason', 'reported_by_name')

