from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timezone, timedelta
from google.cloud.firestore_v1.transaction import Transaction
from google.cloud.firestore_v1.base_query import FieldFilter
from app.core.firebase import get_db


ORDER_STAGES = [
    "PAYMENT_PENDING",
    "PLACED",
    "PICKUP_SCHEDULED",
    "PICKED_UP",
    "RECEIVED",
    "INSPECTION",
    "WASHING",
    "DRYING",
    "IRONING",
    "FOLDING",
    "QUALITY_CHECK",
    "PACKING",
    "READY_FOR_DELIVERY",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
]

STAFF_STAGES = [
    "RECEIVED",
    "INSPECTION",
    "WASHING",
    "DRYING",
    "IRONING",
    "FOLDING",
    "QUALITY_CHECK",
    "PACKING",
    "READY_FOR_DELIVERY",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
]


def get_next_order_status(current_status: str) -> Optional[str]:
    try:
        idx = ORDER_STAGES.index(current_status)
        if idx < len(ORDER_STAGES) - 1:
            return ORDER_STAGES[idx + 1]
    except ValueError:
        pass
    return None


def create_order(
    order_data: Dict[str, Any],
    transaction: Optional[Transaction] = None,
) -> Dict[str, Any]:
    db = get_db()
    ref = db.collection("orders").document()
    order_id = ref.id
    order_data["id"] = order_id
    if transaction:
        transaction.set(ref, order_data)
    else:
        ref.set(order_data)
    return {"id": order_id, **order_data}


def get_order(
    order_id: str,
    transaction: Optional[Transaction] = None,
) -> Optional[Dict[str, Any]]:
    db = get_db()
    ref = db.collection("orders").document(order_id)
    doc = ref.get(transaction=transaction) if transaction else ref.get()
    if doc.exists:
        data = doc.to_dict()
        data["id"] = doc.id
        return data
    return None


def update_order(
    order_id: str,
    update_data: Dict[str, Any],
    transaction: Optional[Transaction] = None,
) -> None:
    db = get_db()
    ref = db.collection("orders").document(order_id)
    if transaction:
        transaction.update(ref, update_data)
    else:
        ref.update(update_data)


def add_order_history(
    order_id: str,
    history_data: Dict[str, Any],
    transaction: Optional[Transaction] = None,
) -> Dict[str, Any]:
    db = get_db()
    ref = db.collection("orders").document(order_id).collection("history").document()
    doc_data = {
        "from_status": history_data.get("from_status"),
        "to_status": history_data.get("to_status"),
        "changed_by": history_data.get("changed_by"),
        "changed_by_name": history_data.get("changed_by_name"),
        "note": history_data.get("note"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    if transaction:
        transaction.set(ref, doc_data)
    else:
        ref.set(doc_data)
    return {"id": ref.id, **doc_data}


def get_order_history(order_id: str) -> List[Dict[str, Any]]:
    db = get_db()
    docs = (
        db.collection("orders")
        .document(order_id)
        .collection("history")
        .order_by("created_at")
        .stream()
    )
    return [{"id": d.id, **d.to_dict()} for d in docs]


def list_customer_orders(
    customer_id: str,
    status: Optional[str] = None,
    page_size: int = 10,
    cursor: Optional[str] = None,
) -> Tuple[List[Dict[str, Any]], Optional[str], int]:
    db = get_db()
    query = db.collection("orders").where(filter=FieldFilter("customer_id", "==", customer_id))
    if status:
        query = query.where(filter=FieldFilter("status", "==", status))
    query = query.order_by("created_at", direction="DESCENDING")

    count_results = query.count().get()
    total = count_results[0][0].value

    if cursor:
        cursor_doc = db.collection("orders").document(cursor).get()
        if cursor_doc.exists:
            query = query.start_after(cursor_doc)

    docs = list(query.limit(page_size).stream())
    items = [{"id": d.id, **d.to_dict()} for d in docs]
    next_cursor = docs[-1].id if len(docs) == page_size else None
    return items, next_cursor, total


def get_staff_order_counts() -> Dict[str, int]:
    db = get_db()
    stages = [
        "RECEIVED", "INSPECTION", "WASHING", "DRYING",
        "IRONING", "FOLDING", "QUALITY_CHECK", "PACKING",
        "READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "DELIVERED"
    ]
    counts = {}
    for st in stages:
        q = db.collection("orders").where(filter=FieldFilter("status", "==", st))
        if st == "DELIVERED":
            # only delivered within last 7 days
            seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
            q = q.where(filter=FieldFilter("delivered_at", ">=", seven_days_ago))
        res = q.count().get()
        counts[st] = res[0][0].value

    delivery_count = counts.get("READY_FOR_DELIVERY", 0) + counts.get("OUT_FOR_DELIVERY", 0)
    all_count = sum(counts[st] for st in stages if st not in ["READY_FOR_DELIVERY", "OUT_FOR_DELIVERY"]) + delivery_count

    return {
        "all": all_count,
        "RECEIVED": counts.get("RECEIVED", 0),
        "INSPECTION": counts.get("INSPECTION", 0),
        "WASHING": counts.get("WASHING", 0),
        "DRYING": counts.get("DRYING", 0),
        "IRONING": counts.get("IRONING", 0),
        "FOLDING": counts.get("FOLDING", 0),
        "QUALITY_CHECK": counts.get("QUALITY_CHECK", 0),
        "PACKING": counts.get("PACKING", 0),
        "DELIVERY": delivery_count,
        "DELIVERED": counts.get("DELIVERED", 0),
    }


def list_staff_orders(
    status: Optional[str] = None,
    q: Optional[str] = None,
    page_size: int = 10,
    cursor: Optional[str] = None,
) -> Tuple[List[Dict[str, Any]], Optional[str], int]:
    db = get_db()
    query = db.collection("orders")

    if status and status.upper() == "DELIVERY":
        # Combines READY_FOR_DELIVERY and OUT_FOR_DELIVERY
        query = query.where(filter=FieldFilter("status", "in", ["READY_FOR_DELIVERY", "OUT_FOR_DELIVERY"]))
    elif status and status.upper() in STAFF_STAGES:
        query = query.where(filter=FieldFilter("status", "==", status.upper()))
        if status.upper() == "DELIVERED":
            seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
            query = query.where(filter=FieldFilter("delivered_at", ">=", seven_days_ago))
    else:
        # Default staff visible: RECEIVED to OUT_FOR_DELIVERY + DELIVERED (within 7 days)
        query = query.where(filter=FieldFilter("status", "in", STAFF_STAGES))

    if q:
        query = query.where(filter=FieldFilter("search_tokens", "array_contains", q.lower().strip()))

    query = query.order_by("created_at", direction="DESCENDING")

    count_results = query.count().get()
    total = count_results[0][0].value

    if cursor:
        cursor_doc = db.collection("orders").document(cursor).get()
        if cursor_doc.exists:
            query = query.start_after(cursor_doc)

    docs = list(query.limit(page_size).stream())
    items = []
    for d in docs:
        data = d.to_dict()
        data["id"] = d.id
        # calculate next_status
        curr_status = data.get("status")
        if curr_status in ["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]:
            data["next_status"] = None
        else:
            data["next_status"] = get_next_order_status(curr_status)
        items.append(data)

    next_cursor = docs[-1].id if len(docs) == page_size else None
    return items, next_cursor, total


def list_staff_history(
    status: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    sort: Optional[str] = "date_desc",
    q: Optional[str] = None,
    page_size: int = 10,
    cursor: Optional[str] = None,
) -> Tuple[List[Dict[str, Any]], Optional[str], int, int]:
    db = get_db()
    query = db.collection("orders")

    if status and status.lower() in ["delivered", "cancelled"]:
        query = query.where(filter=FieldFilter("status", "==", status.upper()))
    else:
        query = query.where(filter=FieldFilter("status", "in", ["DELIVERED", "CANCELLED"]))

    if q:
        query = query.where(filter=FieldFilter("search_tokens", "array_contains", q.lower().strip()))

    # Per section 6.3:
    # "Firestore limit: a date-range filter and an amount sort cannot both be indexed on different fields.
    # When sort is by amount, apply the date range in memory on the fetched page and document it."
    if sort == "amount_desc":
        query = query.order_by("total_paise", direction="DESCENDING")
    elif sort == "amount_asc":
        query = query.order_by("total_paise", direction="ASCENDING")
    elif sort == "date_asc":
        if from_date:
            query = query.where(filter=FieldFilter("delivered_at", ">=", from_date))
        if to_date:
            query = query.where(filter=FieldFilter("delivered_at", "<=", to_date))
        query = query.order_by("delivered_at", direction="ASCENDING")
    else:  # date_desc
        if from_date:
            query = query.where(filter=FieldFilter("delivered_at", ">=", from_date))
        if to_date:
            query = query.where(filter=FieldFilter("delivered_at", "<=", to_date))
        query = query.order_by("delivered_at", direction="DESCENDING")

    count_results = query.count().get()
    total = count_results[0][0].value

    if cursor:
        cursor_doc = db.collection("orders").document(cursor).get()
        if cursor_doc.exists:
            query = query.start_after(cursor_doc)

    docs = list(query.limit(page_size).stream())
    items = []
    total_val = 0

    for d in docs:
        data = d.to_dict()
        data["id"] = d.id
        # in-memory date filter if sort is by amount
        deliv = data.get("delivered_at") or data.get("cancelled_at") or ""
        if (sort in ["amount_desc", "amount_asc"]) and from_date and deliv < from_date:
            continue
        if (sort in ["amount_desc", "amount_asc"]) and to_date and deliv > to_date:
            continue

        items.append(data)
        total_val += data.get("total_paise", 0)

    next_cursor = docs[-1].id if len(docs) == page_size else None
    return items, next_cursor, total, total_val


def list_admin_orders(
    status: Optional[str] = None,
    q: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    page_size: int = 10,
    cursor: Optional[str] = None,
) -> Tuple[List[Dict[str, Any]], Optional[str], int]:
    db = get_db()
    query = db.collection("orders")

    # Section 6.4: never lists PAYMENT_PENDING
    if status:
        query = query.where(filter=FieldFilter("status", "==", status))
    else:
        query = query.where(filter=FieldFilter("status", "!=", "PAYMENT_PENDING"))

    if q:
        query = query.where(filter=FieldFilter("search_tokens", "array_contains", q.lower().strip()))
    if from_date:
        query = query.where(filter=FieldFilter("created_at", ">=", from_date))
    if to_date:
        query = query.where(filter=FieldFilter("created_at", "<=", to_date))

    query = query.order_by("created_at", direction="DESCENDING")

    count_results = query.count().get()
    total = count_results[0][0].value

    if cursor:
        cursor_doc = db.collection("orders").document(cursor).get()
        if cursor_doc.exists:
            query = query.start_after(cursor_doc)

    docs = list(query.limit(page_size).stream())
    items = [{"id": d.id, **d.to_dict()} for d in docs]
    next_cursor = docs[-1].id if len(docs) == page_size else None
    return items, next_cursor, total
