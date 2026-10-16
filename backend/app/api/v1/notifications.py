from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, Response, status
from app.core.deps import get_current_user
from app.core.errors import NotFoundError
from app.schemas.common import PaginatedResponse
from app.schemas.notification import NotificationItem, UnreadCountResponse
from app.repositories import notification_repo


router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=PaginatedResponse[NotificationItem])
def get_notifications(
    unread: Optional[bool] = Query(None),
    page_size: int = Query(10, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    items, next_cursor, total = notification_repo.list_user_notifications(
        user_id=current_user["id"],
        unread_only=unread is True,
        page_size=page_size,
        cursor=cursor,
    )
    return PaginatedResponse(items=items, next_cursor=next_cursor, total=total)


@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(current_user: Dict[str, Any] = Depends(get_current_user)):
    count = notification_repo.get_unread_count(current_user["id"])
    return UnreadCountResponse(count=count)


@router.patch("/{id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_read(id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    success = notification_repo.mark_as_read(id, current_user["id"])
    if not success:
        raise NotFoundError("Notification not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_read(current_user: Dict[str, Any] = Depends(get_current_user)):
    notification_repo.mark_all_as_read(current_user["id"])
    return Response(status_code=status.HTTP_204_NO_CONTENT)
