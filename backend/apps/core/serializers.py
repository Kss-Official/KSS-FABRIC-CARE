from rest_framework import serializers
from .models import (
    ServiceCategory, Service, Order, OrderItem,
    PickupRecord, LaundryHandoverRecord, LaundryStageLog, DeliveryRecord,
    Invoice, Notification, SupportTicket, ContentFAQ, ContentPolicy
)
from apps.users.serializers import UserSerializer

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
    class Meta:
        model = OrderItem
        fields = '__all__'
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

    class Meta:
        model = Order
        fields = (
            'id', 'order_id', 'pickup_full_name', 'pickup_phone',
            'pickup_address', 'pickup_city', 'pickup_pincode', 'pickup_date', 'pickup_time_slot',
            'special_instructions', 'delivery_address', 'delivery_date', 'delivery_time_slot',
            'payment_method', 'total_amount', 'services_list', 'items'
        )
        read_only_fields = ('id', 'order_id')

    def create(self, validated_data):
        services_list = validated_data.pop('services_list', [])
        items_payload = validated_data.pop('items', [])
        user = self.context['request'].user
        
        # Populate defaults from user if missing
        if not validated_data.get('pickup_full_name'):
            validated_data['pickup_full_name'] = getattr(user, 'full_name', '') or user.get_full_name() or user.username
        if not validated_data.get('pickup_phone'):
            validated_data['pickup_phone'] = getattr(user, 'phone', '') or '+91 98765 43210'
        if not validated_data.get('pickup_address'):
            validated_data['pickup_address'] = getattr(user, 'address', '') or 'Banaswadi, Bengaluru - 560043'
        if not validated_data.get('pickup_city'):
            validated_data['pickup_city'] = getattr(user, 'city', '') or 'Bengaluru'
        if not validated_data.get('pickup_pincode'):
            validated_data['pickup_pincode'] = getattr(user, 'pincode', '') or '560043'
        if not validated_data.get('delivery_address'):
            validated_data['delivery_address'] = validated_data['pickup_address']

        # Calculate total if not set
        calculated_total = 0.0
        if items_payload:
            for it in items_payload:
                qty = it.get('quantity', 1)
                rate = float(it.get('unit_price', 100))
                calculated_total += (rate * qty)
        
        total_amount = float(validated_data.get('total_amount') or calculated_total or 300.00)
        validated_data['total_amount'] = total_amount

        order = Order.objects.create(
            customer=user,
            status=Order.Status.PENDING_REVIEW,
            subtotal=total_amount,
            **validated_data
        )

        # Create order items from payload or services_list
        if items_payload:
            for it in items_payload:
                OrderItem.objects.create(
                    order=order,
                    service_name=it.get('item_name', 'Laundry Service'),
                    category_name=it.get('service_category', 'General Care'),
                    quantity=it.get('quantity', 1),
                    unit_price=it.get('unit_price', 100.00),
                    total_price=it.get('total_price', float(it.get('unit_price', 100)) * it.get('quantity', 1))
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

    class Meta:
        model = SupportTicket
        fields = '__all__'
        read_only_fields = ('customer', 'created_at', 'updated_at')


class ContentFAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentFAQ
        fields = '__all__'


class ContentPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentPolicy
        fields = '__all__'
