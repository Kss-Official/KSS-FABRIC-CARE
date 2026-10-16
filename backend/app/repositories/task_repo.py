from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timezone
from google.cloud.firestore_v1.transaction import Transaction
from google.cloud.firestore_v1.base_query import FieldFilter
from app.core.firebase import get_db


def create_task(
    task_data: Dict[str, Any],
    transaction: Optional[Transaction] = None,
) -> Dict[str, Any]:
    db = get_db()
    ref = db.collection("tasks").document()
    task_data["id"] = ref.id
    if "otp_attempts" not in task_data:
        task_data["otp_attempts"] = 0
    if transaction:
        transaction.set(ref, task_data)
    else:
        ref.set(task_data)
    return {"id": ref.id, **task_data}


def get_task(
    task_id: str,
    transaction: Optional[Transaction] = None,
) -> Optional[Dict[str, Any]]:
    db = get_db()
    ref = db.collection("tasks").document(task_id)
    doc = ref.get(transaction=transaction) if transaction else ref.get()
    if doc.exists:
        data = doc.to_dict()
        data["id"] = doc.id
        return data
    return None


def get_task_by_order_type(
    order_id: str,
    task_type: str,
    transaction: Optional[Transaction] = None,
) -> Optional[Dict[str, Any]]:
    db = get_db()
    query = (
        db.collection("tasks")
        .where(filter=FieldFilter("order_id", "==", order_id))
        .where(filter=FieldFilter("type", "==", task_type))
        .order_by("scheduled_at", direction="DESCENDING")
        .limit(1)
    )
    docs = list(query.stream(transaction=transaction) if transaction else query.stream())
    if docs:
        d = docs[0]
        data = d.to_dict()
        data["id"] = d.id
        return data
    return None


def update_task(
    task_id: str,
    update_data: Dict[str, Any],
    transaction: Optional[Transaction] = None,
) -> None:
    db = get_db()
    ref = db.collection("tasks").document(task_id)
    if transaction:
        transaction.update(ref, update_data)
    else:
        ref.update(update_data)


def list_agent_tasks(
    agent_id: str,
    task_type: Optional[str] = None,
    status: Optional[str] = None,
    date_str: Optional[str] = None,
) -> List[Dict[str, Any]]:
    db = get_db()
    query = db.collection("tasks").where(filter=FieldFilter("agent_id", "==", agent_id))
    if task_type:
        query = query.where(filter=FieldFilter("type", "==", task_type))
    if status:
        query = query.where(filter=FieldFilter("status", "==", status))
    else:
        # Default agent active tasks: assigned or on_the_way
        query = query.where(filter=FieldFilter("status", "in", ["assigned", "on_the_way"]))
    
    query = query.order_by("scheduled_at", direction="ASCENDING")
    docs = list(query.stream())
    items = []
    for d in docs:
        data = d.to_dict()
        data["id"] = d.id
        if date_str:
            sch = data.get("scheduled_at", "")
            if not sch.startswith(date_str):
                continue
        items.append(data)
    return items


def list_agent_task_history(
    agent_id: str,
    task_type: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    page_size: int = 10,
    cursor: Optional[str] = None,
) -> Tuple[List[Dict[str, Any]], Optional[str], int]:
    db = get_db()
    query = db.collection("tasks").where(filter=FieldFilter("agent_id", "==", agent_id))
    query = query.where(filter=FieldFilter("status", "in", ["completed", "failed"]))
    if task_type:
        query = query.where(filter=FieldFilter("type", "==", task_type))
    
    query = query.order_by("completed_at", direction="DESCENDING")

    count_results = query.count().get()
    total = count_results[0][0].value

    if cursor:
        cursor_doc = db.collection("tasks").document(cursor).get()
        if cursor_doc.exists:
            query = query.start_after(cursor_doc)

    docs = list(query.limit(page_size).stream())
    items = []
    for d in docs:
        data = d.to_dict()
        data["id"] = d.id
        comp = data.get("completed_at", "")
        if from_date and comp < from_date:
            continue
        if to_date and comp > to_date:
            continue
        items.append(data)

    next_cursor = docs[-1].id if len(docs) == page_size else None
    return items, next_cursor, total


def get_agent_today_stats(agent_id: str, today_str: str) -> Dict[str, int]:
    db = get_db()
    # Query tasks for this agent
    q = db.collection("tasks").where(filter=FieldFilter("agent_id", "==", agent_id))
    docs = list(q.stream())
    
    pickups_total = 0
    pickups_done = 0
    deliveries_total = 0
    deliveries_done = 0
    
    for d in docs:
        data = d.to_dict()
        ttype = data.get("type")
        status = data.get("status")
        sch = data.get("scheduled_at", "")
        comp = data.get("completed_at", "")
        
        is_today = (sch and sch.startswith(today_str)) or (comp and comp.startswith(today_str))
        if not is_today:
            continue
            
        if ttype == "pickup":
            pickups_total += 1
            if status == "completed":
                pickups_done += 1
        elif ttype == "delivery":
            deliveries_total += 1
            if status == "completed":
                deliveries_done += 1
                
    return {
        "pickups_total": pickups_total,
        "pickups_done": pickups_done,
        "deliveries_total": deliveries_total,
        "deliveries_done": deliveries_done,
    }


def get_agent_next_task(agent_id: str) -> Optional[Dict[str, Any]]:
    db = get_db()
    # Active task: first on_the_way, otherwise earliest assigned
    q_otw = (
        db.collection("tasks")
        .where(filter=FieldFilter("agent_id", "==", agent_id))
        .where(filter=FieldFilter("status", "==", "on_the_way"))
        .limit(1)
    )
    docs = list(q_otw.stream())
    if docs:
        data = docs[0].to_dict()
        data["id"] = docs[0].id
        return data

    q_assigned = (
        db.collection("tasks")
        .where(filter=FieldFilter("agent_id", "==", agent_id))
        .where(filter=FieldFilter("status", "==", "assigned"))
        .order_by("scheduled_at", direction="ASCENDING")
        .limit(1)
    )
    docs = list(q_assigned.stream())
    if docs:
        data = docs[0].to_dict()
        data["id"] = docs[0].id
        return data

    return None


def list_admin_tasks(
    task_type: Optional[str] = None,
    status: Optional[str] = None,
    date_str: Optional[str] = None,
    agent_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    db = get_db()
    query = db.collection("tasks")
    if task_type:
        query = query.where(filter=FieldFilter("type", "==", task_type))
    if status:
        query = query.where(filter=FieldFilter("status", "==", status))
    if agent_id:
        query = query.where(filter=FieldFilter("agent_id", "==", agent_id))
        
    query = query.order_by("scheduled_at", direction="DESCENDING")
    docs = list(query.stream())
    items = []
    for d in docs:
        data = d.to_dict()
        data["id"] = d.id
        if date_str:
            sch = data.get("scheduled_at", "")
            if not sch.startswith(date_str):
                continue
        items.append(data)
    return items
