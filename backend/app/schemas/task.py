from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class TaskCustomer(BaseModel):
    name: str
    phone: str

    model_config = ConfigDict(extra="ignore")


class TaskAddress(BaseModel):
    line1: str
    city: str
    lat: Optional[float] = None
    lng: Optional[float] = None

    model_config = ConfigDict(extra="ignore")


class TaskResponse(BaseModel):
    id: str
    type: str
    status: str
    order_code: str
    items_count: int
    customer: TaskCustomer
    address: TaskAddress
    scheduled_at: Optional[str] = None
    completed_at: Optional[str] = None
    order_id: Optional[str] = None
    agent_id: Optional[str] = None
    agent_name: Optional[str] = None
    fail_reason: Optional[str] = None

    model_config = ConfigDict(extra="ignore")


class AgentTodayStats(BaseModel):
    pickups_total: int = 0
    pickups_done: int = 0
    deliveries_total: int = 0
    deliveries_done: int = 0


class AgentDashboardResponse(BaseModel):
    is_online: bool
    today: AgentTodayStats
    next_task: Optional[TaskResponse] = None

    model_config = ConfigDict(extra="ignore")


class AgentAvailabilityUpdate(BaseModel):
    is_online: bool

    model_config = ConfigDict(extra="forbid")


class AgentCompleteTaskRequest(BaseModel):
    otp: str = Field(..., min_length=4, max_length=6)
    notes: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class AgentFailTaskRequest(BaseModel):
    reason: str = Field(..., min_length=2, max_length=200)

    model_config = ConfigDict(extra="forbid")


class AgentLocationUpdate(BaseModel):
    lat: float
    lng: float

    model_config = ConfigDict(extra="forbid")


class AgentVehicleUpdate(BaseModel):
    vehicle_type: str = Field(..., min_length=2, max_length=50)
    vehicle_number: str = Field(..., min_length=2, max_length=50)

    model_config = ConfigDict(extra="forbid")


class AdminAssignTaskRequest(BaseModel):
    agent_id: str

    model_config = ConfigDict(extra="forbid")


class AdminAgentItem(BaseModel):
    id: str
    name: str
    phone: str
    is_online: bool
    active_tasks: int

    model_config = ConfigDict(extra="ignore")
