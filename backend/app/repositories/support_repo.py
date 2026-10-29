from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timezone
from google.cloud.firestore_v1.base_query import FieldFilter
from app.core.firebase import get_db


def create_ticket(ticket_data: Dict[str, Any], initial_message: str, sender_role: str) -> Dict[str, Any]:
    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()
    ticket_ref = db.collection("support_tickets").document()
    
    doc_data = {
        "customer_id": ticket_data["customer_id"],
        "customer_name": ticket_data["customer_name"],
        "order_id": ticket_data.get("order_id"),
        "subject": ticket_data["subject"],
        "status": "open",
        "created_at": now_iso,
        "last_message_at": now_iso,
    }
    ticket_ref.set(doc_data)
    
    # Add initial message
    msg_ref = ticket_ref.collection("messages").document()
    msg_ref.set({
        "sender_id": ticket_data["customer_id"],
        "sender_role": sender_role,
        "text": initial_message,
        "created_at": now_iso,
    })
    
    return {"id": ticket_ref.id, **doc_data}


def get_ticket(ticket_id: str) -> Optional[Dict[str, Any]]:
    db = get_db()
    ref = db.collection("support_tickets").document(ticket_id)
    doc = ref.get()
    if doc.exists:
        data = doc.to_dict()
        data["id"] = doc.id
        return data
    return None


def get_ticket_messages(ticket_id: str) -> List[Dict[str, Any]]:
    db = get_db()
    docs = (
        db.collection("support_tickets")
        .document(ticket_id)
        .collection("messages")
        .order_by("created_at", direction="ASCENDING")
        .stream()
    )
    return [{"id": d.id, **d.to_dict()} for d in docs]


def add_ticket_message(
    ticket_id: str,
    sender_id: str,
    sender_role: str,
    text: str,
    reopen: bool = True,
) -> Dict[str, Any]:
    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()
    ticket_ref = db.collection("support_tickets").document(ticket_id)
    
    msg_ref = ticket_ref.collection("messages").document()
    msg_data = {
        "sender_id": sender_id,
        "sender_role": sender_role,
        "text": text,
        "created_at": now_iso,
    }
    msg_ref.set(msg_data)
    
    update_data = {"last_message_at": now_iso}
    if reopen:
        update_data["status"] = "open"
    ticket_ref.update(update_data)
    
    return {"id": msg_ref.id, **msg_data}


def update_ticket_status(ticket_id: str, status: str) -> None:
    db = get_db()
    db.collection("support_tickets").document(ticket_id).update({"status": status})


def list_tickets(
    customer_id: Optional[str] = None,
    status: Optional[str] = None,
    q: Optional[str] = None,
    page_size: int = 10,
    cursor: Optional[str] = None,
) -> Tuple[List[Dict[str, Any]], Optional[str], int]:
    db = get_db()
    query = db.collection("support_tickets")
    
    if customer_id:
        query = query.where(filter=FieldFilter("customer_id", "==", customer_id))
    if status:
        query = query.where(filter=FieldFilter("status", "==", status))
        
    query = query.order_by("last_message_at", direction="DESCENDING")
    
    count_results = query.count().get()
    total = count_results[0][0].value

    if cursor:
        cursor_doc = db.collection("support_tickets").document(cursor).get()
        if cursor_doc.exists:
            query = query.start_after(cursor_doc)

    docs = list(query.limit(page_size).stream())
    items = []
    for d in docs:
        data = d.to_dict()
        data["id"] = d.id
        if q:
            subj = data.get("subject", "").lower()
            cname = data.get("customer_name", "").lower()
            if q.lower() not in subj and q.lower() not in cname:
                continue
        items.append(data)
        
    next_cursor = docs[-1].id if len(docs) == page_size else None
    return items, next_cursor, total
