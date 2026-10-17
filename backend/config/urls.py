from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

from apps.users.views import (
    RegisterView, LoginView, MeView, AddressViewSet, StaffListView
)
from apps.core.views import (
    ServiceCategoryViewSet,
    ServiceViewSet,
    OrderViewSet,
    AdminAcceptOrderView,
    AdminRejectOrderView,
    AdminAssignStaffView,
    AdminDashboardStatsView,
    AdminComplaintReportsView,
    AdminComplaintDetailView,
    AdminComplaintRescheduleView,
    CustomerReportsView,
    CustomerReportDetailView,
    DeliveryTasksListView,
    DeliveryConfirmPickupView,
    DeliveryDropoffLaundryView,
    DeliveryConfirmDeliveryView,
    DeliveryFailDeliveryView,
    LaundryOrdersListView,
    LaundryConfirmReceiptView,
    LaundryAdvanceStageView,
    LaundryQualityCheckView,
    LaundryPackOrderView,
    NotificationViewSet,
    SupportTicketViewSet,
    InvoiceViewSet,
    ContentFAQViewSet,
    ContentPolicyViewSet,
    customer_catalog_view,
    AdminTasksView,
    AdminTaskAssignView,
    AdminAgentsView,
    AdminUsersView,
    AdminUserDetailView,
    AdminUserStatusView,
    AdminUserResetPasswordView,
    AdminPricesView,
    AdminGarmentsView,
    AdminGarmentDetailView,
    AdminBroadcastNotificationView,
    payment_verify_view
)

router = DefaultRouter()
router.register('services/categories', ServiceCategoryViewSet, basename='service-category')
router.register('services', ServiceViewSet, basename='service')
router.register('orders', OrderViewSet, basename='order')
router.register('customer/orders', OrderViewSet, basename='customer-order')
router.register('addresses', AddressViewSet, basename='address')
router.register('customer/addresses', AddressViewSet, basename='customer-address')
router.register('invoices', InvoiceViewSet, basename='invoice')
router.register('customer/invoices', InvoiceViewSet, basename='customer-invoice')
router.register('notifications', NotificationViewSet, basename='notification')
router.register('support', SupportTicketViewSet, basename='support')
router.register('customer/support/tickets', SupportTicketViewSet, basename='customer-support-ticket')
router.register('faqs', ContentFAQViewSet, basename='faq')
router.register('policies', ContentPolicyViewSet, basename='policy')

# Admin router endpoints
router.register('admin/orders', OrderViewSet, basename='admin-order')
router.register('admin/services', ServiceViewSet, basename='admin-service')
router.register('admin/support/tickets', SupportTicketViewSet, basename='admin-support-ticket')
router.register('admin/notifications', NotificationViewSet, basename='admin-notification')
router.register('admin/garments', ServiceCategoryViewSet, basename='admin-garments')

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({
        "status": "healthy",
        "service": "FabriCare / Laundrix API",
        "version": "1.0.0"
    })

api_urlpatterns = [
    # Health check
    path('health/', health_check, name='api-health'),

    # Catalog endpoints (compatible with both FastAPI and Django frontend clients)
    path('customer/catalog', customer_catalog_view, name='customer-catalog-no-slash'),
    path('customer/catalog/', customer_catalog_view, name='customer-catalog'),
    path('catalog', customer_catalog_view, name='catalog-no-slash'),
    path('catalog/', customer_catalog_view, name='catalog'),

    # Auth endpoints
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/me/', MeView.as_view(), name='auth-me'),
    path('staff/', StaffListView.as_view(), name='staff-list'),

    # Admin workflows & endpoints
    path('admin/dashboard', AdminDashboardStatsView.as_view(), name='admin-dashboard-no-slash'),
    path('admin/dashboard/', AdminDashboardStatsView.as_view(), name='admin-dashboard'),
    path('admin/orders', OrderViewSet.as_view({'get': 'list', 'post': 'create'}), name='admin-orders-list-no-slash'),
    path('admin/orders/', OrderViewSet.as_view({'get': 'list', 'post': 'create'}), name='admin-orders-list'),
    path('admin/orders/<int:pk>/accept/', AdminAcceptOrderView.as_view(), name='admin-accept-order'),
    path('admin/orders/<int:pk>/reject/', AdminRejectOrderView.as_view(), name='admin-reject-order'),
    path('admin/orders/<int:pk>/assign-staff/', AdminAssignStaffView.as_view(), name='admin-assign-staff'),
    path('admin/complaints', AdminComplaintReportsView.as_view(), name='admin-complaints-no-slash'),
    path('admin/complaints/', AdminComplaintReportsView.as_view(), name='admin-complaints'),
    path('admin/complaints/<str:pk>', AdminComplaintDetailView.as_view(), name='admin-complaint-detail-no-slash'),
    path('admin/complaints/<str:pk>/', AdminComplaintDetailView.as_view(), name='admin-complaint-detail'),
    path('admin/complaints/<str:pk>/reschedule', AdminComplaintRescheduleView.as_view(), name='admin-complaint-reschedule-no-slash'),
    path('admin/complaints/<str:pk>/reschedule/', AdminComplaintRescheduleView.as_view(), name='admin-complaint-reschedule'),

    # Admin Tasks & Agents
    path('admin/tasks', AdminTasksView.as_view(), name='admin-tasks-no-slash'),
    path('admin/tasks/', AdminTasksView.as_view(), name='admin-tasks'),
    path('admin/tasks/<int:pk>/assign', AdminTaskAssignView.as_view(), name='admin-task-assign-no-slash'),
    path('admin/tasks/<int:pk>/assign/', AdminTaskAssignView.as_view(), name='admin-task-assign'),
    path('admin/agents', AdminAgentsView.as_view(), name='admin-agents-no-slash'),
    path('admin/agents/', AdminAgentsView.as_view(), name='admin-agents'),

    # Admin Users Management
    path('admin/users', AdminUsersView.as_view(), name='admin-users-no-slash'),
    path('admin/users/', AdminUsersView.as_view(), name='admin-users'),
    path('admin/users/<int:pk>', AdminUserDetailView.as_view(), name='admin-user-detail-no-slash'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/users/<int:pk>/status', AdminUserStatusView.as_view(), name='admin-user-status-no-slash'),
    path('admin/users/<int:pk>/status/', AdminUserStatusView.as_view(), name='admin-user-status'),
    path('admin/users/<int:pk>/reset-password', AdminUserResetPasswordView.as_view(), name='admin-user-reset-pwd-no-slash'),
    path('admin/users/<int:pk>/reset-password/', AdminUserResetPasswordView.as_view(), name='admin-user-reset-pwd'),

    # Admin Services, Garments, Prices, Notifications
    path('admin/services', ServiceViewSet.as_view({'get': 'list', 'post': 'create'}), name='admin-services-no-slash'),
    path('admin/services/', ServiceViewSet.as_view({'get': 'list', 'post': 'create'}), name='admin-services-slash'),
    path('admin/garments', AdminGarmentsView.as_view(), name='admin-garments-no-slash'),
    path('admin/garments/', AdminGarmentsView.as_view(), name='admin-garments-slash'),
    path('admin/garments/<int:pk>', AdminGarmentDetailView.as_view(), name='admin-garment-detail-no-slash'),
    path('admin/garments/<int:pk>/', AdminGarmentDetailView.as_view(), name='admin-garment-detail-slash'),
    path('admin/prices', AdminPricesView.as_view(), name='admin-prices-no-slash'),
    path('admin/prices/', AdminPricesView.as_view(), name='admin-prices-slash'),
    path('admin/support/tickets', SupportTicketViewSet.as_view({'get': 'list', 'post': 'create'}), name='admin-tickets-no-slash'),
    path('admin/support/tickets/', SupportTicketViewSet.as_view({'get': 'list', 'post': 'create'}), name='admin-tickets-slash'),
    path('admin/support/tickets/<str:pk>', SupportTicketViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='admin-ticket-detail-no-slash'),
    path('admin/support/tickets/<str:pk>/', SupportTicketViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='admin-ticket-detail-slash'),
    path('admin/support/tickets/<str:pk>/reply', SupportTicketViewSet.as_view({'post': 'reply'}), name='admin-ticket-reply-no-slash'),
    path('admin/support/tickets/<str:pk>/reply/', SupportTicketViewSet.as_view({'post': 'reply'}), name='admin-ticket-reply-slash'),
    path('admin/support/tickets/<str:pk>/resolve', SupportTicketViewSet.as_view({'post': 'mark_resolved'}), name='admin-ticket-resolve-no-slash'),
    path('admin/support/tickets/<str:pk>/resolve/', SupportTicketViewSet.as_view({'post': 'mark_resolved'}), name='admin-ticket-resolve-slash'),
    path('admin/support/tickets/<str:pk>/status', SupportTicketViewSet.as_view({'patch': 'update_status', 'post': 'update_status'}), name='admin-ticket-status-no-slash'),
    path('admin/support/tickets/<str:pk>/status/', SupportTicketViewSet.as_view({'patch': 'update_status', 'post': 'update_status'}), name='admin-ticket-status-slash'),
    path('admin/notifications/broadcast', AdminBroadcastNotificationView.as_view(), name='admin-broadcast-no-slash'),
    path('admin/notifications/broadcast/', AdminBroadcastNotificationView.as_view(), name='admin-broadcast-slash'),

    # Payment verification
    path('payments/verify', payment_verify_view, name='payments-verify-no-slash'),
    path('payments/verify/', payment_verify_view, name='payments-verify-slash'),

    # Customer orders, addresses, notifications non-slash & slash paths
    path('customer/orders', OrderViewSet.as_view({'get': 'list', 'post': 'create'}), name='customer-orders-no-slash'),
    path('customer/orders/', OrderViewSet.as_view({'get': 'list', 'post': 'create'}), name='customer-orders-slash'),
    path('customer/orders/<str:pk>', OrderViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='customer-order-detail-no-slash'),
    path('customer/orders/<str:pk>/', OrderViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='customer-order-detail-slash'),
    path('customer/orders/<str:pk>/cancel', OrderViewSet.as_view({'post': 'cancel_order'}), name='customer-order-cancel-no-slash'),
    path('customer/orders/<str:pk>/cancel/', OrderViewSet.as_view({'post': 'cancel_order'}), name='customer-order-cancel-slash'),
    path('customer/orders/<str:pk>/pay', OrderViewSet.as_view({'post': 'pay_order'}), name='customer-order-pay-no-slash'),
    path('customer/orders/<str:pk>/pay/', OrderViewSet.as_view({'post': 'pay_order'}), name='customer-order-pay-slash'),
    path('customer/orders/<str:pk>/tracking', OrderViewSet.as_view({'get': 'get_tracking'}), name='customer-order-tracking-no-slash'),
    path('customer/orders/<str:pk>/tracking/', OrderViewSet.as_view({'get': 'get_tracking'}), name='customer-order-tracking-slash'),
    path('customer/addresses', AddressViewSet.as_view({'get': 'list', 'post': 'create'}), name='customer-addresses-no-slash'),
    path('customer/addresses/', AddressViewSet.as_view({'get': 'list', 'post': 'create'}), name='customer-addresses-slash'),
    path('customer/invoices', InvoiceViewSet.as_view({'get': 'list'}), name='customer-invoices-no-slash'),
    path('customer/invoices/', InvoiceViewSet.as_view({'get': 'list'}), name='customer-invoices-slash'),
    path('customer/invoices/<str:pk>', InvoiceViewSet.as_view({'get': 'retrieve'}), name='customer-invoice-detail-no-slash'),
    path('customer/invoices/<str:pk>/', InvoiceViewSet.as_view({'get': 'retrieve'}), name='customer-invoice-detail-slash'),
    path('notifications', NotificationViewSet.as_view({'get': 'list', 'post': 'create'}), name='notifications-no-slash'),
    path('notifications/', NotificationViewSet.as_view({'get': 'list', 'post': 'create'}), name='notifications-slash'),

    # Customer Reports
    path('customer/reports', CustomerReportsView.as_view(), name='customer-reports-no-slash'),
    path('customer/reports/', CustomerReportsView.as_view(), name='customer-reports'),
    path('customer/reports/<str:pk>', CustomerReportDetailView.as_view(), name='customer-report-detail-no-slash'),
    path('customer/reports/<str:pk>/', CustomerReportDetailView.as_view(), name='customer-report-detail'),

    # Delivery Staff workflows
    path('delivery/tasks/', DeliveryTasksListView.as_view(), name='delivery-tasks'),
    path('delivery/tasks/<int:pk>/confirm-pickup/', DeliveryConfirmPickupView.as_view(), name='delivery-confirm-pickup'),
    path('delivery/tasks/<int:pk>/dropoff-laundry/', DeliveryDropoffLaundryView.as_view(), name='delivery-dropoff-laundry'),
    path('delivery/tasks/<int:pk>/confirm-delivery/', DeliveryConfirmDeliveryView.as_view(), name='delivery-confirm-delivery'),
    path('delivery/tasks/<int:pk>/fail-delivery/', DeliveryFailDeliveryView.as_view(), name='delivery-fail-delivery'),

    # Laundry Staff workflows
    path('laundry/orders/', LaundryOrdersListView.as_view(), name='laundry-orders'),
    path('laundry/orders/<int:pk>/confirm-receipt/', LaundryConfirmReceiptView.as_view(), name='laundry-confirm-receipt'),
    path('laundry/orders/<int:pk>/advance-stage/', LaundryAdvanceStageView.as_view(), name='laundry-advance-stage'),
    path('laundry/orders/<int:pk>/quality-check/', LaundryQualityCheckView.as_view(), name='laundry-quality-check'),
    path('laundry/orders/<int:pk>/pack/', LaundryPackOrderView.as_view(), name='laundry-pack'),

    # Unified Router patterns
    path('', include(router.urls)),
]

urlpatterns = [
    path('', health_check, name='root-health'),
    path('admin/', admin.site.urls),
    path('api/', include(api_urlpatterns)),
    path('api/v1/', include(api_urlpatterns)),
    path('auth/login/', LoginView.as_view(), name='direct-auth-login'),
    path('auth/register/', RegisterView.as_view(), name='direct-auth-register'),
    path('auth/me/', MeView.as_view(), name='direct-auth-me'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
