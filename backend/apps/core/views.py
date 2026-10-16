from django.utils import timezone
from django.db.models import Sum, Count, Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model

from .models import (
    ServiceCategory, Service, Order, OrderItem,
    PickupRecord, LaundryHandoverRecord, LaundryStageLog, DeliveryRecord,
    Invoice, Notification, SupportTicket, ContentFAQ, ContentPolicy
)
from .serializers import (
    ServiceCategorySerializer,
    ServiceSerializer,
    OrderSerializer,
    OrderCreateSerializer,
    NotificationSerializer,
    SupportTicketSerializer,
    ContentFAQSerializer,
    ContentPolicySerializer,
    InvoiceSerializer
)

User = get_user_model()

# ===============================================================
# 1. SERVICES & CONTENT APIS
# ===============================================================

class ServiceCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ServiceCategory.objects.filter(is_active=True)
    serializer_class = ServiceCategorySerializer
    permission_classes = (permissions.AllowAny,)


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        if self.action in ['list', 'retrieve']:
            return Service.objects.filter(is_active=True)
        return Service.objects.all()


class ContentFAQViewSet(viewsets.ModelViewSet):
    queryset = ContentFAQ.objects.all()
    serializer_class = ContentFAQSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]


class ContentPolicyViewSet(viewsets.ModelViewSet):
    queryset = ContentPolicy.objects.all()
    serializer_class = ContentPolicySerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]


# ===============================================================
# 2. ORDERS API (CUSTOMER & GENERAL)
# ===============================================================

class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.ADMIN or user.is_staff:
            return Order.objects.all().prefetch_related('items', 'stage_logs').select_related(
                'customer', 'assigned_pickup_driver', 'assigned_delivery_driver', 'assigned_laundry_staff'
            )
        elif user.role == User.Role.DELIVERY_STAFF:
            return Order.objects.filter(
                Q(assigned_pickup_driver=user) |
                Q(assigned_delivery_driver=user) |
                Q(status__in=[Order.Status.ACCEPTED, Order.Status.READY_FOR_DELIVERY])
            ).prefetch_related('items', 'stage_logs')
        elif user.role == User.Role.LAUNDRY_STAFF:
            return Order.objects.filter(
                Q(assigned_laundry_staff=user) |
                Q(status__in=[
                    Order.Status.DROPPED_OFF_AT_LAUNDRY,
                    Order.Status.RECEIVED_BY_LAUNDRY,
                    Order.Status.INSPECTION,
                    Order.Status.WASHING,
                    Order.Status.DRYING,
                    Order.Status.IRONING,
                    Order.Status.QUALITY_CHECK,
                    Order.Status.PACKING
                ])
            ).prefetch_related('items', 'stage_logs')
        else:
            # Customer records strictly isolated
            return Order.objects.filter(customer=user).prefetch_related('items', 'stage_logs')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='cancel')

    def cancel_order(self, request, pk=None):
        order = self.get_object()
        if order.status not in [Order.Status.PENDING_REVIEW, Order.Status.ACCEPTED]:
            return Response(
                {'detail': 'Order cannot be cancelled once processing has started.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        order.status = Order.Status.CANCELLED
        order.save()

        Notification.objects.create(
            user=order.customer,
            order=order,
            title="Order Cancelled",
            message=f"Order {order.order_id} has been cancelled successfully.",
            type=Notification.Type.ORDER_UPDATE
        )

        return Response({'detail': 'Order cancelled successfully.', 'order': OrderSerializer(order).data})


# ===============================================================
# 3. ADMIN WORKFLOW ENDPOINTS
# ===============================================================

class AdminAcceptOrderView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        order.status = Order.Status.ACCEPTED
        order.save()

        Notification.objects.create(
            user=order.customer,
            order=order,
            title="Booking Confirmed",
            message=f"Your booking {order.order_id} has been accepted by FabriCare. We will assign a pickup agent.",
            type=Notification.Type.ORDER_UPDATE
        )

        return Response(OrderSerializer(order).data)


class AdminRejectOrderView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', 'Booking could not be accommodated at this time.')
        order.status = Order.Status.CANCELLED
        order.save()

        Notification.objects.create(
            user=order.customer,
            order=order,
            title="Booking Update",
            message=f"Booking {order.order_id} was cancelled: {reason}",
            type=Notification.Type.ORDER_UPDATE
        )

        return Response(OrderSerializer(order).data)


class AdminAssignStaffView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        pickup_driver_id = request.data.get('pickup_driver_id')
        delivery_driver_id = request.data.get('delivery_driver_id')
        laundry_staff_id = request.data.get('laundry_staff_id')

        if pickup_driver_id:
            try:
                driver = User.objects.get(pk=pickup_driver_id, role=User.Role.DELIVERY_STAFF)
                order.assigned_pickup_driver = driver
                if order.status in [Order.Status.PENDING_REVIEW, Order.Status.ACCEPTED]:
                    order.status = Order.Status.PICKUP_ASSIGNED
                Notification.objects.create(
                    user=driver,
                    order=order,
                    title="Pickup Task Assigned",
                    message=f"New pickup assigned for {order.order_id} at {order.pickup_address} ({order.pickup_time_slot}).",
                    type=Notification.Type.PICKUP
                )
            except User.DoesNotExist:
                return Response({'detail': 'Pickup driver not found.'}, status=status.HTTP_400_BAD_REQUEST)

        if delivery_driver_id:
            try:
                d_driver = User.objects.get(pk=delivery_driver_id, role=User.Role.DELIVERY_STAFF)
                order.assigned_delivery_driver = d_driver
            except User.DoesNotExist:
                pass

        if laundry_staff_id:
            try:
                l_staff = User.objects.get(pk=laundry_staff_id, role=User.Role.LAUNDRY_STAFF)
                order.assigned_laundry_staff = l_staff
            except User.DoesNotExist:
                pass

        order.save()
        return Response(OrderSerializer(order).data)


class AdminDashboardStatsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        total_orders = Order.objects.count()
        active_orders = Order.objects.exclude(status__in=[Order.Status.DELIVERED, Order.Status.CANCELLED, Order.Status.FAILED_DELIVERY]).count()
        pending_pickups = Order.objects.filter(status__in=[Order.Status.PENDING_REVIEW, Order.Status.ACCEPTED, Order.Status.PICKUP_ASSIGNED, Order.Status.PICKUP_IN_PROGRESS]).count()
        in_cleaning = Order.objects.filter(status__in=[
            Order.Status.DROPPED_OFF_AT_LAUNDRY, Order.Status.RECEIVED_BY_LAUNDRY,
            Order.Status.INSPECTION, Order.Status.WASHING, Order.Status.DRYING,
            Order.Status.IRONING, Order.Status.QUALITY_CHECK, Order.Status.PACKING
        ]).count()
        completed_orders = Order.objects.filter(status=Order.Status.DELIVERED).count()
        total_revenue = Order.objects.filter(payment_status=Order.PaymentStatus.PAID).aggregate(Sum('total_amount'))['total_amount__sum'] or 0.00
        
        recent_orders = OrderSerializer(Order.objects.all()[:8], many=True).data

        return Response({
            'total_orders': total_orders,
            'active_orders': active_orders,
            'pending_pickups': pending_pickups,
            'in_cleaning': in_cleaning,
            'completed_orders': completed_orders,
            'total_revenue': float(total_revenue),
            'recent_orders': recent_orders
        })


# ===============================================================
# 4. DELIVERY STAFF WORKFLOW ENDPOINTS
# ===============================================================

class DeliveryTasksListView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        if user.role != User.Role.DELIVERY_STAFF and user.role != User.Role.ADMIN and not user.is_staff:
            return Response({'detail': 'Access restricted to delivery agents.'}, status=status.HTTP_403_FORBIDDEN)

        pickup_filter = Q(assigned_pickup_driver=user) | Q(assigned_pickup_driver__isnull=True)
        dropoff_filter = Q(assigned_pickup_driver=user)
        delivery_filter = Q(assigned_delivery_driver=user) | Q(assigned_delivery_driver__isnull=True)
        completed_filter = Q(assigned_pickup_driver=user) | Q(assigned_delivery_driver=user)

        if user.role == User.Role.ADMIN or user.is_staff:
            pickup_filter = Q()
            dropoff_filter = Q()
            delivery_filter = Q()
            completed_filter = Q()

        pickups = Order.objects.filter(
            pickup_filter,
            status__in=[Order.Status.ACCEPTED, Order.Status.PICKUP_ASSIGNED, Order.Status.PICKUP_IN_PROGRESS]
        ).select_related('customer').prefetch_related('items').order_by('-updated_at')

        dropoffs = Order.objects.filter(
            dropoff_filter,
            status__in=[Order.Status.PICKED_UP, Order.Status.DROPPED_OFF_AT_LAUNDRY]
        ).select_related('customer').prefetch_related('items').order_by('-updated_at')

        deliveries = Order.objects.filter(
            delivery_filter,
            status__in=[Order.Status.READY_FOR_DELIVERY, Order.Status.OUT_FOR_DELIVERY]
        ).select_related('customer').prefetch_related('items').order_by('-updated_at')

        completed = Order.objects.filter(
            completed_filter,
            status=Order.Status.DELIVERED
        ).select_related('customer').prefetch_related('items').order_by('-updated_at')

        seen_ids = set()
        all_tasks = []
        for queryset in [pickups, dropoffs, deliveries, completed]:
            for o in queryset:
                if o.id not in seen_ids:
                    seen_ids.add(o.id)
                    all_tasks.append(o)

        return Response({
            'pickup_tasks': OrderSerializer(pickups, many=True).data,
            'dropoff_tasks': OrderSerializer(dropoffs, many=True).data,
            'delivery_tasks': OrderSerializer(deliveries, many=True).data,
            'completed_tasks': OrderSerializer(completed, many=True).data,
            'results': OrderSerializer(all_tasks, many=True).data,
            'all_tasks': OrderSerializer(all_tasks, many=True).data
        })


class DeliveryConfirmPickupView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        bag_count = int(request.data.get('collected_bags_count') or request.data.get('bags_count') or 1)
        item_count = int(request.data.get('collected_items_count') or request.data.get('items_count') or 0)
        weight_kg = request.data.get('collected_weight_kg') or request.data.get('weight_kg')
        notes = request.data.get('pickup_notes') or request.data.get('notes') or ''

        PickupRecord.objects.update_or_create(
            order=order,
            defaults={
                'driver': request.user,
                'collected_bags_count': bag_count,
                'collected_items_count': item_count,
                'collected_weight_kg': float(weight_kg) if weight_kg else None,
                'pickup_notes': notes,
                'collected_at': timezone.now()
            }
        )

        order.assigned_pickup_driver = request.user
        order.status = Order.Status.PICKED_UP
        order.save()

        Notification.objects.create(
            user=order.customer,
            order=order,
            title="Clothes Collected",
            message=f"Our executive {request.user.full_name} has collected {bag_count} bag(s) for order {order.order_id} and is en route to our facility.",
            type=Notification.Type.PICKUP
        )

        return Response(OrderSerializer(order).data)


class DeliveryDropoffLaundryView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        order.status = Order.Status.DROPPED_OFF_AT_LAUNDRY
        order.save()

        return Response({'detail': 'Clothes handed over to laundry facility.', 'order': OrderSerializer(order).data})


class DeliveryConfirmDeliveryView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        recipient_name = request.data.get('recipient_name') or request.data.get('received_by') or order.pickup_full_name
        notes = request.data.get('delivery_notes') or request.data.get('notes', '')

        DeliveryRecord.objects.update_or_create(
            order=order,
            defaults={
                'driver': request.user,
                'recipient_name': recipient_name,
                'delivery_notes': notes,
                'status': DeliveryRecord.Status.DELIVERED,
                'delivered_at': timezone.now()
            }
        )

        order.status = Order.Status.DELIVERED
        order.payment_status = Order.PaymentStatus.PAID
        order.assigned_delivery_driver = request.user
        order.save()

        # Update invoice status
        if hasattr(order, 'invoice'):
            order.invoice.payment_status = Invoice.PaymentStatus.PAID
            order.invoice.paid_at = timezone.now()
            order.invoice.save()

        Notification.objects.create(
            user=order.customer,
            order=order,
            title="Order Delivered!",
            message=f"Your order {order.order_id} has been delivered successfully to {recipient_name}. Thank you for choosing FabriCare!",
            type=Notification.Type.DELIVERY
        )

        return Response(OrderSerializer(order).data)


class DeliveryFailDeliveryView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('failed_reason') or request.data.get('reason') or 'Customer unavailable'
        DeliveryRecord.objects.update_or_create(
            order=order,
            defaults={
                'driver': request.user,
                'status': DeliveryRecord.Status.FAILED,
                'failed_reason': reason
            }
        )

        order.status = Order.Status.FAILED_DELIVERY
        order.save()

        Notification.objects.create(
            user=order.customer,
            order=order,
            title="Delivery Attempt Update",
            message=f"We attempted delivery for order {order.order_id} but could not reach you ({reason}). We will reschedule shortly.",
            type=Notification.Type.DELIVERY
        )

        return Response(OrderSerializer(order).data)


# ===============================================================
# 5. LAUNDRY STAFF WORKFLOW ENDPOINTS
# ===============================================================

class LaundryOrdersListView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        if user.role != User.Role.LAUNDRY_STAFF and user.role != User.Role.ADMIN and not user.is_staff:
            return Response({'detail': 'Access restricted to laundry operations team.'}, status=status.HTTP_403_FORBIDDEN)

        all_orders = Order.objects.all().select_related('customer', 'assigned_delivery_driver', 'assigned_laundry_staff').prefetch_related('items').order_by('-created_at')
        all_orders_data = OrderSerializer(all_orders, many=True).data

        incoming = [o for o in all_orders_data if o.get('status') in [Order.Status.PICKED_UP, Order.Status.DROPPED_OFF_AT_LAUNDRY]]
        received = [o for o in all_orders_data if o.get('status') in [Order.Status.RECEIVED_BY_LAUNDRY, Order.Status.PENDING_REVIEW, Order.Status.ACCEPTED]]
        inspection = [o for o in all_orders_data if o.get('status') == Order.Status.INSPECTION]
        washing = [o for o in all_orders_data if o.get('status') == Order.Status.WASHING]
        drying = [o for o in all_orders_data if o.get('status') == Order.Status.DRYING]
        ironing = [o for o in all_orders_data if o.get('status') == Order.Status.IRONING]
        folding = [o for o in all_orders_data if o.get('status') == Order.Status.FOLDING]
        qc = [o for o in all_orders_data if o.get('status') == Order.Status.QUALITY_CHECK]
        packing = [o for o in all_orders_data if o.get('status') == Order.Status.PACKING]
        ready = [o for o in all_orders_data if o.get('status') == Order.Status.READY_FOR_DELIVERY]
        out_for_delivery = [o for o in all_orders_data if o.get('status') == Order.Status.OUT_FOR_DELIVERY]
        delivered = [o for o in all_orders_data if o.get('status') == Order.Status.DELIVERED]

        return Response({
            'incoming': incoming,
            'received': received,
            'inspection': inspection,
            'washing': washing,
            'drying': drying,
            'ironing': ironing,
            'folding': folding,
            'quality_check': qc,
            'packing': packing,
            'ready_for_delivery': ready,
            'out_for_delivery': out_for_delivery,
            'delivered': delivered,
            'results': all_orders_data,
            'all_orders': all_orders_data,
        })


class LaundryConfirmReceiptView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        received_bags = int(request.data.get('received_bags_count') or request.data.get('bags_count') or 1)
        received_items = int(request.data.get('received_items_count') or request.data.get('items_count') or 0)
        received_weight = request.data.get('received_weight_kg') or request.data.get('weight_kg')
        discrepancy_found = bool(request.data.get('discrepancy_found') or request.data.get('has_discrepancy') or False)
        discrepancy_details = request.data.get('discrepancy_details') or request.data.get('discrepancy_notes') or ''
        inspection_notes = request.data.get('inspection_notes') or request.data.get('notes') or ''

        LaundryHandoverRecord.objects.update_or_create(
            order=order,
            defaults={
                'laundry_staff': request.user,
                'received_bags_count': received_bags,
                'received_items_count': received_items,
                'received_weight_kg': float(received_weight) if received_weight else None,
                'discrepancy_found': discrepancy_found,
                'discrepancy_details': discrepancy_details,
                'inspection_notes': inspection_notes,
                'received_at': timezone.now()
            }
        )

        order.status = Order.Status.RECEIVED_BY_LAUNDRY
        order.assigned_laundry_staff = request.user
        order.save()

        Notification.objects.create(
            user=order.customer,
            order=order,
            title="Garments Verified at Laundry Hub",
            message=f"Your clothes for order {order.order_id} have been verified ({received_bags} bags) and prepared for the cleaning cycle.",
            type=Notification.Type.ORDER_UPDATE
        )

        return Response(OrderSerializer(order).data)


class LaundryAdvanceStageView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    ORDER_LIFECYCLE_STEPS = [
        Order.Status.RECEIVED_BY_LAUNDRY,
        Order.Status.INSPECTION,
        Order.Status.WASHING,
        Order.Status.DRYING,
        Order.Status.IRONING,
        Order.Status.FOLDING,
        Order.Status.QUALITY_CHECK,
        Order.Status.PACKING,
        Order.Status.READY_FOR_DELIVERY,
        Order.Status.OUT_FOR_DELIVERY,
        Order.Status.DELIVERED,
    ]

    STAGE_MAP = {
        'RECEIVED': Order.Status.RECEIVED_BY_LAUNDRY,
        'RECEIVED_BY_LAUNDRY': Order.Status.RECEIVED_BY_LAUNDRY,
        'INSPECTION': Order.Status.INSPECTION,
        'WASHING': Order.Status.WASHING,
        'DRYING': Order.Status.DRYING,
        'IRONING': Order.Status.IRONING,
        'FOLDING': Order.Status.FOLDING,
        'QUALITY_CHECK': Order.Status.QUALITY_CHECK,
        'QUALITY': Order.Status.QUALITY_CHECK,
        'PACKING': Order.Status.PACKING,
        'READY_FOR_DELIVERY': Order.Status.READY_FOR_DELIVERY,
        'OUT_FOR_DELIVERY': Order.Status.OUT_FOR_DELIVERY,
        'DELIVERED': Order.Status.DELIVERED,
    }

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        raw_stage = request.data.get('stage', '').strip().upper()
        target_stage = self.STAGE_MAP.get(raw_stage)
        notes = request.data.get('notes', '')

        if not target_stage:
            return Response({'detail': f'Invalid stage: {raw_stage}'}, status=status.HTTP_400_BAD_REQUEST)

        # Determine current stage index in 11-step lifecycle
        if order.status in self.ORDER_LIFECYCLE_STEPS:
            curr_idx = self.ORDER_LIFECYCLE_STEPS.index(order.status)
        else:
            # If status is an early pickup/pending status, order enters table directly as Received (index 0)
            curr_idx = 0

        next_required_step = self.ORDER_LIFECYCLE_STEPS[curr_idx + 1] if curr_idx < len(self.ORDER_LIFECYCLE_STEPS) - 1 else None

        # Allow advancing to next step or reverting back to any previous step
        is_advancing = (next_required_step is not None and target_stage == next_required_step)
        is_reverting = (target_stage in self.ORDER_LIFECYCLE_STEPS[:curr_idx])

        if not (is_advancing or is_reverting):
            if curr_idx >= len(self.ORDER_LIFECYCLE_STEPS) - 1 and not is_reverting:
                return Response({'detail': 'Order is already delivered and completed.'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({
                'detail': f'Invalid stage transition. You can advance to {next_required_step} or revert to a previous step.'
            }, status=status.HTTP_400_BAD_REQUEST)

        order.status = target_stage
        order.assigned_laundry_staff = request.user

        # Ready for Delivery -> Out for Delivery hands the order to a delivery agent
        if target_stage == Order.Status.OUT_FOR_DELIVERY:
            if not order.assigned_delivery_driver:
                delivery_driver = User.objects.filter(role=User.Role.DELIVERY_STAFF).first()
                if delivery_driver:
                    order.assigned_delivery_driver = delivery_driver

        # Delivered orders move to Order History and mark payment as completed
        if target_stage == Order.Status.DELIVERED:
            order.payment_status = Order.PaymentStatus.PAID
            if hasattr(order, 'invoice'):
                order.invoice.payment_status = Invoice.PaymentStatus.PAID
                order.invoice.paid_at = timezone.now()
                order.invoice.save()

        order.save()

        stage_log_name = target_stage
        if stage_log_name in [Order.Status.RECEIVED_BY_LAUNDRY, Order.Status.INSPECTION, Order.Status.OUT_FOR_DELIVERY, Order.Status.DELIVERED]:
            stage_log_name = 'PROCESSING'

        try:
            LaundryStageLog.objects.create(
                order=order,
                staff=request.user,
                stage=stage_log_name,
                status=LaundryStageLog.Status.IN_PROGRESS if target_stage != Order.Status.DELIVERED else LaundryStageLog.Status.PASSED,
                notes=notes or f"Advanced to {target_stage}"
            )
        except Exception:
            pass

        return Response(OrderSerializer(order).data)


class LaundryQualityCheckView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        passed = bool(request.data.get('passed', True))
        notes = request.data.get('notes', '')
        failure_reason = request.data.get('failure_reason', '')

        if passed:
            order.status = Order.Status.PACKING
            LaundryStageLog.objects.create(
                order=order,
                staff=request.user,
                stage=LaundryStageLog.Stage.QUALITY_CHECK,
                status=LaundryStageLog.Status.PASSED,
                notes=notes or "Quality check approved. Garments clean and pristine."
            )
        else:
            reprocess_stage = request.data.get('reprocess_stage', Order.Status.WASHING)
            order.status = reprocess_stage
            LaundryStageLog.objects.create(
                order=order,
                staff=request.user,
                stage=LaundryStageLog.Stage.QUALITY_CHECK,
                status=LaundryStageLog.Status.FAILED,
                notes=notes,
                failure_reason=failure_reason
            )

        order.save()
        return Response(OrderSerializer(order).data)


class LaundryPackOrderView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        order.status = Order.Status.READY_FOR_DELIVERY
        order.save()

        LaundryStageLog.objects.create(
            order=order,
            staff=request.user,
            stage=LaundryStageLog.Stage.PACKING,
            status=LaundryStageLog.Status.PASSED,
            notes="Garments packed in protective bags and sealed. Ready for dispatch."
        )

        Notification.objects.create(
            user=order.customer,
            order=order,
            title="Clothes Ready For Delivery!",
            message=f"Your clean clothes for order {order.order_id} are packed with care and ready for doorstep delivery.",
            type=Notification.Type.ORDER_UPDATE
        )

        return Response(OrderSerializer(order).data)


# ===============================================================
# 6. NOTIFICATIONS, SUPPORT & INVOICES
# ===============================================================

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response(NotificationSerializer(notif).data)

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'detail': 'All notifications marked as read.'})


class SupportTicketViewSet(viewsets.ModelViewSet):
    serializer_class = SupportTicketSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.ADMIN or user.is_staff:
            return SupportTicket.objects.all()
        return SupportTicket.objects.filter(customer=user)

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)


class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.ADMIN or user.is_staff:
            return Invoice.objects.all()
        return Invoice.objects.filter(order__customer=user)
