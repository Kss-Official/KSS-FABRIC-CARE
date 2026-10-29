from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class StaffKpiTotalIncoming(BaseModel):
    value: int
    today_delta: int


class StaffKpiExpress(BaseModel):
    value: int
    today_delta: int


class StaffKpiCombo(BaseModel):
    value: int
    percent: int


class StaffKpiNeedsAttention(BaseModel):
    value: int


class StaffDashboardKpis(BaseModel):
    total_incoming: StaffKpiTotalIncoming
    express: StaffKpiExpress
    combo: StaffKpiCombo
    needs_attention: StaffKpiNeedsAttention


class StaffStageItem(BaseModel):
    status: str
    label: str
    count: int
    percent: int


class StaffStages(BaseModel):
    total: int
    items: List[StaffStageItem]


class StaffServiceItem(BaseModel):
    service: str
    count: int


class StaffServices(BaseModel):
    period: str
    total: int
    items: List[StaffServiceItem]


class StaffRecentRequest(BaseModel):
    id: str
    code: str
    customer_name: str
    items: str
    services: List[str]
    tags: List[str]
    received_at: Optional[str] = None


class StaffAttentionItem(BaseModel):
    type: str
    title: str
    description: str
    order_id: str
    action: str


class StaffDashboardResponse(BaseModel):
    kpis: StaffDashboardKpis
    stages: StaffStages
    services: StaffServices
    recent_requests: List[StaffRecentRequest]
    attention: List[StaffAttentionItem]

    model_config = ConfigDict(extra="ignore")


# Admin Dashboard
class AdminKpis(BaseModel):
    orders_total: int
    revenue_paise: int
    active_customers: int
    pending_pickups: int


class AdminDailyCount(BaseModel):
    date: str
    count: int


class AdminDailyRevenue(BaseModel):
    date: str
    amount_paise: int


class AdminStageCount(BaseModel):
    status: str
    count: int


class AdminTopService(BaseModel):
    service: str
    count: int


class AdminStaffLoad(BaseModel):
    name: str
    active_orders: int


class AdminAgentsSummary(BaseModel):
    online: int
    total: int


class AdminDashboardResponse(BaseModel):
    kpis: AdminKpis
    orders_by_day: List[AdminDailyCount]
    revenue_by_day: List[AdminDailyRevenue]
    stages: List[AdminStageCount]
    top_services: List[AdminTopService]
    staff_load: List[AdminStaffLoad]
    agents: AdminAgentsSummary

    model_config = ConfigDict(extra="ignore")
