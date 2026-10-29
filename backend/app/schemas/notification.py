from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class NotificationItem(BaseModel):
    id: str
    type: str
    title: str
    body: str
    order_id: Optional[str] = None
    is_read: bool = False
    created_at: str

    model_config = ConfigDict(extra="ignore")


class UnreadCountResponse(BaseModel):
    count: int

    model_config = ConfigDict(extra="ignore")


class BroadcastRequest(BaseModel):
    audience: str = Field(..., pattern="^(all|customers|staff|agents)$")
    title: str = Field(..., min_length=1, max_length=100)
    body: str = Field(..., min_length=1, max_length=500)

    model_config = ConfigDict(extra="forbid")


class BroadcastResponse(BaseModel):
    sent_to: int

    model_config = ConfigDict(extra="ignore")
