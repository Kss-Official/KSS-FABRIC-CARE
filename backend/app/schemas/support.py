from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class TicketCreateRequest(BaseModel):
    subject: str = Field(..., min_length=2, max_length=150)
    message: str = Field(..., min_length=2, max_length=2000)
    order_id: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class TicketMessageInput(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)

    model_config = ConfigDict(extra="forbid")


class TicketMessageItem(BaseModel):
    from_: str = Field(..., alias="from")
    text: str
    at: str

    model_config = ConfigDict(populate_by_name=True, extra="ignore")


class TicketItemResponse(BaseModel):
    id: str
    subject: str
    status: str
    updated_at: str
    customer_name: Optional[str] = None
    order_id: Optional[str] = None

    model_config = ConfigDict(extra="ignore")


class TicketDetailResponse(BaseModel):
    id: str
    subject: str
    status: str
    customer_id: str
    customer_name: str
    order_id: Optional[str] = None
    created_at: str
    last_message_at: str
    messages: List[TicketMessageItem]

    model_config = ConfigDict(extra="ignore")


class TicketStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(open|closed)$")

    model_config = ConfigDict(extra="forbid")
