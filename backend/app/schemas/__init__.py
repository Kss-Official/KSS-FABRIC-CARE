from app.schemas.common import PaginatedResponse, ErrorResponse, ErrorDetail
from app.schemas.auth import (
    RegisterRequest,
    MeResponse,
    MeUpdateRequest,
    AdminUserCreate,
    AdminUserUpdate,
    AdminUserStatusUpdate,
    AdminUserResetPassword,
    UserItemResponse,
)
from app.schemas.catalog import (
    GarmentTypeItem,
    GarmentTypeCreate,
    GarmentTypeUpdate,
    ServiceItem,
    ServiceCreate,
    ServiceUpdate,
    PriceItem,
    CatalogResponse,
    AdminPricesUpdate,
)
from app.schemas.address import AddressCreate, AddressUpdate, AddressResponse
from app.schemas.order import (
    OrderCreateRequest,
    OrderCancelRequest,
    OrderResponse,
    OrderTrackingResponse,
    StaffOrderItem,
    StaffOrderCounts,
    StaffStatusUpdateRequest,
    StaffComboResolveRequest,
    StaffHistoryResponse,
    AdminAssignStaffRequest,
    AdminOrderStatusOverride,
)
from app.schemas.task import (
    TaskResponse,
    AgentDashboardResponse,
    AgentAvailabilityUpdate,
    AgentCompleteTaskRequest,
    AgentFailTaskRequest,
    AgentLocationUpdate,
    AgentVehicleUpdate,
    AdminAssignTaskRequest,
    AdminAgentItem,
)
from app.schemas.payment import (
    OrderPayRequest,
    OrderPayResponse,
    PaymentVerifyRequest,
    PaymentVerifyResponse,
    PaymentItemResponse,
)
from app.schemas.invoice import InvoiceItemResponse, InvoiceDetailResponse
from app.schemas.notification import NotificationItem, UnreadCountResponse, BroadcastRequest, BroadcastResponse
from app.schemas.support import (
    TicketCreateRequest,
    TicketMessageInput,
    TicketItemResponse,
    TicketDetailResponse,
    TicketStatusUpdate,
)
from app.schemas.dashboard import StaffDashboardResponse, AdminDashboardResponse
