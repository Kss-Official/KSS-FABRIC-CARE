import datetime
import re
from django.utils import timezone
from rest_framework import serializers
from .models import (
    ServiceCategory, Service, Order, OrderItem,
    PickupRecord, LaundryHandoverRecord, LaundryStageLog, DeliveryRecord,
    Invoice, Notification, SupportTicket, ContentFAQ, ContentPolicy,
    ComplaintReport
)
from apps.users.serializers import UserSerializer

def parse_flexible_date(val):
    if not val:
        return timezone.localdate()
    if isinstance(val, datetime.date):
        return val
    s = str(val).strip()
    try:
        return datetime.datetime.strptime(s, '%Y-%m-%d').date()
    except Exception:
        pass
    lower = s.lower()
    if 'today' in lower:
        return timezone.localdate()
    if 'tomorrow' in lower:
        return timezone.localdate() + datetime.timedelta(days=1)
    months = {'jan':1, 'feb':2, 'mar':3, 'apr':4, 'may':5, 'jun':6, 'jul':7, 'aug':8, 'sep':9, 'oct':10, 'nov':11, 'dec':12}
    m = re.search(r'(\d{1,2})[\s-]+([A-Za-z]{3,9})(?:[\s-]+(\d{4}))?', s)
    if m:
        day = int(m.group(1))
        mon_str = m.group(2)[:3].lower()
        month = months.get(mon_str, timezone.localdate().month)
        year = int(m.group(3)) if m.group(3) else timezone.localdate().year
        try:
            return datetime.date(year, month, day)
        except ValueError:
            pass
    return timezone.localdate()


class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = '__all__'


class ServiceSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Service
        fields = '__all__'


class OrderItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='service_name', read_only=True)

    class Meta:
        model = OrderItem
        fields = ('id', 'order', 'service_name', 'item_name', 'category_name', 'quantity', 'unit_price', 'total_price')
        read_only_fields = ('order',)


class PickupRecordSerializer(serializers.ModelSerializer):
    driver_name = serializers.CharField(source='driver.full_name', read_only=True)
    bags_count = serializers.IntegerField(source='collected_bags_count', read_only=True)
    weight_kg = serializers.DecimalField(source='collected_weight_kg', max_digits=6, decimal_places=2, read_only=True)
    notes = serializers.CharField(source='pickup_notes', read_only=True)

    class Meta:
        model = PickupRecord
        fields = '__all__'
        read_only_fields = ('order', 'driver', 'collected_at')


class LaundryHandoverRecordSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='laundry_staff.full_name', read_only=True)
    received_bags = serializers.IntegerField(source='received_bags_count', read_only=True)
    received_weight = serializers.DecimalField(source='received_weight_kg', max_digits=6, decimal_places=2, read_only=True)
    has_discrepancy = serializers.BooleanField(source='discrepancy_found', read_only=True)
    discrepancy_notes = serializers.CharField(source='discrepancy_details', read_only=True)

    class Meta:
        model = LaundryHandoverRecord
        fields = '__all__'
        read_only_fields = ('order', 'laundry_staff', 'received_at')


class LaundryStageLogSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.full_name', read_only=True)

    class Meta:
        model = LaundryStageLog
        fields = '__all__'
        read_only_fields = ('order', 'staff', 'created_at')


class DeliveryRecordSerializer(serializers.ModelSerializer):
    driver_name = serializers.CharField(source='driver.full_name', read_only=True)
    received_by = serializers.CharField(source='recipient_name', read_only=True)
    notes = serializers.CharField(source='delivery_notes', read_only=True)

    class Meta:
        model = DeliveryRecord
        fields = '__all__'
        read_only_fields = ('order', 'driver', 'created_at')


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ('order', 'invoice_number', 'created_at')


from django.db.models import Q

class OrderSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order_id', read_only=True)
    customer_name = serializers.CharField(source='pickup_full_name', read_only=True)
    customer_phone = serializers.CharField(source='pickup_phone', read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    pickup_record = PickupRecordSerializer(read_only=True)
    laundry_record = LaundryHandoverRecordSerializer(read_only=True)
    stage_logs = LaundryStageLogSerializer(many=True, read_only=True)
    delivery_record = DeliveryRecordSerializer(read_only=True)
    invoice = InvoiceSerializer(read_only=True)

    assigned_pickup_driver_detail = UserSerializer(source='assigned_pickup_driver', read_only=True)
    assigned_delivery_driver_detail = UserSerializer(source='assigned_delivery_driver', read_only=True)
    assigned_laundry_staff_detail = UserSerializer(source='assigned_laundry_staff', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    rescheduled_date = serializers.SerializerMethodField()
    rescheduled_time_slot = serializers.SerializerMethodField()
    is_rescheduled = serializers.SerializerMethodField()

    def get_complaint(self, obj):
        if not hasattr(obj, '_cached_complaint'):
            obj._cached_complaint = ComplaintReport.objects.filter(
                Q(order=obj) | Q(order_id_display=obj.order_id)
            ).order_by('-report_date').first()
        return obj._cached_complaint

    def get_rescheduled_date(self, obj):
        c = self.get_complaint(obj)
        if c and c.rescheduled_date:
            return c.rescheduled_date.strftime('%Y-%m-%d')
        if obj.delivery_date:
            return obj.delivery_date.strftime('%Y-%m-%d')
        return None

    def get_rescheduled_time_slot(self, obj):
        c = self.get_complaint(obj)
        if c and c.rescheduled_time_slot:
            return c.rescheduled_time_slot
        return obj.delivery_time_slot or None

    def get_is_rescheduled(self, obj):
        c = self.get_complaint(obj)
        if c and (c.status == ComplaintReport.Status.RESCHEDULED or c.rescheduled_date):
            return True
        return False

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ('order_id', 'customer', 'created_at', 'updated_at')


class OrderCreateSerializer(serializers.ModelSerializer):
    services_list = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )
    items = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False
    )
    pickup_full_name = serializers.CharField(required=False, allow_blank=True)
    pickup_phone = serializers.CharField(required=False, allow_blank=True)
    pickup_address = serializers.CharField(required=False, allow_blank=True)
    pickup_city = serializers.CharField(required=False, allow_blank=True, default='Bengaluru')
    pickup_pincode = serializers.CharField(required=False, allow_blank=True, default='560043')
    pickup_date = serializers.CharField(required=False, allow_blank=True)
    pickup_time_slot = serializers.CharField(required=False, allow_blank=True, default='9:00 AM – 11:00 AM')
    delivery_date = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    address_id = serializers.CharField(required=False, write_only=True, allow_null=True)
    pickup_slot = serializers.DictField(required=False, write_only=True)
    is_express = serializers.BooleanField(required=False, write_only=True, default=False)
    notes = serializers.CharField(required=False, write_only=True, allow_blank=True)

    def validate_pickup_date(self, value):
        return parse_flexible_date(value)

    def validate_delivery_date(self, value):
        if not value:
            return None
        return parse_flexible_date(value)

    class Meta:
        model = Order
        fields = (
            'id', 'order_id', 'pickup_full_name', 'pickup_phone',
            'pickup_address', 'pickup_city', 'pickup_pincode', 'pickup_date', 'pickup_time_slot',
            'special_instructions', 'delivery_address', 'delivery_date', 'delivery_time_slot',
            'payment_method', 'total_amount', 'services_list', 'items',
            'address_id', 'pickup_slot', 'is_express', 'notes'
        )
        read_only_fields = ('id', 'order_id')

    def create(self, validated_data):
        services_list = validated_data.pop('services_list', [])
        items_payload = validated_data.pop('items', [])
        address_id = validated_data.pop('address_id', None)
        pickup_slot = validated_data.pop('pickup_slot', None)
        is_express = validated_data.pop('is_express', False)
        notes = validated_data.pop('notes', None)

        if notes and not validated_data.get('special_instructions'):
            validated_data['special_instructions'] = notes

        if pickup_slot and isinstance(pickup_slot, dict):
            if pickup_slot.get('date') and not validated_data.get('pickup_date'):
                validated_data['pickup_date'] = parse_flexible_date(pickup_slot.get('date'))
            if pickup_slot.get('from') and pickup_slot.get('to') and not validated_data.get('pickup_time_slot'):
                validated_data['pickup_time_slot'] = f"{pickup_slot.get('from')} – {pickup_slot.get('to')}"

        req = self.context.get('request')
        user = getattr(req, 'user', None) if req else None
        if not user or not getattr(user, 'is_authenticated', False):
            from apps.users.models import User
            cust_email = ''
            if req and hasattr(req, 'data'):
                cust_email = (req.data.get('customerEmail') or req.data.get('customer_email') or req.data.get('email') or '').strip().lower()
            if not cust_email:
                cust_email = (validated_data.get('customer_email') or '').strip().lower()

            if cust_email:
                user = User.objects.filter(email__iexact=cust_email).first()
                if not user:
                    c_name = (req.data.get('customerName') or req.data.get('pickup_full_name') or 'Customer').strip()
                    c_phone = (req.data.get('customerPhone') or req.data.get('pickup_phone') or '').strip()
                    user = User.objects.create(
                        email=cust_email,
                        username=cust_email,
                        full_name=c_name,
                        phone=c_phone,
                        role=User.Role.CUSTOMER
                    )
            else:
                user = None

        if not validated_data.get('pickup_date'):
            validated_data['pickup_date'] = parse_flexible_date(None)

        # Populate defaults from user if missing
        if not validated_data.get('pickup_full_name'):
            validated_data['pickup_full_name'] = getattr(user, 'full_name', '') or getattr(user, 'username', '') or 'Valued Customer'
        if not validated_data.get('pickup_phone'):
            validated_data['pickup_phone'] = getattr(user, 'phone', '')
        if not validated_data.get('pickup_address'):
            validated_data['pickup_address'] = getattr(user, 'address', '')
        if not validated_data.get('pickup_city'):
            validated_data['pickup_city'] = getattr(user, 'city', '') or 'Bengaluru'
        if not validated_data.get('pickup_pincode'):
            validated_data['pickup_pincode'] = getattr(user, 'pincode', '') or '560043'
        if not validated_data.get('delivery_address'):
            validated_data['delivery_address'] = validated_data.get('pickup_address', '')

        # Calculate total and process items with duplicate wash waiver logic
        calculated_total = 0.0
        processed_items = []
        if items_payload:
            wash_counts = {}
            for it in items_payload:
                c_name = str(it.get('service_category') or it.get('category_name') or '').lower()
                s_name = str(it.get('item_name') or it.get('service_name') or '').strip().lower()
                if 'fold' in c_name or 'express' in c_name:
                    wash_counts[s_name] = wash_counts.get(s_name, 0) + int(it.get('quantity') or 1)

            iron_applied = {}
            for it in items_payload:
                s_name = it.get('item_name') or it.get('service_name') or it.get('garment_type_id') or 'Laundry Service'
                s_name_norm = str(s_name).strip().lower()
                c_name = it.get('service_category') or it.get('category_name') or (it.get('service_ids') and it.get('service_ids')[0]) or 'General Care'
                c_name_norm = str(c_name).lower()
                qty = int(it.get('quantity') or 1)
                u_price = float(it.get('unit_price') or 100.0)

                is_wash_iron = 'iron' in c_name_norm and ('wash' in c_name_norm or 'iron' in c_name_norm)
                wash_available = wash_counts.get(s_name_norm, 0) - iron_applied.get(s_name_norm, 0)

                if it.get('total_price') is not None:
                    t_price = float(it.get('total_price'))
                    eff_u_price = u_price
                elif is_wash_iron and wash_available > 0:
                    discounted_qty = min(qty, wash_available)
                    iron_applied[s_name_norm] = iron_applied.get(s_name_norm, 0) + discounted_qty
                    ironing_rate = round(u_price / 2.0)
                    rem_qty = qty - discounted_qty
                    t_price = (discounted_qty * ironing_rate) + (rem_qty * u_price)
                    eff_u_price = round(t_price / qty, 2)
                else:
                    t_price = float(u_price * qty)
                    eff_u_price = u_price

                calculated_total += t_price
                processed_items.append({
                    'service_name': s_name,
                    'category_name': c_name,
                    'quantity': qty,
                    'unit_price': eff_u_price,
                    'total_price': t_price
                })
        
        total_amount = float(validated_data.get('total_amount') or calculated_total or 300.00)
        validated_data['total_amount'] = total_amount

        order = Order.objects.create(
            customer=user,
            status=Order.Status.PENDING_REVIEW,
            subtotal=total_amount,
            **validated_data
        )

        # Create order items from processed payload or services_list
        if processed_items:
            for item_dict in processed_items:
                OrderItem.objects.create(
                    order=order,
                    service_name=item_dict['service_name'],
                    category_name=item_dict['category_name'],
                    quantity=item_dict['quantity'],
                    unit_price=item_dict['unit_price'],
                    total_price=item_dict['total_price']
                )
        elif services_list:
            for item_name in services_list:
                service_obj = Service.objects.filter(name__iexact=item_name).first()
                unit_price = service_obj.price if service_obj else 120.00
                OrderItem.objects.create(
                    order=order,
                    service_name=service_obj.name if service_obj else item_name,
                    category_name=service_obj.category.name if service_obj else 'General',
                    quantity=1,
                    unit_price=unit_price,
                    total_price=unit_price
                )
        else:
            # Default laundry item
            OrderItem.objects.create(
                order=order,
                service_name='Express Laundry Wash & Fold',
                category_name='Wash & Fold',
                quantity=1,
                unit_price=total_amount,
                total_price=total_amount
            )

        # Create Invoice
        Invoice.objects.create(
            order=order,
            subtotal=total_amount,
            total_payable=total_amount,
            payment_status=order.payment_status,
            payment_method=order.payment_method
        )

        # Create notification for customer
        Notification.objects.create(
            user=user,
            order=order,
            title="Order Placed Successfully",
            message=f"Your booking {order.order_id} has been received. Our team will review and assign pickup shortly.",
            type=Notification.Type.ORDER_UPDATE
        )

        return order



class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('user', 'created_at')


class SupportTicketSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    ticket_id_display = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.SerializerMethodField()
    formatted_created_at = serializers.SerializerMethodField()
    formatted_admin_reply_at = serializers.SerializerMethodField()

    order = serializers.PrimaryKeyRelatedField(queryset=Order.objects.all(), required=False, allow_null=True)

    class Meta:
        model = SupportTicket
        fields = '__all__'
        read_only_fields = ('customer', 'created_at', 'updated_at')

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'order' in data:
            val = data.get('order')
            if isinstance(val, str) and not val.isdigit():
                order_obj = Order.objects.filter(order_number__iexact=val).first()
                data['order'] = order_obj.id if order_obj else None
            elif not val:
                data['order'] = None
        return super().to_internal_value(data)

    def get_ticket_id_display(self, obj):
        if obj.ticket_number:
            return obj.ticket_number
        return f"#SUP-{1040 + obj.id}"

    def get_customer_name(self, obj):
        if obj.customer_name:
            return obj.customer_name
        if obj.customer:
            return obj.customer.full_name or obj.customer.username
        return "Customer"

    def get_customer_email(self, obj):
        if obj.customer_email:
            return obj.customer_email
        if obj.customer:
            return obj.customer.email
        return ""

    def get_formatted_created_at(self, obj):
        if not obj.created_at:
            return ""
        return obj.created_at.strftime("%d %b %Y %I:%M %p")

    def get_formatted_admin_reply_at(self, obj):
        if not obj.admin_reply_at:
            return ""
        return obj.admin_reply_at.strftime("%d %b %Y %I:%M %p")



class ContentFAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentFAQ
        fields = '__all__'


class ContentPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentPolicy
        fields = '__all__'


class ComplaintReportSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    order_id = serializers.SerializerMethodField()
    order_details = serializers.SerializerMethodField()
    formatted_report_date = serializers.SerializerMethodField()
    report_date_only = serializers.SerializerMethodField()
    formatted_reschedule_date = serializers.SerializerMethodField()
    original_schedule = serializers.SerializerMethodField()
    new_delivery_date_formatted = serializers.SerializerMethodField()
    timeline = serializers.SerializerMethodField()
    customer_email = serializers.SerializerMethodField()
    customer_id = serializers.SerializerMethodField()

    class Meta:
        model = ComplaintReport
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def get_customer_email(self, obj):
        if obj.order and obj.order.customer and obj.order.customer.email:
            return obj.order.customer.email
        return 'rohan.mehta@gmail.com'

    def get_customer_id(self, obj):
        if obj.order and obj.order.customer:
            return str(obj.order.customer.id)
        return '2'

    def get_order_id(self, obj):
        if obj.order_id_display:
            return obj.order_id_display
        if obj.order:
            return obj.order.order_id
        return f"#FC{obj.id}"

    def get_order_details(self, obj):
        if not obj.order:
            return None
        return {
            'id': obj.order.id,
            'order_id': obj.order.order_id,
            'status': obj.order.status,
            'delivery_address': obj.order.delivery_address or obj.order.pickup_address,
            'delivery_date': str(obj.order.delivery_date) if obj.order.delivery_date else None,
            'delivery_time_slot': obj.order.delivery_time_slot,
            'total_amount': str(obj.order.total_amount),
        }

    def get_formatted_report_date(self, obj):
        if not obj.report_date:
            return ""
        return obj.report_date.strftime("%d %b %Y, %I:%M %p")

    def get_report_date_only(self, obj):
        if not obj.report_date:
            return ""
        return obj.report_date.strftime("%d %b %Y")

    def get_formatted_reschedule_date(self, obj):
        if obj.rescheduled_date:
            time_part = f" ({obj.rescheduled_time_slot})" if obj.rescheduled_time_slot else " (Rescheduled)"
            return f"{obj.rescheduled_date.strftime('%d %b %Y')}{time_part}"
        if obj.requested_reschedule_date:
            return f"{obj.requested_reschedule_date.strftime('%d %b %Y')} (Requested)"
        return "—"

    def get_new_delivery_date_formatted(self, obj):
        if obj.rescheduled_date:
            return obj.rescheduled_date.strftime('%d %b %Y')
        return None

    def get_original_schedule(self, obj):
        if obj.order and obj.order.pickup_date:
            time_slot = obj.order.pickup_time_slot or "09:00 AM - 11:00 AM"
            return f"{obj.order.pickup_date.strftime('%d %b %Y')}, {time_slot}"
        if obj.report_date:
            return f"{obj.report_date.strftime('%d %b %Y')}, 09:00 AM - 11:00 AM"
        return "16 Oct 2025, 09:00 AM - 11:00 AM"

    def get_timeline(self, obj):
        events = []
        if obj.report_date:
            events.append({
                'title': 'Complaint reported by delivery staff',
                'description': f"Reason: {obj.failure_reason}",
                'time': obj.report_date.strftime("%d %b %Y, %I:%M %p"),
                'status': 'reported'
            })
            step2_time = obj.report_date + datetime.timedelta(minutes=46)
            events.append({
                'title': 'Reschedule requested by admin',
                'description': 'Reschedule request queued for processing',
                'time': step2_time.strftime("%d %b %Y, %I:%M %p"),
                'status': 'review'
            })
        if obj.rescheduled_date:
            step3_time = obj.updated_at if obj.updated_at else (obj.report_date + datetime.timedelta(days=1, hours=2) if obj.report_date else timezone.now())
            events.append({
                'title': 'Delivery rescheduled',
                'description': f"New delivery date set to {obj.rescheduled_date.strftime('%d %b %Y')} ({obj.rescheduled_time_slot or 'Standard Slot'})",
                'time': step3_time.strftime("%d %b %Y, %I:%M %p"),
                'status': 'rescheduled'
            })
        if obj.status in [ComplaintReport.Status.DELIVERED, ComplaintReport.Status.RESOLVED]:
            step4_time = obj.updated_at if obj.updated_at else timezone.now()
            events.append({
                'title': 'Delivery completed successfully',
                'description': 'Order delivered and closed',
                'time': step4_time.strftime("%d %b %Y, %I:%M %p"),
                'status': 'resolved'
            })
        return events


