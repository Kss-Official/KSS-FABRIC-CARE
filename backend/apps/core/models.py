import uuid
import random
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

class ServiceCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Service Categories'
        ordering = ['display_order', 'name']

    def __str__(self):
        return self.name


class Service(models.Model):
    name = models.CharField(max_length=150)
    category = models.ForeignKey(ServiceCategory, on_delete=models.CASCADE, related_name='services')
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50, default='per piece')
    turnaround_time = models.CharField(max_length=100, default='1-2 days')
    icon = models.CharField(max_length=50, default='shirt')
    image_url = models.CharField(max_length=500, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.name} ({self.category.name}) - ₹{self.price} {self.unit}"


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING_REVIEW = 'PENDING_REVIEW', _('Booking Received')
        ACCEPTED = 'ACCEPTED', _('Booking Confirmed')
        PICKUP_ASSIGNED = 'PICKUP_ASSIGNED', _('Pickup Driver Assigned')
        PICKUP_IN_PROGRESS = 'PICKUP_IN_PROGRESS', _('Driver Out for Pickup')
        PICKED_UP = 'PICKED_UP', _('Clothes Collected')
        DROPPED_OFF_AT_LAUNDRY = 'DROPPED_OFF_AT_LAUNDRY', _('Dropped Off at Laundry')
        RECEIVED_BY_LAUNDRY = 'RECEIVED_BY_LAUNDRY', _('Received & Verified by Laundry')
        INSPECTION = 'INSPECTION', _('Clothes Inspection')
        WASHING = 'WASHING', _('Washing in Progress')
        DRYING = 'DRYING', _('Drying in Progress')
        IRONING = 'IRONING', _('Steam Ironing in Progress')
        FOLDING = 'FOLDING', _('Folding Clothes')
        QUALITY_CHECK = 'QUALITY_CHECK', _('Quality Inspection')
        PACKING = 'PACKING', _('Packing Clothes')
        READY_FOR_DELIVERY = 'READY_FOR_DELIVERY', _('Ready for Delivery')
        OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY', _('Out for Delivery')
        DELIVERED = 'DELIVERED', _('Delivered')
        FAILED_DELIVERY = 'FAILED_DELIVERY', _('Delivery Failed')
        CANCELLED = 'CANCELLED', _('Cancelled')

    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', _('Pending')
        PAID = 'PAID', _('Paid')
        FAILED = 'FAILED', _('Failed')
        REFUNDED = 'REFUNDED', _('Refunded')

    class PaymentMethod(models.TextChoices):
        CASH_ON_DELIVERY = 'CASH_ON_DELIVERY', _('Cash on Delivery')
        UPI = 'UPI', _('UPI / QR Code')
        CARD = 'CARD', _('Credit / Debit Card')
        NET_BANKING = 'NET_BANKING', _('Net Banking')

    order_id = models.CharField(max_length=50, unique=True, db_index=True)
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING_REVIEW, db_index=True)

    assigned_pickup_driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_pickups'
    )
    assigned_delivery_driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_deliveries'
    )
    assigned_laundry_staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_laundry_tasks'
    )

    pickup_full_name = models.CharField(max_length=150)
    pickup_phone = models.CharField(max_length=20)
    pickup_address = models.TextField()
    pickup_city = models.CharField(max_length=100, default='Bengaluru')
    pickup_pincode = models.CharField(max_length=20)
    pickup_date = models.DateField()
    pickup_time_slot = models.CharField(max_length=100)
    special_instructions = models.TextField(blank=True, null=True)

    delivery_address = models.TextField(blank=True, null=True)
    delivery_date = models.DateField(blank=True, null=True)
    delivery_time_slot = models.CharField(max_length=100, blank=True, null=True)

    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    pickup_delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    payment_method = models.CharField(max_length=30, choices=PaymentMethod.choices, default=PaymentMethod.CASH_ON_DELIVERY)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.order_id:
            random_code = f"{random.randint(10000, 99999)}"
            self.order_id = f"FC-{random_code}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.order_id} - {self.pickup_full_name} ({self.get_status_display()})"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    service_name = models.CharField(max_length=150)
    category_name = models.CharField(max_length=100, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.service_name} x {self.quantity} for {self.order.order_id}"


class PickupRecord(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='pickup_record')
    driver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='pickup_records')
    collected_bags_count = models.PositiveIntegerField(default=1)
    collected_items_count = models.PositiveIntegerField(default=0)
    collected_weight_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    pickup_notes = models.TextField(blank=True, null=True)
    pickup_proof_url = models.CharField(max_length=500, blank=True, null=True)
    collected_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Pickup for {self.order.order_id} by {self.driver.full_name}"


class LaundryHandoverRecord(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='laundry_record')
    laundry_staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='laundry_records')
    received_bags_count = models.PositiveIntegerField(default=1)
    received_items_count = models.PositiveIntegerField(default=0)
    received_weight_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    discrepancy_found = models.BooleanField(default=False)
    discrepancy_details = models.TextField(blank=True, null=True)
    inspection_notes = models.TextField(blank=True, null=True)
    damaged_items_count = models.PositiveIntegerField(default=0)
    stain_notes = models.TextField(blank=True, null=True)
    received_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Laundry receipt for {self.order.order_id}"


class LaundryStageLog(models.Model):
    class Stage(models.TextChoices):
        WASHING = 'WASHING', _('Washing')
        DRYING = 'DRYING', _('Drying')
        IRONING = 'IRONING', _('Steam Ironing')
        FOLDING = 'FOLDING', _('Folding')
        QUALITY_CHECK = 'QUALITY_CHECK', _('Quality Check')
        PACKING = 'PACKING', _('Packing')
        READY_FOR_DELIVERY = 'READY_FOR_DELIVERY', _('Ready for Delivery')

    class Status(models.TextChoices):
        IN_PROGRESS = 'IN_PROGRESS', _('In Progress')
        PASSED = 'PASSED', _('Passed / Completed')
        FAILED = 'FAILED', _('Failed QC / Redo Required')

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='stage_logs')
    staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    stage = models.CharField(max_length=30, choices=Stage.choices)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.IN_PROGRESS)
    notes = models.TextField(blank=True, null=True)
    failure_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.order.order_id}: {self.stage} ({self.status})"


class DeliveryRecord(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', _('Pending')
        DELIVERED = 'DELIVERED', _('Delivered')
        FAILED = 'FAILED', _('Failed')

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='delivery_record')
    driver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='delivery_records')
    recipient_name = models.CharField(max_length=150, blank=True, null=True)
    delivery_notes = models.TextField(blank=True, null=True)
    failed_reason = models.TextField(blank=True, null=True)
    delivery_proof_url = models.CharField(max_length=500, blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    delivered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Delivery for {self.order.order_id} ({self.status})"


class Invoice(models.Model):
    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', _('Pending')
        PAID = 'PAID', _('Paid')
        FAILED = 'FAILED', _('Failed')
        REFUNDED = 'REFUNDED', _('Refunded')

    class PaymentMethod(models.TextChoices):
        CASH_ON_DELIVERY = 'CASH_ON_DELIVERY', _('Cash on Delivery')
        UPI = 'UPI', _('UPI / QR Code')
        CARD = 'CARD', _('Credit / Debit Card')
        NET_BANKING = 'NET_BANKING', _('Net Banking')

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='invoice')
    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_payable = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    payment_method = models.CharField(max_length=30, choices=PaymentMethod.choices, default=PaymentMethod.CASH_ON_DELIVERY)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            random_code = uuid.uuid4().hex[:6].upper()
            self.invoice_number = f"INV-{random_code}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.invoice_number} for {self.order.order_id}"


class Notification(models.Model):
    class Type(models.TextChoices):
        ORDER_UPDATE = 'ORDER_UPDATE', _('Order Update')
        PICKUP = 'PICKUP', _('Pickup')
        DELIVERY = 'DELIVERY', _('Delivery')
        SYSTEM = 'SYSTEM', _('System Announcement')
        PAYMENT = 'PAYMENT', _('Payment')

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=200)
    message = models.TextField()
    type = models.CharField(max_length=30, choices=Type.choices, default=Type.ORDER_UPDATE)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username}: {self.title}"


class SupportTicket(models.Model):
    class Status(models.TextChoices):
        OPEN = 'OPEN', _('Open')
        IN_PROGRESS = 'IN_PROGRESS', _('In Progress')
        RESOLVED = 'RESOLVED', _('Resolved')
        CLOSED = 'CLOSED', _('Closed')

    class Priority(models.TextChoices):
        LOW = 'LOW', _('Low')
        MEDIUM = 'MEDIUM', _('Medium')
        HIGH = 'HIGH', _('High')

    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='support_tickets')
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True)
    ticket_number = models.CharField(max_length=50, blank=True, null=True, unique=True)
    customer_name = models.CharField(max_length=200, blank=True, null=True)
    customer_email = models.EmailField(blank=True, null=True)
    subject = models.CharField(max_length=200)
    message = models.TextField()
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    admin_reply = models.TextField(blank=True, null=True)
    admin_reply_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.customer_name and self.customer:
            self.customer_name = self.customer.full_name or self.customer.username
        if not self.customer_email and self.customer:
            self.customer_email = self.customer.email
        super().save(*args, **kwargs)
        if not self.ticket_number:
            self.ticket_number = f"#SUP-{1040 + self.id}"
            super().save(update_fields=['ticket_number'])

    def __str__(self):
        return f"{self.ticket_number or f'Ticket #{self.id}'}: {self.subject} ({self.get_status_display()})"



class ContentFAQ(models.Model):
    question = models.CharField(max_length=300)
    answer = models.TextField()
    category = models.CharField(max_length=100, default='General')
    display_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['display_order', 'id']

    def __str__(self):
        return self.question


class ContentPolicy(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    content = models.TextField()
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class ComplaintReport(models.Model):
    class Status(models.TextChoices):
        PENDING_RESCHEDULE = 'PENDING_RESCHEDULE', _('Pending Reschedule')
        RESCHEDULED = 'RESCHEDULED', _('Rescheduled')
        UNDER_REVIEW = 'UNDER_REVIEW', _('Under Review')
        DELIVERED = 'DELIVERED', _('Delivered')
        RESOLVED = 'RESOLVED', _('Resolved')

    order = models.ForeignKey(Order, on_delete=models.SET_NULL, related_name='complaints', null=True, blank=True)
    order_id_display = models.CharField(max_length=50, blank=True, null=True, db_index=True)
    customer_name = models.CharField(max_length=150)
    customer_phone = models.CharField(max_length=20, blank=True, null=True)
    failure_reason = models.CharField(max_length=255)
    reported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reported_complaints')
    reported_by_name = models.CharField(max_length=150, blank=True, null=True)
    report_date = models.DateTimeField(default=timezone.now, db_index=True)
    requested_reschedule_date = models.DateField(null=True, blank=True)
    rescheduled_date = models.DateField(null=True, blank=True)
    rescheduled_time_slot = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING_RESCHEDULE, db_index=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-report_date', '-created_at']

    def __str__(self):
        order_code = self.order_id_display or (self.order.order_id if self.order else 'Order')
        return f"Complaint for {order_code} - {self.customer_name} ({self.get_status_display()})"

