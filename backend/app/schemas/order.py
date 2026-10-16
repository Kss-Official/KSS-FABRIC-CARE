from typing import List, Optional, Any, Dict, Union
from pydantic import BaseModel, ConfigDict, Field


class OrderItemServiceInput(BaseModel):
    service_id: str
    name: str
    price_paise: int


class OrderItemInput(BaseModel):
    garment_type_id: str
    quantity: int = Field(..., ge=1)
    service_ids: List[str] = Field(..., min_length=1)

    model_config = ConfigDict(extra="forbid")


class PickupSlot(BaseModel):
    date: str
    from_: str = Field(..., alias="from")
    to: str

    model_config = ConfigDict(populate_by_name=True, extra="forbid")


class OrderCreateRequest(BaseModel):
    address_id: str
    pickup_slot: PickupSlot
    is_express: bool = False
    notes: Optional[str] = None
    items: List[OrderItemInput] = Field(..., min_length=1)

    model_config = ConfigDict(populate_by_name=True, extra="forbid")


class OrderCancelRequest(BaseModel):
    reason: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class OrderItemService(BaseModel):
    service_id: str
    name: str
    price_paise: int


class OrderItemResponse(BaseModel):
    garment_id: Optional[str] = None
    garment: str
    quantity: int
    services: Union[List[str], List[OrderItemService]]
    unit_price_paise: int
    combo_resolved: Optional[bool] = False

    model_config = ConfigDict(extra="ignore")


class CustomerSummary(BaseModel):
    name: str
    phone: str

    model_config = ConfigDict(extra="ignore")


class OrderResponse(BaseModel):
    id: str
    code: str
    status: str
    payment_status: str
    is_express: bool
    is_combo: bool
    items: List[OrderItemResponse]
    subtotal_paise: int
    express_charge_paise: int
    total_paise: int
    created_at: Optional[str] = None
    placed_at: Optional[str] = None
    due_by: Optional[str] = None
    received_at: Optional[str] = None
    delivered_at: Optional[str] = None
    cancelled_at: Optional[str] = None
    customer: Optional[CustomerSummary] = None
    address: Optional[Dict[str, Any]] = None
    pickup: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    assigned_staff_id: Optional[str] = None
    assigned_staff_name: Optional[str] = None
    invoice_id: Optional[str] = None
    next_status: Optional[str] = None

    model_config = ConfigDict(extra="ignore")


class TrackingStep(BaseModel):
    status: str
    label: str
    done: bool
    at: Optional[str] = None


class TrackingAgent(BaseModel):
    name: str
    phone: str
    lat: Optional[float] = None
    lng: Optional[float] = None


class OrderTrackingResponse(BaseModel):
    code: str
    status: str
    steps: List[TrackingStep]
    agent: Optional[TrackingAgent] = None
    eta: Optional[str] = None

    model_config = ConfigDict(extra="ignore")


class StaffOrderItem(BaseModel):
    id: str
    code: str
    customer: CustomerSummary
    items_summary: str
    services: List[str]
    status: str
    is_express: bool
    is_combo: bool
    placed_at: Optional[str] = None
    next_status: Optional[str] = None

    model_config = ConfigDict(extra="ignore")


class StaffOrderCounts(BaseModel):
    all: int
    RECEIVED: int
    INSPECTION: int
    WASHING: int
    DRYING: int
    IRONING: int
    FOLDING: int
    QUALITY_CHECK: int
    PACKING: int
    DELIVERY: int
    DELIVERED: int

    model_config = ConfigDict(extra="ignore")


class StaffStatusUpdateRequest(BaseModel):
    to_status: str
    note: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class StaffComboResolveRequest(BaseModel):
    note: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class StaffHistoryItem(BaseModel):
    id: str
    code: str
    customer: CustomerSummary
    items_summary: str
    services: List[str]
    delivered_at: Optional[str] = None
    amount_paise: int
    status: str

    model_config = ConfigDict(extra="ignore")


class StaffHistoryResponse(BaseModel):
    items: List[StaffHistoryItem]
    next_cursor: Optional[str] = None
    total: int
    total_value_paise: int

    model_config = ConfigDict(extra="ignore")


class AdminAssignStaffRequest(BaseModel):
    staff_id: str

    model_config = ConfigDict(extra="forbid")


class AdminOrderStatusOverride(BaseModel):
    to_status: str
    note: str = Field(..., min_length=1)

    model_config = ConfigDict(extra="forbid")
