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
    ContentPolicyViewSet
)

router = DefaultRouter()
router.register('services/categories', ServiceCategoryViewSet, basename='service-category')
router.register('services', ServiceViewSet, basename='service')
router.register('orders', OrderViewSet, basename='order')
router.register('addresses', AddressViewSet, basename='address')
router.register('invoices', InvoiceViewSet, basename='invoice')
router.register('notifications', NotificationViewSet, basename='notification')
router.register('support', SupportTicketViewSet, basename='support')
router.register('faqs', ContentFAQViewSet, basename='faq')
router.register('policies', ContentPolicyViewSet, basename='policy')

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

    # Auth endpoints
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/me/', MeView.as_view(), name='auth-me'),
    path('staff/', StaffListView.as_view(), name='staff-list'),

    # Admin workflows
    path('admin/dashboard/', AdminDashboardStatsView.as_view(), name='admin-dashboard'),
    path('admin/orders/<int:pk>/accept/', AdminAcceptOrderView.as_view(), name='admin-accept-order'),
    path('admin/orders/<int:pk>/reject/', AdminRejectOrderView.as_view(), name='admin-reject-order'),
    path('admin/orders/<int:pk>/assign-staff/', AdminAssignStaffView.as_view(), name='admin-assign-staff'),
    path('admin/complaints/', AdminComplaintReportsView.as_view(), name='admin-complaints'),
    path('admin/complaints/<int:pk>/', AdminComplaintDetailView.as_view(), name='admin-complaint-detail'),
    path('admin/complaints/<int:pk>/reschedule/', AdminComplaintRescheduleView.as_view(), name='admin-complaint-reschedule'),

    # Customer Reports
    path('customer/reports/', CustomerReportsView.as_view(), name='customer-reports'),
    path('customer/reports/<int:pk>/', CustomerReportDetailView.as_view(), name='customer-report-detail'),

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
    path('auth/login/', LoginView.as_view(), name='direct-auth-login'),
    path('auth/register/', RegisterView.as_view(), name='direct-auth-register'),
    path('auth/me/', MeView.as_view(), name='direct-auth-me'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
