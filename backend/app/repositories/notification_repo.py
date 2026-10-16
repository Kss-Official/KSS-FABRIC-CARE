from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timezone
from google.cloud.firestore_v1.transaction import Transaction
from google.cloud.firestore_v1.base_query import FieldFilter
from app.core.firebase import get_db


def create_notification(
    user_id: str,
    notif_data: Dict[str, Any],
    transaction: Optional[Transaction] = None,
) -> Dict[str, Any]:
    db = get_db()
    ref = db.collection("notifications").document()
    doc_data = {
        "user_id": user_id,
        "type": notif_data.get("type", "general"),
        "title": notif_data.get("title", ""),
        "body": notif_data.get("body", ""),
        "order_id": notif_data.get("order_id"),
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    if transaction:
        transaction.set(ref, doc_data)
    else:
        ref.set(doc_data)
    return {"id": ref.id, **doc_data}


def batch_create_notifications(user_ids: List[str], notif_data: Dict[str, Any]) -> int:
    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()
    count = 0
    
    # Firestore batch limit is 500
    batch = db.batch()
    batch_count = 0
    for uid in user_ids:
        ref = db.collection("notifications").document()
        doc_data = {
            "user_id": uid,
            "type": notif_data.get("type", "broadcast"),
            "title": notif_data.get("title", ""),
            "body": notif_data.get("body", ""),
            "order_id": None,
            "is_read": False,
            "created_at": now_iso,
        }
        batch.set(ref, doc_data)
        count += 1
        batch_count += 1
        if batch_count == 500:
            batch.commit()
            batch = db.batch()
            batch_count = 0
            
    if batch_count > 0:
        batch.commit()
        
    return count


def list_user_notifications(
    user_id: str,
    unread_only: bool = False,
    page_size: int = 10,
    cursor: Optional[str] = None,
) -> Tuple[List[Dict[str, Any]], Optional[str], int]:
    db = get_db()
    query = db.collection("notifications").where(filter=FieldFilter("user_id", "==", user_id))
    if unread_only:
        query = query.where(filter=FieldFilter("is_read", "==", False))
    query = query.order_by("created_at", direction="DESCENDING")
    
    # Count total
    count_query = query.count()
    count_results = count_query.get()
    total = count_results[0][0].value
    
    if cursor:
        cursor_doc = db.collection("notifications").document(cursor).get()
        if cursor_doc.exists:
            query = query.start_after(cursor_doc)
            
    docs = list(query.limit(page_size).stream())
    items = [{"id": d.id, **d.to_dict()} for d in docs]
    next_cursor = docs[-1].id if len(docs) == page_size else None
    
    return items, next_cursor, total


def get_unread_count(user_id: str) -> int:
    db = get_db()
    count_query = (
        db.collection("notifications")
        .where(filter=FieldFilter("user_id", "==", user_id))
        .where(filter=FieldFilter("is_read", "==", False))
        .count()
    )
    results = count_query.get()
    return results[0][0].value


def mark_as_read(notif_id: str, user_id: str) -> bool:
    db = get_db()
    ref = db.collection("notifications").document(notif_id)
    doc = ref.get()
    if not doc.exists or doc.to_dict().get("user_id") != user_id:
        return False
    ref.update({"is_read": True})
    return True


def mark_all_as_read(user_id: str) -> None:
    db = get_db()
    docs = (
        db.collection("notifications")
        .where(filter=FieldFilter("user_id", "==", user_id))
        .where(filter=FieldFilter("is_read", "==", False))
        .stream()
    )
    batch = db.batch()
    count = 0
    for d in docs:
        batch.update(d.reference, {"is_read": True})
        count += 1
        if count == 500:
            batch.commit()
            batch = db.batch()
            count = 0
    if count > 0:
        batch.commit()
