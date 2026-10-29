from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timezone
from google.cloud.firestore_v1.transaction import Transaction
from google.cloud.firestore_v1.base_query import FieldFilter
from app.core.firebase import get_db


def create_invoice(
    invoice_data: Dict[str, Any],
    transaction: Optional[Transaction] = None,
) -> Dict[str, Any]:
    db = get_db()
    ref = db.collection("invoices").document()
    invoice_data["id"] = ref.id
    if "issued_at" not in invoice_data:
        invoice_data["issued_at"] = datetime.now(timezone.utc).isoformat()
    if transaction:
        transaction.set(ref, invoice_data)
    else:
        ref.set(invoice_data)
    return {"id": ref.id, **invoice_data}


def get_invoice(
    invoice_id: str,
    transaction: Optional[Transaction] = None,
) -> Optional[Dict[str, Any]]:
    db = get_db()
    ref = db.collection("invoices").document(invoice_id)
    doc = ref.get(transaction=transaction) if transaction else ref.get()
    if doc.exists:
        data = doc.to_dict()
        data["id"] = doc.id
        return data
    return None


def get_invoice_by_order(
    order_id: str,
    transaction: Optional[Transaction] = None,
) -> Optional[Dict[str, Any]]:
    db = get_db()
    query = (
        db.collection("invoices")
        .where(filter=FieldFilter("order_id", "==", order_id))
        .limit(1)
    )
    docs = list(query.stream(transaction=transaction) if transaction else query.stream())
    if docs:
        data = docs[0].to_dict()
        data["id"] = docs[0].id
        return data
    return None


def update_invoice(
    invoice_id: str,
    update_data: Dict[str, Any],
    transaction: Optional[Transaction] = None,
) -> None:
    db = get_db()
    ref = db.collection("invoices").document(invoice_id)
    if transaction:
        transaction.update(ref, update_data)
    else:
        ref.update(update_data)


def list_customer_invoices(
    customer_id: str,
    status: Optional[str] = None,
    page_size: int = 10,
    cursor: Optional[str] = None,
) -> Tuple[List[Dict[str, Any]], Optional[str], int]:
    db = get_db()
    query = db.collection("invoices").where(filter=FieldFilter("customer_id", "==", customer_id))
    if status:
        query = query.where(filter=FieldFilter("status", "==", status))
    query = query.order_by("issued_at", direction="DESCENDING")

    count_results = query.count().get()
    total = count_results[0][0].value

    if cursor:
        cursor_doc = db.collection("invoices").document(cursor).get()
        if cursor_doc.exists:
            query = query.start_after(cursor_doc)

    docs = list(query.limit(page_size).stream())
    items = [{"id": d.id, **d.to_dict()} for d in docs]
    next_cursor = docs[-1].id if len(docs) == page_size else None
    return items, next_cursor, total
