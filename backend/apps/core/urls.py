from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ServiceCategoryViewSet,
    ServiceViewSet,
    OrderViewSet,
    AdminAcceptOrderView,
    AdminRejectOrderView,
    AdminAssignStaffView,
    AdminDashboardStatsView,
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
router.register('invoices', InvoiceViewSet, basename='invoice')
router.register('notifications', NotificationViewSet, basename='notification')
router.register('support', SupportTicketViewSet, basename='support')
router.register('faqs', ContentFAQViewSet, basename='faq')
router.register('policies', ContentPolicyViewSet, basename='policy')

urlpatterns = [
    # Admin workflows
    path('admin/dashboard/', AdminDashboardStatsView.as_view(), name='admin-dashboard'),
    path('admin/orders/<int:pk>/accept/', AdminAcceptOrderView.as_view(), name='admin-accept-order'),
    path('admin/orders/<int:pk>/reject/', AdminRejectOrderView.as_view(), name='admin-reject-order'),
    path('admin/orders/<int:pk>/assign-staff/', AdminAssignStaffView.as_view(), name='admin-assign-staff'),

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

    # Routers
    path('', include(router.urls)),
]
