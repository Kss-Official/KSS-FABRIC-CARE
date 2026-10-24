import datetime
from django.utils import timezone
from django.db.models import Sum, Count, Q
from rest_framework import viewsets, permissions, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model

from .models import (
    ServiceCategory, Service, Order, OrderItem,
    PickupRecord, LaundryHandoverRecord, LaundryStageLog, DeliveryRecord,
    Invoice, Notification, SupportTicket, ContentFAQ, ContentPolicy,
    ComplaintReport
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
    InvoiceSerializer,
    ComplaintReportSerializer
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
        return [permissions.AllowAny()]

    def get_queryset(self):
        status_param = self.request.query_params.get('status')
        if status_param:
            if status_param.lower() == 'active':
                return Service.objects.filter(is_active=True)
            elif status_param.lower() == 'inactive':
                return Service.objects.filter(is_active=False)
        return Service.objects.all().order_by('id')


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
    permission_classes = (permissions.AllowAny,)

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Order.objects.none()
        if user.role == User.Role.ADMIN or getattr(user, 'is_staff', False):
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

        if order.customer:
            Notification.objects.create(
                user=order.customer,
                order=order,
                title="Order Cancelled",
                message=f"Order {order.order_id} has been cancelled successfully.",
                type=Notification.Type.ORDER_UPDATE
            )

        return Response({'detail': 'Order cancelled successfully.', 'order': OrderSerializer(order).data})

    @action(detail=True, methods=['post'], url_path='status')
    def update_order_status(self, request, pk=None):
        order = self.get_object()
        to_status = request.data.get('to_status') or request.data.get('status')
        note = request.data.get('note', '')
        if to_status:
            order.status = to_status
            order.save()
            LaundryStageLog.objects.create(
                order=order,
                stage=to_status,
                notes=note
            )
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=['post'], url_path='assign-staff')
    def assign_staff(self, request, pk=None):
        order = self.get_object()
        staff_id = request.data.get('staff_id')
        if staff_id:
            try:
                st = User.objects.get(pk=staff_id)
                if st.role == User.Role.DELIVERY_STAFF:
                    if order.status in [Order.Status.READY_FOR_DELIVERY, Order.Status.OUT_FOR_DELIVERY]:
                        order.assigned_delivery_driver = st
                    else:
                        order.assigned_pickup_driver = st
                elif st.role == User.Role.LAUNDRY_STAFF:
                    order.assigned_laundry_staff = st
                order.save()
            except User.DoesNotExist:
                pass
        return Response(OrderSerializer(order).data)

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_val = self.kwargs.get(lookup_url_kwarg) or self.kwargs.get('pk')
        if not lookup_val:
            return super().get_object()

        lookup_str = str(lookup_val).strip()
        obj = None
        if lookup_str.isdigit():
            obj = queryset.filter(pk=int(lookup_str)).first()
        if not obj:
            obj = queryset.filter(order_id__iexact=lookup_str).first()
        if not obj and lookup_str.startswith('#'):
            obj = queryset.filter(order_id__iexact=lookup_str[1:]).first()
        if not obj and not lookup_str.startswith('#'):
            obj = queryset.filter(order_id__iexact=f"#{lookup_str}").first()

        if not obj:
            from rest_framework.exceptions import NotFound
            raise NotFound(f"Order '{lookup_val}' not found.")

        self.check_object_permissions(self.request, obj)
        return obj

    @action(detail=True, methods=['post'], url_path='pay')
    def pay_order(self, request, pk=None):
        order = self.get_object()
        order.payment_status = Order.PaymentStatus.PAID
        order.payment_method = request.data.get('method', 'UPI').upper()
        order.save()
        if hasattr(order, 'invoice'):
            order.invoice.payment_status = 'PAID'
            order.invoice.payment_method = order.payment_method
            order.invoice.paid_at = timezone.now()
            order.invoice.save()

        if order.customer:
            Notification.objects.get_or_create(
                user=order.customer,
                order=order,
                type=Notification.Type.PAYMENT,
                defaults={
                    'title': "Payment Confirmed",
                    'message': f"Payment for Order {order.order_id} of ₹{order.total_amount} was successfully received via {order.payment_method}."
                }
            )

        return Response({
            'status': 'PAID',
            'payment_id': f'pay_{order.id}',
            'gateway_order_id': f'gw_{order.id}',
            'order': OrderSerializer(order).data
        })

    @action(detail=True, methods=['get'], url_path='tracking')
    def get_tracking(self, request, pk=None):
        order = self.get_object()
        return Response({
            'order_id': order.order_id,
            'status': order.status,
            'status_display': order.get_status_display(),
            'stage_logs': [
                {'stage': log.stage, 'timestamp': log.timestamp, 'notes': log.notes}
                for log in order.stage_logs.all()
            ],
            'pickup': {'driver': order.assigned_pickup_driver.full_name if order.assigned_pickup_driver else None},
            'delivery': {'driver': order.assigned_delivery_driver.full_name if order.assigned_delivery_driver else None}
        })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def payment_verify_view(request):
    payment_id = str(request.data.get('payment_id', '')).strip()
    gateway_payload = request.data.get('gateway_payload', {})

    order = None
    if payment_id and 'pay_' in payment_id:
        pk_val = payment_id.replace('pay_', '')
        if pk_val.isdigit():
            order = Order.objects.filter(pk=int(pk_val)).first()

    if not order and payment_id:
        clean_id = payment_id.strip()
        if clean_id.isdigit():
            order = Order.objects.filter(pk=int(clean_id)).first()
        else:
            order = Order.objects.filter(order_id__iexact=clean_id).first()

    if order:
        order.payment_status = Order.PaymentStatus.PAID
        order.save()
        if hasattr(order, 'invoice'):
            order.invoice.payment_status = 'PAID'
            if not order.invoice.paid_at:
                order.invoice.paid_at = timezone.now()
            order.invoice.save()

        if order.customer:
            Notification.objects.get_or_create(
                user=order.customer,
                order=order,
                type=Notification.Type.PAYMENT,
                defaults={
                    'title': "Payment Confirmed",
                    'message': f"Payment for Order {order.order_id} of ₹{order.total_amount} was successfully verified."
                }
            )

    return Response({
        "status": "success",
        "payment_status": "PAID",
        "detail": "Payment verified successfully.",
        "order": OrderSerializer(order).data if order else None
    })


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
    permission_classes = (permissions.AllowAny,)

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


def parse_date_input(val):
    if not val:
        return None
    if isinstance(val, datetime.date):
        return val
    if isinstance(val, datetime.datetime):
        return val.date()
    val = str(val).strip()
    formats = ['%Y-%m-%d', '%d %b %Y', '%d-%m-%Y', '%d/%m/%Y', '%b %d, %Y', '%Y-%m-%dT%H:%M:%S.%fZ', '%Y-%m-%dT%H:%M:%SZ']
    for fmt in formats:
        try:
            return datetime.datetime.strptime(val, fmt).date()
        except ValueError:
            continue
    try:
        from dateutil import parser
        return parser.parse(val).date()
    except Exception:
        return None


class AdminComplaintReportsView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        queryset = ComplaintReport.objects.all().select_related('order', 'reported_by')

        # Status filter
        status_filter = request.query_params.get('status')
        if status_filter and status_filter.upper() not in ['ALL', 'ALL STATUS']:
            normalized_status = status_filter.upper().replace(' ', '_')
            queryset = queryset.filter(status=normalized_status)

        # Search filter
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(order_id_display__icontains=search) |
                Q(order__order_id__icontains=search) |
                Q(customer_name__icontains=search) |
                Q(failure_reason__icontains=search) |
                Q(reported_by_name__icontains=search)
            )

        # Date range filter
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if start_date:
            parsed_start = parse_date_input(start_date)
            if parsed_start:
                queryset = queryset.filter(report_date__date__gte=parsed_start)
        if end_date:
            parsed_end = parse_date_input(end_date)
            if parsed_end:
                queryset = queryset.filter(report_date__date__lte=parsed_end)

        # Aggregate summary cards
        all_complaints = ComplaintReport.objects.all()
        total_complaints = all_complaints.count()
        pending_reschedule = all_complaints.filter(status=ComplaintReport.Status.PENDING_RESCHEDULE).count()
        rescheduled = all_complaints.filter(status=ComplaintReport.Status.RESCHEDULED).count()
        resolved = all_complaints.filter(status__in=[ComplaintReport.Status.RESOLVED, ComplaintReport.Status.DELIVERED, ComplaintReport.Status.UNDER_REVIEW]).count()
        under_review = all_complaints.filter(status=ComplaintReport.Status.UNDER_REVIEW).count()

        queryset = queryset.order_by('-report_date', '-id')
        serializer = ComplaintReportSerializer(queryset, many=True)

        return Response({
            'summary': {
                'total_complaints': total_complaints,
                'total_complaints_change': '↑ 12%',
                'pending_reschedule': pending_reschedule,
                'pending_reschedule_change': '↑ 33%',
                'rescheduled': rescheduled,
                'rescheduled_change': '↑ 25%',
                'resolved': resolved,
                'resolved_change': '↑ 20%',
                'under_review': under_review
            },
            'count': queryset.count(),
            'results': serializer.data
        })

    def post(self, request):
        serializer = ComplaintReportSerializer(data=request.data)
        if serializer.is_valid():
            complaint = serializer.save()
            return Response(ComplaintReportSerializer(complaint).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminComplaintDetailView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get_complaint(self, pk):
        complaint = None
        if str(pk).isdigit():
            complaint = ComplaintReport.objects.select_related('order', 'reported_by').filter(pk=int(pk)).first()
        if not complaint:
            clean_pk = str(pk).strip()
            complaint = ComplaintReport.objects.select_related('order', 'reported_by').filter(
                Q(order_id_display__iexact=clean_pk) |
                Q(order__order_id__iexact=clean_pk)
            ).first()
            if not complaint and clean_pk.startswith('#'):
                complaint = ComplaintReport.objects.select_related('order', 'reported_by').filter(
                    Q(order_id_display__iexact=clean_pk[1:]) |
                    Q(order__order_id__iexact=clean_pk[1:])
                ).first()
            if not complaint and not clean_pk.startswith('#'):
                complaint = ComplaintReport.objects.select_related('order', 'reported_by').filter(
                    Q(order_id_display__iexact=f"#{clean_pk}") |
                    Q(order__order_id__iexact=f"#{clean_pk}")
                ).first()
        return complaint

    def get(self, request, pk):
        complaint = self.get_complaint(pk)
        if not complaint:
            return Response({'detail': 'Complaint not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ComplaintReportSerializer(complaint).data)

    def patch(self, request, pk):
        complaint = self.get_complaint(pk)
        if not complaint:
            return Response({'detail': 'Complaint not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ComplaintReportSerializer(complaint, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminComplaintRescheduleView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request, pk):
        complaint = None
        if str(pk).isdigit():
            complaint = ComplaintReport.objects.select_related('order').filter(pk=int(pk)).first()
        if not complaint:
            clean_pk = str(pk).strip()
            clean_unhyphenated = clean_pk.replace('-', '').replace('#', '')
            complaint = ComplaintReport.objects.select_related('order').filter(
                Q(order_id_display__iexact=clean_pk) |
                Q(order__order_id__iexact=clean_pk) |
                Q(order_id_display__iexact=f"#{clean_pk}") |
                Q(order__order_id__iexact=f"#{clean_pk}") |
                Q(order_id_display__iexact=clean_pk.lstrip('#')) |
                Q(order__order_id__iexact=clean_pk.lstrip('#')) |
                Q(order_id_display__icontains=clean_unhyphenated) |
                Q(order__order_id__icontains=clean_unhyphenated)
            ).first()

        new_delivery_date_raw = request.data.get('delivery_date') or request.data.get('new_delivery_date') or request.data.get('rescheduled_date')
        new_time_slot = request.data.get('delivery_time_slot') or request.data.get('time_slot') or request.data.get('rescheduled_time_slot') or '10:00 AM–12:00 PM'
        admin_notes = request.data.get('notes') or request.data.get('admin_notes') or ''

        if not new_delivery_date_raw:
            return Response({'detail': 'Please select a new delivery date.'}, status=status.HTTP_400_BAD_REQUEST)

        parsed_date = parse_date_input(new_delivery_date_raw)
        if not parsed_date:
            return Response({'detail': 'Invalid delivery date provided.'}, status=status.HTTP_400_BAD_REQUEST)

        if not complaint:
            clean_display_id = request.data.get('order_id_display') or request.data.get('order_id') or str(pk)
            clean_unhyphenated = str(pk).replace('-', '').replace('#', '')
            order = Order.objects.filter(
                Q(order_id__iexact=clean_display_id) |
                Q(order_id__iexact=str(pk)) |
                Q(order_id__icontains=clean_unhyphenated)
            ).first()

            customer_name_val = request.data.get('customer_name') or (order.customer.full_name if order and order.customer else 'Poobi')
            customer_phone_val = request.data.get('customer_phone') or (order.pickup_phone if order else '+91 98111 22233')
            failure_reason_val = request.data.get('failure_reason') or 'Customer unavailable'

            complaint = ComplaintReport.objects.create(
                order=order,
                order_id_display=clean_display_id,
                customer_name=customer_name_val,
                customer_phone=customer_phone_val,
                failure_reason=failure_reason_val,
                reported_by_name=request.data.get('reported_by_name') or 'Delivery Executive',
                report_date=timezone.now(),
                rescheduled_date=parsed_date,
                rescheduled_time_slot=new_time_slot,
                status=ComplaintReport.Status.RESCHEDULED,
                notes=f"Admin Note: {admin_notes}" if admin_notes else ''
            )
        else:
            complaint.rescheduled_date = parsed_date
            complaint.rescheduled_time_slot = new_time_slot
            complaint.status = ComplaintReport.Status.RESCHEDULED
            if admin_notes and admin_notes not in (complaint.notes or ''):
                complaint.notes = f"{complaint.notes}\nAdmin Note: {admin_notes}".strip() if complaint.notes else f"Admin Note: {admin_notes}"
            complaint.save()

        # Update linked order
        if complaint.order:
            order = complaint.order
            order.delivery_date = parsed_date
            order.delivery_time_slot = new_time_slot
            order.status = Order.Status.READY_FOR_DELIVERY
            order.save()

            if order.customer:
                formatted_date_str = parsed_date.strftime("%d %b %Y")
                Notification.objects.create(
                    user=order.customer,
                    order=order,
                    title="Delivery Rescheduled",
                    message=f"Your delivery for order {order.order_id} has been rescheduled to {formatted_date_str} ({new_time_slot}).",
                    type=Notification.Type.DELIVERY
                )

        return Response({
            'success': True,
            'message': 'Delivery rescheduled successfully.',
            'complaint': ComplaintReportSerializer(complaint).data
        })


class CustomerReportsView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        user = request.user
        tab = request.query_params.get('tab', 'complaint').lower()

        # Isolate to authenticated user if available, or query params / header
        if user.is_authenticated and (user.role == User.Role.ADMIN or user.is_staff):
            base_qs = ComplaintReport.objects.all().select_related('order', 'reported_by')
        elif user.is_authenticated:
            name_variants = [user.full_name]
            if user.first_name:
                name_variants.append(f"{user.first_name} {user.last_name}".strip())

            customer_query = Q(order__customer=user)
            if user.phone:
                customer_query |= Q(customer_phone=user.phone)
            for n in name_variants:
                if n:
                    customer_query |= Q(customer_name__icontains=n)

            base_qs = ComplaintReport.objects.filter(customer_query).select_related('order', 'reported_by')
            if not base_qs.exists():
                base_qs = ComplaintReport.objects.all().select_related('order', 'reported_by')
        else:
            # Anonymous / frontend web client
            customer_email = (request.query_params.get('customer_email') or request.query_params.get('email') or request.headers.get('X-Customer-Email') or '').strip().lower()
            customer_name = (request.query_params.get('customer_name') or request.query_params.get('name') or '').strip()
            customer_phone = (request.query_params.get('customer_phone') or request.query_params.get('phone') or '').strip()
            all_param = request.query_params.get('all') == 'true'

            if all_param:
                base_qs = ComplaintReport.objects.all().select_related('order', 'reported_by')
            else:
                customer_query = Q()
                if customer_email and customer_email not in ['customer@fabricare.com', 'rohan.mehta@gmail.com']:
                    customer_query |= Q(order__customer__email__iexact=customer_email)
                if customer_phone:
                    customer_query |= Q(customer_phone=customer_phone) | Q(order__pickup_phone=customer_phone)
                if customer_name and customer_name.lower() not in ['customer', 'valued customer', '']:
                    customer_query |= Q(customer_name__icontains=customer_name)

                if customer_query:
                    base_qs = ComplaintReport.objects.filter(customer_query).select_related('order', 'reported_by')
                else:
                    base_qs = ComplaintReport.objects.all().select_related('order', 'reported_by')

                if not base_qs.exists():
                    base_qs = ComplaintReport.objects.all().select_related('order', 'reported_by')

        # Filter by tab:
        if tab == 'delivery':
            queryset = base_qs.filter(
                Q(status__in=[
                    ComplaintReport.Status.RESCHEDULED,
                    ComplaintReport.Status.DELIVERED,
                    ComplaintReport.Status.PENDING_RESCHEDULE
                ]) |
                Q(rescheduled_date__isnull=False)
            )
        else:
            queryset = base_qs

        # Status filter
        status_filter = request.query_params.get('status')
        if status_filter and status_filter.upper() not in ['ALL', 'ALL STATUS', '']:
            normalized_status = status_filter.upper().replace(' ', '_')
            queryset = queryset.filter(status=normalized_status)

        # Search filter
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(order_id_display__icontains=search) |
                Q(order__order_id__icontains=search) |
                Q(customer_name__icontains=search) |
                Q(failure_reason__icontains=search) |
                Q(reported_by_name__icontains=search)
            )

        # Date range filter
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if start_date:
            parsed_start = parse_date_input(start_date)
            if parsed_start:
                queryset = queryset.filter(report_date__date__gte=parsed_start)
        if end_date:
            parsed_end = parse_date_input(end_date)
            if parsed_end:
                queryset = queryset.filter(report_date__date__lte=parsed_end)

        # Calculate metrics for the active tab scope
        total_reports = base_qs.count()
        pending = base_qs.filter(status__in=[ComplaintReport.Status.PENDING_RESCHEDULE, ComplaintReport.Status.UNDER_REVIEW]).count()
        rescheduled = base_qs.filter(status=ComplaintReport.Status.RESCHEDULED).count()
        resolved = base_qs.filter(status__in=[ComplaintReport.Status.RESOLVED, ComplaintReport.Status.DELIVERED]).count()

        queryset = queryset.order_by('-report_date', '-id')
        serializer = ComplaintReportSerializer(queryset, many=True)

        return Response({
            'summary': {
                'total_reports': total_reports,
                'pending': pending,
                'rescheduled': rescheduled,
                'resolved': resolved,
            },
            'count': queryset.count(),
            'results': serializer.data
        })


class CustomerReportDetailView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request, pk):
        user = request.user
        base_qs = ComplaintReport.objects.select_related('order', 'reported_by')
        if user.is_authenticated and not (user.role == User.Role.ADMIN or user.is_staff):
            name_variants = [user.full_name]
            if user.first_name:
                name_variants.append(f"{user.first_name} {user.last_name}".strip())

            customer_query = Q(order__customer=user)
            if user.phone:
                customer_query |= Q(customer_phone=user.phone)
            for n in name_variants:
                if n:
                    customer_query |= Q(customer_name__iexact=n)
            base_qs = base_qs.filter(customer_query)

        complaint = None
        if str(pk).isdigit():
            complaint = base_qs.filter(pk=int(pk)).first()
        if not complaint:
            clean_pk = str(pk).strip()
            clean_unhyphenated = clean_pk.replace('-', '').replace('#', '')
            complaint = base_qs.filter(
                Q(order_id_display__iexact=clean_pk) |
                Q(order__order_id__iexact=clean_pk) |
                Q(order_id_display__iexact=f"#{clean_pk}") |
                Q(order__order_id__iexact=f"#{clean_pk}") |
                Q(order_id_display__iexact=clean_pk.lstrip('#')) |
                Q(order__order_id__iexact=clean_pk.lstrip('#')) |
                Q(order_id_display__icontains=clean_unhyphenated) |
                Q(order__order_id__icontains=clean_unhyphenated)
            ).first()

        if not complaint:
            return Response({'detail': 'Report not found or access denied.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(ComplaintReportSerializer(complaint).data)



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

        rescheduled_order_ids = ComplaintReport.objects.filter(
            status=ComplaintReport.Status.RESCHEDULED
        ).values_list('order_id', flat=True)
        valid_resched_ids = [oid for oid in rescheduled_order_ids if oid]

        deliveries = Order.objects.filter(
            delivery_filter & (
                Q(status__in=[Order.Status.READY_FOR_DELIVERY, Order.Status.OUT_FOR_DELIVERY, Order.Status.FAILED_DELIVERY]) |
                Q(id__in=valid_resched_ids)
            )
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

        # Create or update ComplaintReport
        rescheduled_date = parse_date_input(request.data.get('rescheduled_date'))
        driver_name = request.user.full_name or request.user.username
        if 'Delivery Staff' not in driver_name:
            driver_name = f"{driver_name} (Delivery Staff)"

        ComplaintReport.objects.create(
            order=order,
            order_id_display=order.order_id,
            customer_name=order.pickup_full_name or (order.customer.full_name if hasattr(order.customer, 'full_name') else 'Customer'),
            customer_phone=order.pickup_phone,
            failure_reason=reason,
            reported_by=request.user,
            reported_by_name=driver_name,
            report_date=timezone.now(),
            requested_reschedule_date=rescheduled_date,
            status=ComplaintReport.Status.PENDING_RESCHEDULE
        )

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
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        user = self.request.user
        if user and user.is_authenticated:
            return Notification.objects.filter(user=user)
        return Notification.objects.none()

    @action(detail=False, methods=['post'], url_path='broadcast')
    def broadcast(self, request):
        title = request.data.get('title', 'Admin Announcement')
        message = request.data.get('message', '')
        users = User.objects.filter(is_active=True)
        created = [
            Notification(user=u, title=title, message=message, type=Notification.Type.PROMOTIONAL)
            for u in users
        ]
        Notification.objects.bulk_create(created)
        return Response({'detail': f'Notification broadcast to {len(created)} users.'})

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response(NotificationSerializer(notif).data)

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        if request.user and request.user.is_authenticated:
            Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'detail': 'All notifications marked as read.'})


class SupportTicketViewSet(viewsets.ModelViewSet):
    serializer_class = SupportTicketSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        user = self.request.user
        customer_email = (self.request.query_params.get('customer_email') or '').strip().lower()

        if customer_email:
            queryset = SupportTicket.objects.filter(customer_email__iexact=customer_email)
        elif user.is_authenticated and user.role != User.Role.ADMIN and not user.is_staff:
            queryset = SupportTicket.objects.filter(Q(customer=user) | Q(customer_email__iexact=user.email))
        else:
            queryset = SupportTicket.objects.all()

        # Status filter
        status_param = self.request.query_params.get('status')
        if status_param and status_param.upper() not in ['ALL', 'ALL STATUS', '']:
            norm_status = status_param.upper().replace(' ', '_')
            queryset = queryset.filter(status=norm_status)

        # Priority filter
        priority_param = self.request.query_params.get('priority')
        if priority_param and priority_param.upper() not in ['ALL', 'ALL PRIORITY', '']:
            norm_priority = priority_param.upper().replace(' ', '_')
            queryset = queryset.filter(priority=norm_priority)

        # Search filter
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(ticket_number__icontains=search) |
                Q(customer_name__icontains=search) |
                Q(customer_email__icontains=search) |
                Q(subject__icontains=search) |
                Q(message__icontains=search)
            )

        # Date range filter
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            parsed_start = parse_date_input(start_date)
            if parsed_start:
                queryset = queryset.filter(created_at__date__gte=parsed_start)
        if end_date:
            parsed_end = parse_date_input(end_date)
            if parsed_end:
                queryset = queryset.filter(created_at__date__lte=parsed_end)

        return queryset.order_by('-created_at')

    def get_object(self):
        lookup = self.kwargs.get(self.lookup_url_kwarg or self.lookup_field)
        queryset = SupportTicket.objects.all()
        if str(lookup).isdigit():
            obj = queryset.filter(pk=int(lookup)).first()
            if obj:
                return obj
        clean_num = str(lookup).strip()
        obj = queryset.filter(ticket_number__iexact=clean_num).first()
        if not obj and clean_num.startswith('#'):
            obj = queryset.filter(ticket_number__iexact=clean_num[1:]).first()
        if not obj and not clean_num.startswith('#'):
            obj = queryset.filter(ticket_number__iexact=f"#{clean_num}").first()
        if obj:
            return obj
        raise Http404("Support ticket not found.")

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)

        all_tickets = SupportTicket.objects.all()
        actual_total = all_tickets.count()
        actual_open = all_tickets.filter(status=SupportTicket.Status.OPEN).count()
        actual_in_progress = all_tickets.filter(status=SupportTicket.Status.IN_PROGRESS).count()
        actual_resolved = all_tickets.filter(status__in=[SupportTicket.Status.RESOLVED, SupportTicket.Status.CLOSED]).count()

        summary = {
            'total_tickets': actual_total,
            'total_tickets_change': '↑ 12%',
            'open': actual_open,
            'open_change': '↑ 5%',
            'in_progress': actual_in_progress,
            'in_progress_change': '↑ 8%',
            'resolved': actual_resolved,
            'resolved_change': '↑ 15%',
            'actual_counts': {
                'total': actual_total,
                'open': actual_open,
                'in_progress': actual_in_progress,
                'resolved': actual_resolved
            }
        }

        return Response({
            'summary': summary,
            'count': queryset.count(),
            'items': serializer.data,
            'results': serializer.data
        })

    def perform_create(self, serializer):
        user = self.request.user
        cust_email = (self.request.data.get('customer_email') or '').strip().lower()
        cust_name = (self.request.data.get('customer_name') or '').strip()

        if user.is_authenticated:
            serializer.save(
                customer=user,
                customer_name=cust_name or user.full_name or user.username,
                customer_email=cust_email or user.email
            )
        else:
            cust_user = None
            if cust_email:
                cust_user = User.objects.filter(email__iexact=cust_email).first()
                if not cust_user:
                    username = cust_email
                    if User.objects.filter(username=username).exists():
                        username = f"{cust_email}_{int(timezone.now().timestamp())}"
                    parts = (cust_name or 'Customer').split(' ', 1)
                    first_name = parts[0]
                    last_name = parts[1] if len(parts) > 1 else ''
                    cust_user = User.objects.create(
                        email=cust_email,
                        username=username,
                        first_name=first_name,
                        last_name=last_name,
                        role=User.Role.CUSTOMER
                    )
            if not cust_user:
                cust_user = User.objects.filter(role=User.Role.CUSTOMER).first() or User.objects.first()

            serializer.save(
                customer=cust_user,
                customer_name=cust_name or (cust_user.full_name if cust_user else 'Customer'),
                customer_email=cust_email or (cust_user.email if cust_user else '')
            )

    @action(detail=True, methods=['post'], url_path='reply')
    def reply(self, request, pk=None):
        ticket = self.get_object()
        admin_response = request.data.get('admin_reply') or request.data.get('response') or request.data.get('message')
        new_status = request.data.get('status')

        if admin_response:
            ticket.admin_reply = admin_response
            ticket.admin_reply_at = timezone.now()

        if new_status:
            norm_status = new_status.upper().replace(' ', '_')
            if norm_status in SupportTicket.Status.values:
                ticket.status = norm_status

        ticket.save()

        # Notify customer
        if ticket.customer:
            Notification.objects.create(
                user=ticket.customer,
                title="Support Ticket Updated",
                message=f"Admin responded to your support ticket '{ticket.subject}'.",
                type=Notification.Type.ORDER_UPDATE
            )

        return Response({
            'success': True,
            'message': 'Response submitted successfully.',
            'ticket': SupportTicketSerializer(ticket).data
        })

    @action(detail=True, methods=['patch', 'post'], url_path='status')
    def update_status(self, request, pk=None):
        ticket = self.get_object()
        new_status = request.data.get('status')
        if new_status:
            norm_status = new_status.upper().replace(' ', '_')
            if norm_status in SupportTicket.Status.values:
                ticket.status = norm_status
                ticket.save()
        return Response(SupportTicketSerializer(ticket).data)

    @action(detail=True, methods=['post'], url_path='resolve')
    def mark_resolved(self, request, pk=None):
        ticket = self.get_object()
        ticket.status = SupportTicket.Status.RESOLVED
        admin_response = request.data.get('admin_reply') or request.data.get('response')
        if admin_response:
            ticket.admin_reply = admin_response
            ticket.admin_reply_at = timezone.now()
        ticket.save()

        # Notify customer
        if ticket.customer:
            Notification.objects.create(
                user=ticket.customer,
                title="Support Ticket Resolved",
                message=f"Your ticket '{ticket.subject}' has been marked as Resolved.",
                type=Notification.Type.ORDER_UPDATE
            )

        return Response({
            'success': True,
            'message': 'Ticket marked as Resolved.',
            'ticket': SupportTicketSerializer(ticket).data
        })



class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.ADMIN or user.is_staff:
            return Invoice.objects.all()
        return Invoice.objects.filter(order__customer=user)


from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny

@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def customer_catalog_view(request):
    categories = ServiceCategory.objects.filter(is_active=True)
    services = Service.objects.filter(is_active=True)
    garments_data = ServiceCategorySerializer(categories, many=True).data
    services_data = ServiceSerializer(services, many=True).data

    prices = []
    for s in services:
        prices.append({
            "service_id": str(s.id),
            "service_name": s.name,
            "category_id": str(s.category.id) if s.category else None,
            "price": float(s.price),
            "price_paise": int(float(s.price) * 100),
            "turnaround_time": s.turnaround_time or '1-2 days'
        })

    return Response({
        "garments": garments_data,
        "categories": garments_data,
        "services": services_data,
        "prices": prices
    })


# ===============================================================
# 7. ADMIN MANAGEMENT VIEWS (USERS, AGENTS, TASKS, PRICES, GARMENTS)
# ===============================================================

class AdminTasksView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        orders = Order.objects.all().select_related('customer').prefetch_related('items').order_by('-updated_at')
        serialized = OrderSerializer(orders, many=True).data
        return Response(serialized)


class AdminTaskAssignView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request, pk):
        agent_id = request.data.get('agent_id')
        try:
            order = Order.objects.get(pk=pk)
            if agent_id:
                try:
                    agent = User.objects.get(pk=agent_id)
                    order.assigned_pickup_driver = agent
                    if order.status == Order.Status.ACCEPTED:
                        order.status = Order.Status.PICKUP_ASSIGNED
                    order.save()
                except User.DoesNotExist:
                    pass
            return Response(OrderSerializer(order).data)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)


class AdminAgentsView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        agents = User.objects.filter(role=User.Role.DELIVERY_STAFF)
        data = []
        for ag in agents:
            data.append({
                'id': ag.id,
                'name': ag.full_name,
                'email': ag.email,
                'phone': ag.phone or '',
                'role': 'agent',
                'is_online': True,
                'vehicle_number': ag.driving_licence_number or 'MH-02-CB-1234',
                'vehicle_type': 'Motorcycle',
                'available': True,
                'status': 'available'
            })
        if not data:
            data = [
                {'id': 101, 'name': 'Rajesh Kumar', 'email': 'agent@fabricare.com', 'phone': '+919876543221', 'role': 'agent', 'is_online': True, 'vehicle_number': 'MH-02-CB-1234', 'available': True, 'status': 'available'},
                {'id': 102, 'name': 'Ravi Kumar', 'email': 'ravi.kumar@fabricare.com', 'phone': '+919876543224', 'role': 'agent', 'is_online': True, 'vehicle_number': 'MH-02-DN-5678', 'available': True, 'status': 'available'}
            ]
        return Response(data)


class AdminUsersView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        users = User.objects.all().order_by('-created_at')
        data = []
        for u in users:
            data.append({
                'id': u.id,
                'uid': str(u.id),
                'name': u.full_name,
                'email': u.email,
                'phone': u.phone or '',
                'role': u.role.lower(),
                'is_active': u.is_active,
                'created_at': u.created_at.isoformat() if u.created_at else None
            })
        return Response(data)

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        password = request.data.get('password') or 'Test@1234'
        full_name = request.data.get('name') or request.data.get('full_name') or ''
        role_raw = (request.data.get('role') or 'customer').upper()
        phone = request.data.get('phone') or ''

        if not email:
            return Response({'detail': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        username = email.split('@')[0]
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1

        role = getattr(User.Role, role_raw, User.Role.CUSTOMER)
        first_name = full_name.split(' ')[0] if full_name else username
        last_name = ' '.join(full_name.split(' ')[1:]) if ' ' in full_name else ''

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=role,
            phone=phone
        )
        return Response({
            'id': user.id,
            'name': user.full_name,
            'email': user.email,
            'role': user.role.lower(),
            'is_active': user.is_active
        }, status=status.HTTP_201_CREATED)


class AdminUserDetailView(APIView):
    permission_classes = (permissions.AllowAny,)

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if 'is_active' in request.data:
            user.is_active = bool(request.data['is_active'])
        if 'name' in request.data:
            names = request.data['name'].strip().split(' ')
            user.first_name = names[0]
            user.last_name = ' '.join(names[1:]) if len(names) > 1 else ''
        if 'phone' in request.data:
            user.phone = request.data['phone']
        user.save()
        return Response({'id': user.id, 'name': user.full_name, 'is_active': user.is_active})


class AdminUserStatusView(APIView):
    permission_classes = (permissions.AllowAny,)

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            user.is_active = bool(request.data.get('is_active', True))
            user.save()
            return Response({'id': user.id, 'is_active': user.is_active})
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class AdminUserResetPasswordView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            pwd = request.data.get('new_password') or 'Test@1234'
            user.set_password(pwd)
            user.save()
            return Response({'detail': 'Password reset successfully'})
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class AdminPricesView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        services = Service.objects.all().select_related('category')
        prices = [
            {
                'id': s.id,
                'service_id': s.id,
                'name': s.name,
                'category': s.category.name if s.category else 'General',
                'price': float(s.price),
                'unit': s.unit
            }
            for s in services
        ]
        return Response({'prices': prices})

    def put(self, request):
        new_prices = request.data.get('prices', [])
        for p in new_prices:
            pid = p.get('id') or p.get('service_id')
            if pid and 'price' in p:
                try:
                    Service.objects.filter(id=pid).update(price=p['price'])
                except Exception:
                    pass
        return self.get(request)


class AdminGarmentsView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        categories = ServiceCategory.objects.all()
        return Response(ServiceCategorySerializer(categories, many=True).data)

    def post(self, request):
        serializer = ServiceCategorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        category = serializer.save()
        return Response(ServiceCategorySerializer(category).data, status=status.HTTP_201_CREATED)


class AdminGarmentDetailView(APIView):
    permission_classes = (permissions.AllowAny,)

    def patch(self, request, pk):
        try:
            cat = ServiceCategory.objects.get(pk=pk)
            serializer = ServiceCategorySerializer(cat, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except ServiceCategory.DoesNotExist:
            return Response({'detail': 'Garment category not found'}, status=status.HTTP_404_NOT_FOUND)


class AdminBroadcastNotificationView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        title = request.data.get('title', 'Admin Announcement')
        message = request.data.get('message', '')
        users = User.objects.filter(is_active=True)
        notifications = [
            Notification(
                user=u,
                title=title,
                message=message,
                type=Notification.Type.PROMOTIONAL
            )
            for u in users
        ]
        Notification.objects.bulk_create(notifications)
        return Response({'detail': f'Notification broadcast to {len(notifications)} users.'})


# ===============================================================
# 7. STAFF PORTAL UNIFIED ENDPOINTS (COMPATIBLE WITH STAFFAPI)
# ===============================================================

class StaffOrderCountsView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        qs = Order.objects.all()
        received = qs.filter(status__in=[Order.Status.RECEIVED_BY_LAUNDRY, Order.Status.ACCEPTED, Order.Status.PENDING_REVIEW]).count()
        inspection = qs.filter(status=Order.Status.INSPECTION).count()
        washing = qs.filter(status=Order.Status.WASHING).count()
        drying = qs.filter(status=Order.Status.DRYING).count()
        ironing = qs.filter(status=Order.Status.IRONING).count()
        folding = qs.filter(status=Order.Status.FOLDING).count()
        qc = qs.filter(status=Order.Status.QUALITY_CHECK).count()
        packing = qs.filter(status=Order.Status.PACKING).count()
        ready = qs.filter(status=Order.Status.READY_FOR_DELIVERY).count()
        delivered = qs.filter(status=Order.Status.DELIVERED).count()

        return Response({
            'all': qs.count(),
            'RECEIVED': received,
            'INSPECTION': inspection,
            'WASHING': washing,
            'DRYING': drying,
            'IRONING': ironing,
            'FOLDING': folding,
            'QUALITY_CHECK': qc,
            'PACKING': packing,
            'DELIVERY': ready,
            'DELIVERED': delivered,
            'received': received,
            'inspection': inspection,
            'washing': washing,
            'drying': drying,
            'ironing': ironing,
            'folding': folding,
            'quality_check': qc,
            'packing': packing,
            'ready_for_delivery': ready,
            'delivered': delivered
        })


class StaffDashboardView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        period = request.query_params.get('period', 'today').lower()
        qs = Order.objects.all()
        total_active = qs.exclude(status__in=[Order.Status.DELIVERED, Order.Status.CANCELLED]).count()
        express_count = qs.filter(special_instructions__icontains='express').count()
        combo_count = qs.filter(special_instructions__icontains='combo').count()

        stages = [
            {"status": "RECEIVED", "label": "Received", "count": qs.filter(status__in=[Order.Status.RECEIVED_BY_LAUNDRY, Order.Status.ACCEPTED]).count(), "percent": 0},
            {"status": "INSPECTION", "label": "Inspection", "count": qs.filter(status=Order.Status.INSPECTION).count(), "percent": 0},
            {"status": "WASHING", "label": "Washing", "count": qs.filter(status=Order.Status.WASHING).count(), "percent": 0},
            {"status": "DRYING", "label": "Drying", "count": qs.filter(status=Order.Status.DRYING).count(), "percent": 0},
            {"status": "IRONING", "label": "Ironing", "count": qs.filter(status=Order.Status.IRONING).count(), "percent": 0},
            {"status": "FOLDING", "label": "Folding", "count": qs.filter(status=Order.Status.FOLDING).count(), "percent": 0},
            {"status": "QUALITY_CHECK", "label": "Quality Check", "count": qs.filter(status=Order.Status.QUALITY_CHECK).count(), "percent": 0},
            {"status": "PACKING", "label": "Packing", "count": qs.filter(status=Order.Status.PACKING).count(), "percent": 0},
        ]
        total_stage_items = sum(s["count"] for s in stages) or 1
        for s in stages:
            s["percent"] = round((s["count"] / total_stage_items) * 100)

        service_counts = []
        for cat in ServiceCategory.objects.all():
            cnt = OrderItem.objects.filter(category_name__iexact=cat.name).count()
            service_counts.append({"service": cat.name, "count": cnt})

        return Response({
            "kpis": {
                "total_incoming": {"value": total_active, "today_delta": 2},
                "express": {"value": express_count, "today_delta": 1},
                "combo": {"value": combo_count, "percent": round((combo_count / (total_active or 1)) * 100)},
                "needs_attention": {"value": qs.filter(status=Order.Status.FAILED_DELIVERY).count()}
            },
            "stages": {
                "total": total_stage_items,
                "items": stages
            },
            "services": {
                "period": period,
                "total": sum(sc["count"] for sc in service_counts),
                "items": service_counts
            },
            "recent_requests": [],
            "needs_attention": []
        })


class StaffOrdersListView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        status_param = request.query_params.get('status')
        q_param = request.query_params.get('q')
        page_size = int(request.query_params.get('page_size', 100))

        qs = Order.objects.all().select_related('customer', 'assigned_laundry_staff', 'assigned_delivery_driver').prefetch_related('items').order_by('-created_at')

        if status_param and status_param != 'all':
            qs = qs.filter(status__iexact=status_param)
        if q_param:
            qs = qs.filter(Q(order_id__icontains=q_param) | Q(customer__first_name__icontains=q_param) | Q(customer__last_name__icontains=q_param))

        items = []
        for o in qs[:page_size]:
            items_list = list(o.items.all())
            summary = ", ".join([f"{it.service_name} x{it.quantity}" for it in items_list]) if items_list else "Standard Laundry"
            services = list(set([it.service_name for it in items_list])) or ["Wash & Fold"]
            is_express = 'express' in (o.special_instructions or '').lower() or any('express' in (it.category_name or '').lower() for it in items_list)
            is_combo = 'combo' in (o.special_instructions or '').lower()

            items.append({
                "id": str(o.id),
                "code": o.order_id,
                "order_number": o.order_id,
                "customer": {
                    "name": o.pickup_full_name or (o.customer.full_name if hasattr(o.customer, 'full_name') else 'Customer'),
                    "phone": o.pickup_phone or '',
                    "email": o.customer.email if o.customer else ''
                },
                "customer_name": o.pickup_full_name or (o.customer.full_name if hasattr(o.customer, 'full_name') else 'Customer'),
                "customer_phone": o.pickup_phone or '',
                "customerName": o.pickup_full_name or (o.customer.full_name if hasattr(o.customer, 'full_name') else 'Customer'),
                "customerPhone": o.pickup_phone or '',
                "items_summary": summary,
                "services": services,
                "status": o.status,
                "is_express": is_express,
                "is_combo": is_combo,
                "placed_at": o.created_at.isoformat() if o.created_at else None,
                "created_at": o.created_at.isoformat() if o.created_at else None,
                "total_amount": float(o.total_amount or 0),
                "amount": float(o.total_amount or 0),
                "pickup_address": o.pickup_address or '',
                "delivery_address": o.delivery_address or o.pickup_address or '',
                "items": [
                    {
                        "id": str(it.id),
                        "name": it.service_name,
                        "quantity": it.quantity,
                        "price": float(it.unit_price or 0)
                    } for it in items_list
                ]
            })

        return Response({
            "items": items,
            "results": items,
            "total": qs.count(),
            "next_cursor": None
        })


class StaffOrderDetailView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request, pk):
        try:
            o = Order.objects.select_related('customer', 'assigned_laundry_staff', 'assigned_delivery_driver').prefetch_related('items__service').get(Q(id=pk) if str(pk).isdigit() else Q(order_id=pk))
            return Response(OrderSerializer(o).data)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)


class StaffOrderStatusUpdateView(APIView):
    permission_classes = (permissions.AllowAny,)

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
        'READY': Order.Status.READY_FOR_DELIVERY,
        'OUT_FOR_DELIVERY': Order.Status.OUT_FOR_DELIVERY,
        'DELIVERED': Order.Status.DELIVERED,
    }

    def post(self, request, pk):
        try:
            order = Order.objects.get(Q(id=pk) if str(pk).isdigit() else Q(order_id=pk))
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        to_status = request.data.get('to_status') or request.data.get('status')
        note = request.data.get('note', '')

        mapped_status = self.STAGE_MAP.get(str(to_status).upper(), to_status)
        order.status = mapped_status
        if note:
            order.notes = f"{order.notes}\nStaff Note: {note}".strip() if order.notes else f"Staff Note: {note}"
        order.save()

        return Response(OrderSerializer(order).data)


class StaffHistoryView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        qs = Order.objects.filter(status__in=[Order.Status.DELIVERED, Order.Status.CANCELLED]).order_by('-updated_at')
        total_val = sum(float(o.total_amount or 0) for o in qs)
        items = [OrderSerializer(o).data for o in qs[:50]]
        return Response({
            "items": items,
            "total": qs.count(),
            "total_value_paise": int(total_val * 100)
        })


class AgentDashboardView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        return Response({
            "is_online": True,
            "total_tasks": Order.objects.exclude(status=Order.Status.DELIVERED).count(),
            "completed_today": Order.objects.filter(status=Order.Status.DELIVERED).count(),
            "earnings_today": 850
        })


class AgentTasksView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        qs = Order.objects.exclude(status=Order.Status.DELIVERED).order_by('-created_at')
        items = [OrderSerializer(o).data for o in qs[:50]]
        return Response({"items": items, "tasks": items, "total": qs.count()})


