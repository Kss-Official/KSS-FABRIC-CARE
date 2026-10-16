from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query, Response, status
from app.core.deps import require_role
from app.core.errors import NotFoundError, ConflictError
from app.schemas.common import PaginatedResponse
from app.schemas.dashboard import StaffDashboardResponse
from app.schemas.order import (
    StaffOrderItem,
    StaffOrderCounts,
    StaffStatusUpdateRequest,
    StaffComboResolveRequest,
    StaffHistoryResponse,
    StaffHistoryItem,
    OrderResponse,
)
from app.repositories import order_repo
from app.services import dashboard_service, status_service, order_service


router = APIRouter(prefix="/staff", tags=["staff"])


@router.get("/dashboard", response_model=StaffDashboardResponse)
def get_dashboard(
    period: str = Query("today", pattern="^(today|week|month)$"),
    current_user: Dict[str, Any] = Depends(require_role("staff")),
):
    return dashboard_service.get_staff_dashboard(period)


@router.get("/orders", response_model=PaginatedResponse[StaffOrderItem])
def list_orders(
    status: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    page_size: int = Query(10, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(require_role("staff")),
):
    items, next_cursor, total = order_repo.list_staff_orders(
        status=status,
        q=q,
        page_size=page_size,
        cursor=cursor,
    )
    res_items = []
    for it in items:
        # Format items_summary
        items_list = it.get("items", [])
        if items_list:
            first_item = items_list[0]
            g_name = first_item.get("garment", "Item")
            qty = first_item.get("quantity", 1)
            more_count = len(items_list) - 1
            summary = f"{g_name} x {qty}" + (f" +{more_count} more" if more_count > 0 else "")
        else:
            summary = "No items"

        s_names = []
        for item in items_list:
            for s in item.get("services", []):
                name = s.get("name") if isinstance(s, dict) else str(s)
                if name not in s_names:
                    s_names.append(name)

        res_items.append(StaffOrderItem(
            id=it["id"],
            code=it.get("code", "FC-XXXXX"),
            customer=it.get("customer", {"name": "Customer", "phone": ""}),
            items_summary=summary,
            services=s_names,
            status=it.get("status", "RECEIVED"),
            is_express=it.get("is_express", False),
            is_combo=it.get("is_combo", False),
            placed_at=it.get("placed_at"),
            next_status=it.get("next_status"),
        ))

    return PaginatedResponse(items=res_items, next_cursor=next_cursor, total=total)


@router.get("/orders/counts", response_model=StaffOrderCounts)
def get_order_counts(current_user: Dict[str, Any] = Depends(require_role("staff"))):
    return order_repo.get_staff_order_counts()


@router.get("/orders/{id}")
def get_order_detail(
    id: str,
    current_user: Dict[str, Any] = Depends(require_role("staff")),
):
    order = order_repo.get_order(id)
    if not order:
        raise NotFoundError("Order not found")

    history = order_repo.get_order_history(id)
    history_items = [
        {
            "from": h.get("from_status"),
            "to": h.get("to_status"),
            "by": h.get("changed_by_name", "System"),
            "at": h.get("created_at"),
            "note": h.get("note"),
        }
        for h in history
    ]

    combo_items = [it for it in order.get("items", []) if len(it.get("services", [])) >= 2]

    return {
        **order,
        "history": history_items,
        "combo_items": combo_items,
    }


@router.post("/orders/{id}/status", response_model=OrderResponse)
def update_order_status(
    id: str,
    request: StaffStatusUpdateRequest,
    current_user: Dict[str, Any] = Depends(require_role("staff")),
):
    updated = status_service.change_status(
        order_id=id,
        to_status=request.to_status,
        actor=current_user,
        note=request.note,
    )
    return updated


@router.post("/orders/{id}/combo/resolve", status_code=status.HTTP_204_NO_CONTENT)
def resolve_combo(
    id: str,
    request: Optional[StaffComboResolveRequest] = None,
    current_user: Dict[str, Any] = Depends(require_role("staff")),
):
    order_service.resolve_order_combo(id, note=request.note if request else None)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/history", response_model=StaffHistoryResponse)
def get_history(
    status: Optional[str] = Query(None, pattern="^(delivered|cancelled)$"),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    sort: Optional[str] = Query("date_desc", pattern="^(date_desc|date_asc|amount_desc|amount_asc)$"),
    q: Optional[str] = Query(None),
    page_size: int = Query(10, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(require_role("staff")),
):
    items, next_cursor, total, total_val = order_repo.list_staff_history(
        status=status,
        from_date=from_date,
        to_date=to_date,
        sort=sort,
        q=q,
        page_size=page_size,
        cursor=cursor,
    )

    res_items = []
    for it in items:
        items_list = it.get("items", [])
        if items_list:
            first_item = items_list[0]
            g_name = first_item.get("garment", "Item")
            qty = first_item.get("quantity", 1)
            more_count = len(items_list) - 1
            summary = f"{g_name} x {qty}" + (f" +{more_count} more" if more_count > 0 else "")
        else:
            summary = "No items"

        s_names = []
        for item in items_list:
            for s in item.get("services", []):
                name = s.get("name") if isinstance(s, dict) else str(s)
                if name not in s_names:
                    s_names.append(name)

        res_items.append(StaffHistoryItem(
            id=it["id"],
            code=it.get("code", "FC-XXXXX"),
            customer=it.get("customer", {"name": "Customer", "phone": ""}),
            items_summary=summary,
            services=s_names,
            delivered_at=it.get("delivered_at") or it.get("cancelled_at"),
            amount_paise=it.get("total_paise", 0),
            status=it.get("status", "DELIVERED"),
        ))

    return StaffHistoryResponse(
        items=res_items,
        next_cursor=next_cursor,
        total=total,
        total_value_paise=total_val,
    )
