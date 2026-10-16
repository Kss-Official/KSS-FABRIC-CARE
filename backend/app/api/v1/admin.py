from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query, Response, status, Request
from firebase_admin import auth as fb_auth
from app.core.deps import require_role
from app.core.errors import NotFoundError, ConflictError, ValidationError
from app.schemas.common import PaginatedResponse
from app.schemas.dashboard import AdminDashboardResponse
from app.schemas.order import (
    OrderResponse,
    AdminAssignStaffRequest,
    AdminOrderStatusOverride,
    OrderCancelRequest,
)
from app.schemas.task import (
    TaskResponse,
    AdminAgentItem,
    AdminAssignTaskRequest,
)
from app.schemas.auth import (
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
    AdminPricesUpdate,
)
from app.schemas.notification import BroadcastRequest, BroadcastResponse
from app.schemas.support import (
    TicketItemResponse,
    TicketDetailResponse,
    TicketMessageInput,
    TicketStatusUpdate,
)
from app.repositories import (
    user_repo,
    order_repo,
    task_repo,
    payment_repo,
    catalog_repo,
    notification_repo,
    support_repo,
    audit_repo,
)
from app.services import dashboard_service, status_service, task_service, payment_service


router = APIRouter(prefix="/admin", tags=["admin"])


# --- DASHBOARD ---
@router.get("/dashboard", response_model=AdminDashboardResponse)
def get_dashboard(
    period: str = Query("today", pattern="^(today|week|month)$"),
    current_user: Dict[str, Any] = Depends(require_role("admin")),
):
    return dashboard_service.get_admin_dashboard(period)


# --- ORDERS ---
@router.get("/orders", response_model=PaginatedResponse[OrderResponse])
def list_orders(
    status: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    page_size: int = Query(10, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(require_role("admin")),
):
    items, next_cursor, total = order_repo.list_admin_orders(
        status=status,
        q=q,
        from_date=from_date,
        to_date=to_date,
        page_size=page_size,
        cursor=cursor,
    )
    return PaginatedResponse(items=items, next_cursor=next_cursor, total=total)


@router.get("/orders/{id}")
def get_order_detail(
    id: str,
    current_user: Dict[str, Any] = Depends(require_role("admin")),
):
    order = order_repo.get_order(id)
    if not order:
        raise NotFoundError("Order not found")

    history = order_repo.get_order_history(id)
    payment = payment_repo.get_payment_by_order(id)
    pickup_task = task_repo.get_task_by_order_type(id, "pickup")
    delivery_task = task_repo.get_task_by_order_type(id, "delivery")

    return {
        **order,
        "history": history,
        "payments": [payment] if payment else [],
        "tasks": [t for t in [pickup_task, delivery_task] if t],
    }


@router.post("/orders/{id}/assign-staff", response_model=OrderResponse)
def assign_staff(
    id: str,
    request: AdminAssignStaffRequest,
    req: Request,
    current_user: Dict[str, Any] = Depends(require_role("admin")),
):
    order = order_repo.get_order(id)
    if not order:
        raise NotFoundError("Order not found")

    staff = user_repo.get_user(request.staff_id)
    if not staff or staff.get("role") != "staff":
        raise NotFoundError("Staff member not found")

    staff_name = staff.get("name", "Staff")
    order_repo.update_order(id, {
        "assigned_staff_id": request.staff_id,
        "assigned_staff_name": staff_name,
    })

    audit_repo.log_audit(
        actor_id=current_user["id"],
        action="ASSIGN_STAFF",
        entity="order",
        entity_id=id,
        before={"assigned_staff_id": order.get("assigned_staff_id")},
        after={"assigned_staff_id": request.staff_id, "assigned_staff_name": staff_name},
        ip=req.client.host if req.client else None,
    )

    return order_repo.get_order(id)


@router.post("/orders/{id}/status", response_model=OrderResponse)
def override_status(
    id: str,
    request: AdminOrderStatusOverride,
    req: Request,
    current_user: Dict[str, Any] = Depends(require_role("admin")),
):
    updated = status_service.change_status(
        order_id=id,
        to_status=request.to_status,
        actor=current_user,
        note=request.note,
        is_override=True,
        ip=req.client.host if req.client else None,
    )
    return updated


@router.post("/orders/{id}/cancel", response_model=OrderResponse)
def cancel_order(
    id: str,
    request: Optional[OrderCancelRequest] = None,
    req: Request = None,
    current_user: Dict[str, Any] = Depends(require_role("admin")),
):
    order = order_repo.get_order(id)
    if not order:
        raise NotFoundError("Order not found")

    reason = request.reason if request and request.reason else "Cancelled by admin"

    if order.get("payment_status") == "paid":
        payment_service.refund_order(id, reason=reason, actor=current_user)
        audit_repo.log_audit(
            actor_id=current_user["id"],
            action="ADMIN_CANCEL_REFUND",
            entity="order",
            entity_id=id,
            before={"status": order.get("status")},
            after={"status": "CANCELLED"},
            ip=req.client.host if req and req.client else None,
        )
        return order_repo.get_order(id)
    else:
        updated = status_service.change_status(
            order_id=id,
            to_status="CANCELLED",
            actor=current_user,
            note=reason,
            ip=req.client.host if req and req.client else None,
        )
        return updated


# --- PICKUP & DELIVERY TASKS ---
@router.get("/tasks", response_model=List[TaskResponse])
def list_tasks(
    type: Optional[str] = Query(None, pattern="^(pickup|delivery)$"),
    status: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    agent_id: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(require_role("admin")),
):
    return task_repo.list_admin_tasks(
        task_type=type,
        status=status,
        date_str=date,
        agent_id=agent_id,
    )


@router.get("/agents", response_model=List[AdminAgentItem])
def list_agents(
    available: Optional[bool] = Query(None),
    current_user: Dict[str, Any] = Depends(require_role("admin")),
):
    return user_repo.list_agents(available=available)


@router.post("/tasks/{id}/assign", response_model=TaskResponse)
def assign_task(
    id: str,
    request: AdminAssignTaskRequest,
    req: Request,
    current_user: Dict[str, Any] = Depends(require_role("admin")),
):
    task = task_service.assign_task_to_agent(
        task_id=id,
        agent_id=request.agent_id,
        admin_actor=current_user,
    )
    audit_repo.log_audit(
        actor_id=current_user["id"],
        action="ASSIGN_TASK_AGENT",
        entity="task",
        entity_id=id,
        before=None,
        after={"agent_id": request.agent_id},
        ip=req.client.host if req.client else None,
    )
    return task


# --- USERS ---
@router.get("/users", response_model=PaginatedResponse[UserItemResponse])
def list_users(
    role: Optional[str] = Query(None, pattern="^(customer|agent|staff|admin)$"),
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page_size: int = Query(10, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(require_role("admin")),
):
    items, next_cursor, total = user_repo.list_users(
        role=role,
        q=q,
        status=status,
        page_size=page_size,
        cursor=cursor,
    )
    res_items = [
        UserItemResponse(
            id=u["id"],
            name=u.get("name", ""),
            email=u.get("email", ""),
            phone=u.get("phone", ""),
            role=u.get("role", "customer"),
            is_active=u.get("is_active", True),
            created_at=u.get("created_at", ""),
        )
        for u in items
    ]
    return PaginatedResponse(items=res_items, next_cursor=next_cursor, total=total)


@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_user(
    request: AdminUserCreate,
    req: Request,
    current_user: Dict[str, Any] = Depends(require_role("admin")),
):
    if user_repo.get_user_by_phone(request.phone):
        raise ConflictError(f"Phone number {request.phone} is already registered")

    try:
        user_record = fb_auth.create_user(
            email=request.email,
            password=request.password,
            display_name=request.name,
        )
    except fb_auth.EmailAlreadyExistsError:
        raise ConflictError("An account with this email already exists")
    except Exception as e:
        raise ValidationError(f"Failed to create user account: {str(e)}")

    uid = user_record.uid
    fb_auth.set_custom_user_claims(uid, {"role": request.role})

    now_iso = datetime.now(timezone.utc).isoformat()
    user_data = {
        "id": uid,
        "name": request.name,
        "name_lower": request.name.lower(),
        "email": request.email.lower(),
        "phone": request.phone,
        "role": request.role,
        "avatar_url": None,
        "is_active": True,
        "last_login_at": None,
        "created_at": now_iso,
        "updated_at": now_iso,
    }

    if request.role == "agent":
        user_data["agent_profile"] = {
            "vehicle_type": "Bike",
            "vehicle_number": "Pending",
            "is_online": False,
            "last_lat": None,
            "last_lng": None,
            "last_seen_at": None,
            "active_tasks": 0,
        }
    elif request.role == "staff":
        user_data["staff_profile"] = {
            "employee_code": f"EMP-{uid[:5].upper()}",
            "shift": "Morning",
            "active_orders": 0,
        }

    from app.core.firebase import get_db
    db = get_db()
    tx = db.transaction()
    user_repo.create_user_transaction(tx, uid, user_data, request.phone)

    audit_repo.log_audit(
        actor_id=current_user["id"],
        action="CREATE_USER",
        entity="user",
        entity_id=uid,
        before=None,
        after={"email": request.email, "role": request.role},
        ip=req.client.host if req.client else None,
    )

    return {"id": uid, **user_data}


@router.patch("/users/{id}")
def update_user(
    id: str,
    request: AdminUserUpdate,
    req: Request,
    current_user: Dict[str, Any] = Depends(require_role("admin")),
):
    user = user_repo.get_user(id)
    if not user:
        raise NotFoundError("User not found")

    updates = request.model_dump(exclude_unset=True)
    if not updates:
        return user

    if "role" in updates and updates["role"] != user.get("role"):
        fb_auth.set_custom_user_claims(id, {"role": updates["role"]})
        fb_auth.revoke_refresh_tokens(id)

    updated = user_repo.update_user(id, updates)

    audit_repo.log_audit(
        actor_id=current_user["id"],
        action="UPDATE_USER",
        entity="user",
        entity_id=id,
        before=user,
        after=updated,
        ip=req.client.host if req.client else None,
    )
    return updated


@router.patch("/users/{id}/status")
def update_user_status(
    id: str,
    request: AdminUserStatusUpdate,
    req: Request,
    current_user: Dict[str, Any] = Depends(require_role("admin")),
):
    user = user_repo.get_user(id)
    if not user:
        raise NotFoundError("User not found")

    is_active = request.is_active
    try:
        fb_auth.update_user(id, disabled=not is_active)
        if not is_active:
            fb_auth.revoke_refresh_tokens(id)
    except Exception:
        pass

    updated = user_repo.update_user(id, {"is_active": is_active})

    audit_repo.log_audit(
        actor_id=current_user["id"],
        action="BLOCK_USER" if not is_active else "UNBLOCK_USER",
        entity="user",
        entity_id=id,
        before={"is_active": user.get("is_active")},
        after={"is_active": is_active},
        ip=req.client.host if req.client else None,
    )
    return updated


@router.post("/users/{id}/reset-password", status_code=status.HTTP_204_NO_CONTENT)
def reset_password(
    id: str,
    request: AdminUserResetPassword,
    req: Request,
    current_user: Dict[str, Any] = Depends(require_role("admin")),
):
    try:
        fb_auth.update_user(id, password=request.new_password)
        fb_auth.revoke_refresh_tokens(id)
    except Exception as e:
        raise ValidationError(f"Failed to reset password: {str(e)}")

    audit_repo.log_audit(
        actor_id=current_user["id"],
        action="RESET_PASSWORD",
        entity="user",
        entity_id=id,
        before=None,
        after=None,
        ip=req.client.host if req.client else None,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- SERVICES & PRICING ---
@router.get("/services", response_model=List[ServiceItem])
def list_services(current_user: Dict[str, Any] = Depends(require_role("admin"))):
    return catalog_repo.get_all_services()


@router.post("/services", response_model=ServiceItem, status_code=status.HTTP_201_CREATED)
def create_service(
    request: ServiceCreate,
    req: Request,
    current_user: Dict[str, Any] = Depends(require_role("admin")),
):
    svc = catalog_repo.create_service(request.name)
    audit_repo.log_audit(actor_id=current_user["id"], action="CREATE_SERVICE", entity="service", entity_id=svc["id"], ip=req.client.host if req.client else None)
    return svc


@router.patch("/services/{id}", response_model=ServiceItem)
def update_service(
    id: str,
    request: ServiceUpdate,
    req: Request,
    current_user: Dict[str, Any] = Depends(require_role("admin")),
):
    svc = catalog_repo.update_service(id, request.model_dump(exclude_unset=True))
    if not svc:
        raise NotFoundError("Service not found")
    audit_repo.log_audit(actor_id=current_user["id"], action="UPDATE_SERVICE", entity="service", entity_id=id, ip=req.client.host if req.client else None)
    return svc


@router.get("/garments", response_model=List[GarmentTypeItem])
def list_garments(current_user: Dict[str, Any] = Depends(require_role("admin"))):
    return catalog_repo.get_all_garments()


@router.post("/garments", response_model=GarmentTypeItem, status_code=status.HTTP_201_CREATED)
def create_garment(
    request: GarmentTypeCreate,
    req: Request,
    current_user: Dict[str, Any] = Depends(require_role("admin")),
):
    g = catalog_repo.create_garment(request.name)
    audit_repo.log_audit(actor_id=current_user["id"], action="CREATE_GARMENT", entity="garment", entity_id=g["id"], ip=req.client.host if req.client else None)
    return g


@router.patch("/garments/{id}", response_model=GarmentTypeItem)
def update_garment(
    id: str,
    request: GarmentTypeUpdate,
    req: Request,
    current_user: Dict[str, Any] = Depends(require_role("admin")),
):
    g = catalog_repo.update_garment(id, request.model_dump(exclude_unset=True))
    if not g:
        raise NotFoundError("Garment not found")
    audit_repo.log_audit(actor_id=current_user["id"], action="UPDATE_GARMENT", entity="garment", entity_id=id, ip=req.client.host if req.client else None)
    return g


@router.get("/prices")
def get_prices(current_user: Dict[str, Any] = Depends(require_role("admin"))):
    return catalog_repo.get_catalog_active()


@router.put("/prices", status_code=status.HTTP_204_NO_CONTENT)
def update_prices(
    request: AdminPricesUpdate,
    req: Request,
    current_user: Dict[str, Any] = Depends(require_role("admin")),
):
    catalog_repo.set_prices_batch([p.model_dump() for p in request.prices])
    audit_repo.log_audit(actor_id=current_user["id"], action="UPDATE_PRICES", entity="prices", entity_id="batch", ip=req.client.host if req.client else None)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- BROADCAST NOTIFICATIONS ---
@router.post("/notifications/broadcast", response_model=BroadcastResponse, status_code=status.HTTP_201_CREATED)
def broadcast_notifications(
    request: BroadcastRequest,
    req: Request,
    current_user: Dict[str, Any] = Depends(require_role("admin")),
):
    from app.core.firebase import get_db
    db = get_db()
    query = db.collection("users").where("is_active", "==", True)
    if request.audience == "customers":
        query = query.where("role", "==", "customer")
    elif request.audience == "staff":
        query = query.where("role", "==", "staff")
    elif request.audience == "agents":
        query = query.where("role", "==", "agent")

    user_docs = list(query.stream())
    user_ids = [d.id for d in user_docs]
    sent_count = notification_repo.batch_create_notifications(
        user_ids=user_ids,
        notif_data={"title": request.title, "body": request.body, "type": "broadcast"},
    )
    audit_repo.log_audit(actor_id=current_user["id"], action="BROADCAST_NOTIFICATION", entity="notification", entity_id="broadcast", after={"audience": request.audience, "count": sent_count}, ip=req.client.host if req.client else None)
    return BroadcastResponse(sent_to=sent_count)


# --- CONTACT / SUPPORT ---
@router.get("/support/tickets", response_model=PaginatedResponse[TicketItemResponse])
def list_support_tickets(
    status: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    page_size: int = Query(10, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(require_role("admin")),
):
    items, next_cursor, total = support_repo.list_tickets(
        status=status,
        q=q,
        page_size=page_size,
        cursor=cursor,
    )
    res_items = [
        TicketItemResponse(
            id=t["id"],
            subject=t["subject"],
            status=t["status"],
            updated_at=t.get("last_message_at", t["created_at"]),
            customer_name=t.get("customer_name"),
            order_id=t.get("order_id"),
        )
        for t in items
    ]
    return PaginatedResponse(items=res_items, next_cursor=next_cursor, total=total)


@router.get("/support/tickets/{id}", response_model=TicketDetailResponse)
def get_support_ticket(
    id: str,
    current_user: Dict[str, Any] = Depends(require_role("admin")),
):
    ticket = support_repo.get_ticket(id)
    if not ticket:
        raise NotFoundError("Ticket not found")
    messages = support_repo.get_ticket_messages(id)
    msg_items = [
        {"from": m.get("sender_role", "customer"), "text": m.get("text", ""), "at": m.get("created_at", "")}
        for m in messages
    ]
    return {**ticket, "messages": msg_items}


@router.post("/support/tickets/{id}/reply", status_code=status.HTTP_201_CREATED)
def reply_support_ticket(
    id: str,
    request: TicketMessageInput,
    current_user: Dict[str, Any] = Depends(require_role("admin")),
):
    ticket = support_repo.get_ticket(id)
    if not ticket:
        raise NotFoundError("Ticket not found")

    msg = support_repo.add_ticket_message(
        ticket_id=id,
        sender_id=current_user["id"],
        sender_role="admin",
        text=request.message,
        reopen=False,
    )
    # Notify customer
    notification_repo.create_notification(
        user_id=ticket["customer_id"],
        notif_data={
            "type": "support_reply",
            "title": "Support ticket reply",
            "body": f"New reply on ticket '{ticket.get('subject')}': {request.message[:100]}",
            "order_id": ticket.get("order_id"),
        },
    )
    return msg


@router.patch("/support/tickets/{id}/status", status_code=status.HTTP_204_NO_CONTENT)
def update_ticket_status(
    id: str,
    request: TicketStatusUpdate,
    current_user: Dict[str, Any] = Depends(require_role("admin")),
):
    ticket = support_repo.get_ticket(id)
    if not ticket:
        raise NotFoundError("Ticket not found")
    support_repo.update_ticket_status(id, request.status)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
