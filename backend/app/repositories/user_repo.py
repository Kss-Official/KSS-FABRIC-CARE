from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timezone
from google.cloud.firestore_v1.transaction import Transaction, transactional
from google.cloud.firestore_v1.base_query import FieldFilter
from app.core.firebase import get_db
from app.core.errors import ConflictError


def get_user(uid: str, transaction: Optional[Transaction] = None) -> Optional[Dict[str, Any]]:
    db = get_db()
    ref = db.collection("users").document(uid)
    doc = ref.get(transaction=transaction) if transaction else ref.get()
    if doc.exists:
        return {"id": doc.id, **doc.to_dict()}
    return None


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    db = get_db()
    docs = list(db.collection("users").where(filter=FieldFilter("email", "==", email.lower())).limit(1).stream())
    if docs:
        return {"id": docs[0].id, **docs[0].to_dict()}
    return None


def get_user_by_phone(phone: str, transaction: Optional[Transaction] = None) -> Optional[str]:
    db = get_db()
    ref = db.collection("phone_index").document(phone)
    doc = ref.get(transaction=transaction) if transaction else ref.get()
    if doc.exists:
        return doc.to_dict().get("uid")
    return None


@transactional
def create_user_transaction(transaction: Transaction, uid: str, user_data: Dict[str, Any], phone: str) -> None:
    db = get_db()
    phone_ref = db.collection("phone_index").document(phone)
    phone_doc = phone_ref.get(transaction=transaction)
    if phone_doc.exists:
        raise ConflictError(f"Phone number {phone} is already registered")
    
    user_ref = db.collection("users").document(uid)
    transaction.set(phone_ref, {"uid": uid, "created_at": datetime.now(timezone.utc).isoformat()})
    transaction.set(user_ref, user_data)


def update_user(uid: str, update_data: Dict[str, Any], transaction: Optional[Transaction] = None) -> Optional[Dict[str, Any]]:
    db = get_db()
    ref = db.collection("users").document(uid)
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    if "name" in update_data:
        update_data["name_lower"] = update_data["name"].lower()
    
    if transaction:
        transaction.update(ref, update_data)
        doc = ref.get(transaction=transaction)
        return {"id": doc.id, **doc.to_dict()}
    else:
        ref.update(update_data)
        doc = ref.get()
        return {"id": doc.id, **doc.to_dict()}


# Address subcollection
def get_addresses(uid: str) -> List[Dict[str, Any]]:
    db = get_db()
    docs = db.collection("users").document(uid).collection("addresses").stream()
    return [{"id": d.id, **d.to_dict()} for d in docs]


def get_address(uid: str, address_id: str) -> Optional[Dict[str, Any]]:
    db = get_db()
    doc = db.collection("users").document(uid).collection("addresses").document(address_id).get()
    if doc.exists:
        return {"id": doc.id, **doc.to_dict()}
    return None


def create_address(uid: str, address_data: Dict[str, Any]) -> Dict[str, Any]:
    db = get_db()
    col = db.collection("users").document(uid).collection("addresses")
    ref = col.document()
    
    # If is_default is true, unset default on other addresses
    if address_data.get("is_default"):
        for d in col.where(filter=FieldFilter("is_default", "==", True)).stream():
            d.reference.update({"is_default": False})
            
    ref.set(address_data)
    return {"id": ref.id, **address_data}


def update_address(uid: str, address_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    db = get_db()
    ref = db.collection("users").document(uid).collection("addresses").document(address_id)
    doc = ref.get()
    if not doc.exists:
        return None
        
    if update_data.get("is_default"):
        col = db.collection("users").document(uid).collection("addresses")
        for d in col.where(filter=FieldFilter("is_default", "==", True)).stream():
            if d.id != address_id:
                d.reference.update({"is_default": False})
                
    ref.update(update_data)
    return {"id": address_id, **doc.to_dict(), **update_data}


def delete_address(uid: str, address_id: str) -> bool:
    db = get_db()
    ref = db.collection("users").document(uid).collection("addresses").document(address_id)
    doc = ref.get()
    if not doc.exists:
        return False
    ref.delete()
    return True


# List users for admin with cursor pagination
def list_users(
    role: Optional[str] = None,
    q: Optional[str] = None,
    status: Optional[str] = None,
    page_size: int = 10,
    cursor: Optional[str] = None,
) -> Tuple[List[Dict[str, Any]], Optional[str], int]:
    db = get_db()
    query = db.collection("users")
    
    if role:
        query = query.where(filter=FieldFilter("role", "==", role))
    if status is not None:
        is_active = True if status == "active" or status is True else False
        query = query.where(filter=FieldFilter("is_active", "==", is_active))
    if q:
        q_lower = q.lower().strip()
        query = query.where(filter=FieldFilter("name_lower", ">=", q_lower)).where(
            filter=FieldFilter("name_lower", "<=", q_lower + "\uf8ff")
        )
    else:
        query = query.order_by("created_at", direction="DESCENDING")
        
    # Get total count via count aggregation
    count_query = query.count()
    count_results = count_query.get()
    total = count_results[0][0].value
    
    # Cursor pagination
    if cursor:
        cursor_doc = db.collection("users").document(cursor).get()
        if cursor_doc.exists:
            query = query.start_after(cursor_doc)
            
    docs = list(query.limit(page_size).stream())
    items = [{"id": d.id, **d.to_dict()} for d in docs]
    next_cursor = docs[-1].id if len(docs) == page_size else None
    
    return items, next_cursor, total


def list_agents(available: Optional[bool] = None) -> List[Dict[str, Any]]:
    db = get_db()
    query = db.collection("users").where(filter=FieldFilter("role", "==", "agent")).where(filter=FieldFilter("is_active", "==", True))
    if available:
        query = query.where(filter=FieldFilter("agent_profile.is_online", "==", True))
    docs = query.stream()
    result = []
    for d in docs:
        data = d.to_dict()
        prof = data.get("agent_profile", {})
        result.append({
            "id": d.id,
            "name": data.get("name", ""),
            "phone": data.get("phone", ""),
            "is_online": prof.get("is_online", False),
            "active_tasks": prof.get("active_tasks", 0),
        })
    return result


def list_staff() -> List[Dict[str, Any]]:
    db = get_db()
    docs = db.collection("users").where(filter=FieldFilter("role", "==", "staff")).where(filter=FieldFilter("is_active", "==", True)).stream()
    result = []
    for d in docs:
        data = d.to_dict()
        prof = data.get("staff_profile", {})
        result.append({
            "id": d.id,
            "name": data.get("name", ""),
            "email": data.get("email", ""),
            "phone": data.get("phone", ""),
            "active_orders": prof.get("active_orders", 0),
        })
    return result
