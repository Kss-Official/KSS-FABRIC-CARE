from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.order import OrderResponse


class OrderPayRequest(BaseModel):
    method: str = Field(..., pattern="^(upi|card)$")

    model_config = ConfigDict(extra="forbid")


class OrderPayResponse(BaseModel):
    payment_id: str
    gateway_order_id: str
    amount_paise: int
    gateway_key: Optional[str] = None

    model_config = ConfigDict(extra="ignore")


class PaymentVerifyRequest(BaseModel):
    payment_id: str
    gateway_payload: Dict[str, Any]

    model_config = ConfigDict(extra="forbid")


class PaymentVerifyResponse(BaseModel):
    status: str
    order: OrderResponse

    model_config = ConfigDict(extra="ignore")


class PaymentItemResponse(BaseModel):
    id: str
    order_code: str
    amount_paise: int
    method: str
    status: str
    created_at: str

    model_config = ConfigDict(extra="ignore")
