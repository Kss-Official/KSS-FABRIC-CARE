from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query, Response, status
from fastapi.responses import Response as FastApiResponse
from app.core.deps import require_role, get_current_user
from app.core.errors import NotFoundError, ForbiddenError, ConflictError
from app.schemas.common import PaginatedResponse
from app.schemas.catalog import CatalogResponse
from app.schemas.address import AddressCreate, AddressUpdate, AddressResponse
from app.schemas.order import (
    OrderCreateRequest,
    OrderCancelRequest,
    OrderResponse,
    OrderTrackingResponse,
    TrackingStep,
    TrackingAgent,
)
from app.schemas.invoice import InvoiceItemResponse, InvoiceDetailResponse
from app.schemas.payment import PaymentItemResponse
from app.schemas.support import (
    TicketCreateRequest,
    TicketMessageInput,
    TicketItemResponse,
    TicketDetailResponse,
)
from app.repositories import (
    catalog_repo,
    user_repo,
    order_repo,
    invoice_repo,
    payment_repo,
    support_repo,
    task_repo,
)
from app.services import order_service, status_service, invoice_service, payment_service
from app.services.status_service import STEP_LABELS


router = APIRouter(tags=["customer"])


# --- CATALOG ---
@router.get("/catalog", response_model=CatalogResponse)
def get_catalog():
    return catalog_repo.get_catalog_active()


# --- ADDRESSES ---
@router.get("/addresses", response_model=List[AddressResponse])
def get_addresses(current_user: Dict[str, Any] = Depends(require_role("customer"))):
    return user_repo.get_addresses(current_user["id"])


@router.post("/addresses", response_model=AddressResponse, status_code=status.HTTP_201_CREATED)
def create_address(
    request: AddressCreate,
    current_user: Dict[str, Any] = Depends(require_role("customer")),
):
    return user_repo.create_address(current_user["id"], request.model_dump())


@router.patch("/addresses/{id}", response_model=AddressResponse)
def update_address(
    id: str,
    request: AddressUpdate,
    current_user: Dict[str, Any] = Depends(require_role("customer")),
):
    updated = user_repo.update_address(current_user["id"], id, request.model_dump(exclude_unset=True))
    if not updated:
        raise NotFoundError("Address not found")
    return updated


@router.delete("/addresses/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(
    id: str,
    current_user: Dict[str, Any] = Depends(require_role("customer")),
):
    success = user_repo.delete_address(current_user["id"], id)
    if not success:
        raise NotFoundError("Address not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- ORDERS ---
@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    request: OrderCreateRequest,
    current_user: Dict[str, Any] = Depends(require_role("customer")),
):
    pickup_dict = request.pickup_slot.model_dump(by_alias=True)
    items_dicts = [it.model_dump() for it in request.items]
    order = order_service.create_customer_order(
        customer_id=current_user["id"],
        address_id=request.address_id,
        pickup_slot=pickup_dict,
        is_express=request.is_express,
        notes=request.notes,
        items_input=items_dicts,
    )
    return order


@router.get("/orders", response_model=PaginatedResponse[OrderResponse])
def list_orders(
    status: Optional[str] = Query(None),
    page_size: int = Query(10, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(require_role("customer")),
):
    items, next_cursor, total = order_repo.list_customer_orders(
        customer_id=current_user["id"],
        status=status,
        page_size=page_size,
        cursor=cursor,
    )
    return PaginatedResponse(items=items, next_cursor=next_cursor, total=total)


@router.get("/orders/{id}", response_model=OrderResponse)
def get_order(
    id: str,
    current_user: Dict[str, Any] = Depends(require_role("customer")),
):
    order = order_repo.get_order(id)
    if not order or order.get("customer_id") != current_user["id"]:
        raise NotFoundError("Order not found")
    return order


@router.post("/orders/{id}/cancel", response_model=OrderResponse)
def cancel_order(
    id: str,
    request: Optional[OrderCancelRequest] = None,
    current_user: Dict[str, Any] = Depends(require_role("customer")),
):
    order = order_repo.get_order(id)
    if not order or order.get("customer_id") != current_user["id"]:
        raise NotFoundError("Order not found")

    reason = request.reason if request else "Cancelled by customer"
    
    # If order is paid, use refund_order which also marks cancelled
    if order.get("payment_status") == "paid":
        payment_service.refund_order(id, reason=reason, actor=current_user)
        return order_repo.get_order(id)
    else:
        updated = status_service.change_status(
            order_id=id,
            to_status="CANCELLED",
            actor=current_user,
            note=reason,
        )
        return updated


@router.get("/orders/{id}/tracking", response_model=OrderTrackingResponse)
def track_order(
    id: str,
    current_user: Dict[str, Any] = Depends(require_role("customer")),
):
    order = order_repo.get_order(id)
    if not order or order.get("customer_id") != current_user["id"]:
        raise NotFoundError("Order not found")

    history = order_repo.get_order_history(id)
    history_map = {h.get("to_status"): h.get("created_at") for h in history}

    tracking_stages = [
        ("PAYMENT_PENDING", "Payment pending"),
        ("PLACED", "Order placed"),
        ("PICKUP_SCHEDULED", "Pickup scheduled"),
        ("PICKED_UP", "Picked up"),
        ("RECEIVED", "Received at laundry"),
        ("INSPECTION", "Inspection"),
        ("WASHING", "Washing"),
        ("DRYING", "Drying"),
        ("IRONING", "Ironing"),
        ("FOLDING", "Folding"),
        ("QUALITY_CHECK", "Quality check"),
        ("PACKING", "Packing"),
        ("READY_FOR_DELIVERY", "Ready for delivery"),
        ("OUT_FOR_DELIVERY", "Out for delivery"),
        ("DELIVERED", "Delivered"),
    ]

    curr_status = order.get("status")
    reached = False
    target_idx = -1
    for i, (st, _) in enumerate(tracking_stages):
        if st == curr_status:
            target_idx = i
            break

    steps = []
    for i, (st, label) in enumerate(tracking_stages):
        is_done = target_idx >= i if target_idx != -1 else False
        steps.append(TrackingStep(
            status=st,
            label=label,
            done=is_done,
            at=history_map.get(st),
        ))

    # Check for active agent location
    agent_info = None
    # If pickup or delivery task is on_the_way
    active_task = None
    for ttype in ["delivery", "pickup"]:
        t = task_repo.get_task_by_order_type(id, ttype)
        if t and t.get("status") == "on_the_way":
            active_task = t
            break

    if active_task and active_task.get("agent_id"):
        agent_user = user_repo.get_user(active_task["agent_id"])
        if agent_user:
            prof = agent_user.get("agent_profile", {})
            agent_info = TrackingAgent(
                name=agent_user.get("name", "Delivery Agent"),
                phone=agent_user.get("phone", ""),
                lat=prof.get("last_lat"),
                lng=prof.get("last_lng"),
            )

    return OrderTrackingResponse(
        code=order.get("code", "FC-XXXXX"),
        status=curr_status,
        steps=steps,
        agent=agent_info,
        eta=order.get("due_by"),
    )


# --- PAYMENTS ---
@router.get("/payments", response_model=PaginatedResponse[PaymentItemResponse])
def list_payments(
    page_size: int = Query(10, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(require_role("customer")),
):
    items, next_cursor, total = payment_repo.list_customer_payments(
        user_id=current_user["id"],
        page_size=page_size,
        cursor=cursor,
    )
    return PaginatedResponse(items=items, next_cursor=next_cursor, total=total)


# --- INVOICES ---
@router.get("/invoices", response_model=PaginatedResponse[InvoiceItemResponse])
def list_invoices(
    status: Optional[str] = Query(None),
    page_size: int = Query(10, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(require_role("customer")),
):
    items, next_cursor, total = invoice_repo.list_customer_invoices(
        customer_id=current_user["id"],
        status=status,
        page_size=page_size,
        cursor=cursor,
    )
    return PaginatedResponse(items=items, next_cursor=next_cursor, total=total)


@router.get("/invoices/{id}", response_model=InvoiceDetailResponse)
def get_invoice(
    id: str,
    current_user: Dict[str, Any] = Depends(require_role("customer")),
):
    invoice = invoice_repo.get_invoice(id)
    if not invoice or invoice.get("customer_id") != current_user["id"]:
        raise NotFoundError("Invoice not found")
    return invoice


@router.get("/invoices/{id}/pdf")
def get_invoice_pdf(
    id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    invoice = invoice_repo.get_invoice(id)
    if not invoice:
        raise NotFoundError("Invoice not found")

    # Ownership check: customer can only read own, staff/admin can read any
    if current_user.get("role") == "customer" and invoice.get("customer_id") != current_user["id"]:
        raise NotFoundError("Invoice not found")

    order = order_repo.get_order(invoice.get("order_id", ""))
    pdf_bytes = invoice_service.generate_invoice_pdf_bytes(invoice, order)
    return FastApiResponse(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={invoice.get('invoice_no', 'invoice')}.pdf"},
    )


# --- HELP & SUPPORT ---
@router.post("/support/tickets", status_code=status.HTTP_201_CREATED)
def create_ticket(
    request: TicketCreateRequest,
    current_user: Dict[str, Any] = Depends(require_role("customer")),
):
    ticket = support_repo.create_ticket(
        ticket_data={
            "customer_id": current_user["id"],
            "customer_name": current_user.get("name", "Customer"),
            "subject": request.subject,
            "order_id": request.order_id,
        },
        initial_message=request.message,
        sender_role="customer",
    )
    # Notify admin
    status_service.notify_admins(
        title="New support ticket",
        body=f"New ticket '{request.subject}' from {current_user.get('name')}.",
        order_id=request.order_id,
    )
    return {"id": ticket["id"], "status": "open"}


@router.get("/support/tickets", response_model=PaginatedResponse[TicketItemResponse])
def list_tickets(
    status: Optional[str] = Query(None),
    page_size: int = Query(10, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(require_role("customer")),
):
    items, next_cursor, total = support_repo.list_tickets(
        customer_id=current_user["id"],
        status=status,
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
def get_ticket(
    id: str,
    current_user: Dict[str, Any] = Depends(require_role("customer")),
):
    ticket = support_repo.get_ticket(id)
    if not ticket or ticket.get("customer_id") != current_user["id"]:
        raise NotFoundError("Ticket not found")

    messages = support_repo.get_ticket_messages(id)
    msg_items = [
        {"from": m.get("sender_role", "customer"), "text": m.get("text", ""), "at": m.get("created_at", "")}
        for m in messages
    ]
    return {**ticket, "messages": msg_items}


@router.post("/support/tickets/{id}/messages", status_code=status.HTTP_201_CREATED)
def reply_ticket(
    id: str,
    request: TicketMessageInput,
    current_user: Dict[str, Any] = Depends(require_role("customer")),
):
    ticket = support_repo.get_ticket(id)
    if not ticket or ticket.get("customer_id") != current_user["id"]:
        raise NotFoundError("Ticket not found")

    msg = support_repo.add_ticket_message(
        ticket_id=id,
        sender_id=current_user["id"],
        sender_role="customer",
        text=request.message,
        reopen=True,
    )
    status_service.notify_admins(
        title="Support ticket updated",
        body=f"Customer reply on ticket '{ticket.get('subject')}'.",
        order_id=ticket.get("order_id"),
    )
    return msg
