from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query, Response, status
from app.core.deps import require_role
from app.core.errors import NotFoundError, ForbiddenError
from app.schemas.common import PaginatedResponse
from app.schemas.task import (
    TaskResponse,
    AgentDashboardResponse,
    AgentAvailabilityUpdate,
    AgentCompleteTaskRequest,
    AgentFailTaskRequest,
    AgentLocationUpdate,
    AgentVehicleUpdate,
)
from app.repositories import task_repo, user_repo
from app.services import task_service


router = APIRouter(prefix="/agent", tags=["agent"])


@router.get("/dashboard", response_model=AgentDashboardResponse)
def get_dashboard(current_user: Dict[str, Any] = Depends(require_role("agent"))):
    agent_id = current_user["id"]
    prof = current_user.get("agent_profile", {})
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_stats = task_repo.get_agent_today_stats(agent_id, today_str)
    next_task = task_repo.get_agent_next_task(agent_id)

    return AgentDashboardResponse(
        is_online=prof.get("is_online", False),
        today=today_stats,
        next_task=next_task,
    )


@router.patch("/availability", response_model=AgentAvailabilityUpdate)
def update_availability(
    request: AgentAvailabilityUpdate,
    current_user: Dict[str, Any] = Depends(require_role("agent")),
):
    prof = current_user.get("agent_profile", {})
    prof["is_online"] = request.is_online
    user_repo.update_user(current_user["id"], {"agent_profile": prof})
    return request


@router.get("/tasks", response_model=List[TaskResponse])
def list_tasks(
    type: Optional[str] = Query(None, pattern="^(pickup|delivery)$"),
    status: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(require_role("agent")),
):
    return task_repo.list_agent_tasks(
        agent_id=current_user["id"],
        task_type=type,
        status=status,
        date_str=date,
    )


@router.post("/tasks/{id}/start", response_model=TaskResponse)
def start_task(
    id: str,
    current_user: Dict[str, Any] = Depends(require_role("agent")),
):
    return task_service.start_task(id, current_user["id"])


@router.post("/tasks/{id}/complete", response_model=TaskResponse)
def complete_task(
    id: str,
    request: AgentCompleteTaskRequest,
    current_user: Dict[str, Any] = Depends(require_role("agent")),
):
    return task_service.complete_task(
        task_id=id,
        otp=request.otp,
        notes=request.notes,
        agent_id=current_user["id"],
    )


@router.post("/tasks/{id}/fail", response_model=TaskResponse)
def fail_task(
    id: str,
    request: AgentFailTaskRequest,
    current_user: Dict[str, Any] = Depends(require_role("agent")),
):
    return task_service.fail_task(
        task_id=id,
        reason=request.reason,
        agent_id=current_user["id"],
    )


@router.get("/tasks/history", response_model=PaginatedResponse[TaskResponse])
def get_task_history(
    type: Optional[str] = Query(None, pattern="^(pickup|delivery)$"),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    page_size: int = Query(10, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(require_role("agent")),
):
    items, next_cursor, total = task_repo.list_agent_task_history(
        agent_id=current_user["id"],
        task_type=type,
        from_date=from_date,
        to_date=to_date,
        page_size=page_size,
        cursor=cursor,
    )
    return PaginatedResponse(items=items, next_cursor=next_cursor, total=total)


@router.post("/location", status_code=status.HTTP_204_NO_CONTENT)
def update_location(
    request: AgentLocationUpdate,
    current_user: Dict[str, Any] = Depends(require_role("agent")),
):
    prof = current_user.get("agent_profile", {})
    prof["last_lat"] = request.lat
    prof["last_lng"] = request.lng
    prof["last_seen_at"] = datetime.now(timezone.utc).isoformat()
    user_repo.update_user(current_user["id"], {"agent_profile": prof})
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/vehicle", status_code=status.HTTP_200_OK)
def update_vehicle(
    request: AgentVehicleUpdate,
    current_user: Dict[str, Any] = Depends(require_role("agent")),
):
    prof = current_user.get("agent_profile", {})
    prof["vehicle_type"] = request.vehicle_type
    prof["vehicle_number"] = request.vehicle_number
    user_repo.update_user(current_user["id"], {"agent_profile": prof})
    return {"vehicle_type": request.vehicle_type, "vehicle_number": request.vehicle_number}
