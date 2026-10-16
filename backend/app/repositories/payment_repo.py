from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timezone
from google.cloud.firestore_v1.transaction import Transaction
from google.cloud.firestore_v1.base_query import FieldFilter
from app.core.firebase import get_db


def create_payment(
    payment_data: Dict[str, Any],
    transaction: Optional[Transaction] = None,
) -> Dict[str, Any]:
    db = get_db()
    ref = db.collection("payments").document()
    payment_data["id"] = ref.id
    if "created_at" not in payment_data:
        payment_data["created_at"] = datetime.now(timezone.utc).isoformat()
    if transaction:
        transaction.set(ref, payment_data)
    else:
        ref.set(payment_data)
    return {"id": ref.id, **payment_data}


def get_payment(
    payment_id: str,
    transaction: Optional[Transaction] = None,
) -> Optional[Dict[str, Any]]:
    db = get_db()
    ref = db.collection("payments").document(payment_id)
    doc = ref.get(transaction=transaction) if transaction else ref.get()
    if doc.exists:
        data = doc.to_dict()
        data["id"] = doc.id
        return data
    return None


def get_payment_by_gateway_order_id(
    gateway_order_id: str,
    transaction: Optional[Transaction] = None,
) -> Optional[Dict[str, Any]]:
    db = get_db()
    query = db.collection("payments").where(filter=FieldFilter("gateway_order_id", "==", gateway_order_id)).limit(1)
    docs = list(query.stream(transaction=transaction) if transaction else query.stream())
    if docs:
        data = docs[0].to_dict()
        data["id"] = docs[0].id
        return data
    return None


def get_payment_by_order(
    order_id: str,
    transaction: Optional[Transaction] = None,
) -> Optional[Dict[str, Any]]:
    db = get_db()
    query = (
        db.collection("payments")
        .where(filter=FieldFilter("order_id", "==", order_id))
        .order_by("created_at", direction="DESCENDING")
        .limit(1)
    )
    docs = list(query.stream(transaction=transaction) if transaction else query.stream())
    if docs:
        data = docs[0].to_dict()
        data["id"] = docs[0].id
        return data
    return None


def update_payment(
    payment_id: str,
    update_data: Dict[str, Any],
    transaction: Optional[Transaction] = None,
) -> None:
    db = get_db()
    ref = db.collection("payments").document(payment_id)
    if transaction:
        transaction.update(ref, update_data)
    else:
        ref.update(update_data)


def list_customer_payments(
    user_id: str,
    page_size: int = 10,
    cursor: Optional[str] = None,
) -> Tuple[List[Dict[str, Any]], Optional[str], int]:
    db = get_db()
    query = (
        db.collection("payments")
        .where(filter=FieldFilter("user_id", "==", user_id))
        .order_by("created_at", direction="DESCENDING")
    )
    
    count_results = query.count().get()
    total = count_results[0][0].value

    if cursor:
        cursor_doc = db.collection("payments").document(cursor).get()
        if cursor_doc.exists:
            query = query.start_after(cursor_doc)

    docs = list(query.limit(page_size).stream())
    items = [{"id": d.id, **d.to_dict()} for d in docs]
    next_cursor = docs[-1].id if len(docs) == page_size else None
    return items, next_cursor, total
