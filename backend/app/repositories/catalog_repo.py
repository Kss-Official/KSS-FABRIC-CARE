from typing import List, Optional, Dict, Any
from app.core.firebase import get_db


def get_active_garments() -> List[Dict[str, Any]]:
    db = get_db()
    docs = db.collection("garment_types").where("is_active", "==", True).stream()
    return [{"id": d.id, **d.to_dict()} for d in docs]


def get_all_garments() -> List[Dict[str, Any]]:
    db = get_db()
    docs = db.collection("garment_types").stream()
    return [{"id": d.id, **d.to_dict()} for d in docs]


def get_active_services() -> List[Dict[str, Any]]:
    db = get_db()
    docs = db.collection("services").where("is_active", "==", True).stream()
    return [{"id": d.id, **d.to_dict()} for d in docs]


def get_all_services() -> List[Dict[str, Any]]:
    db = get_db()
    docs = db.collection("services").stream()
    return [{"id": d.id, **d.to_dict()} for d in docs]


def get_all_prices() -> List[Dict[str, Any]]:
    db = get_db()
    docs = db.collection("prices").stream()
    return [{"id": d.id, **d.to_dict()} for d in docs]


def get_catalog_active() -> Dict[str, Any]:
    return {
        "garments": get_active_garments(),
        "services": get_active_services(),
        "prices": get_all_prices(),
    }


def get_price(garment_id: str, service_id: str) -> Optional[int]:
    db = get_db()
    doc_id = f"{garment_id}_{service_id}"
    doc = db.collection("prices").document(doc_id).get()
    if doc.exists:
        return doc.to_dict().get("price_paise", 0)
    return None


def create_garment(name: str) -> Dict[str, Any]:
    db = get_db()
    ref = db.collection("garment_types").document()
    data = {"name": name, "is_active": True}
    ref.set(data)
    return {"id": ref.id, **data}


def update_garment(garment_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    db = get_db()
    ref = db.collection("garment_types").document(garment_id)
    doc = ref.get()
    if not doc.exists:
        return None
    ref.update(update_data)
    return {"id": garment_id, **doc.to_dict(), **update_data}


def create_service(name: str) -> Dict[str, Any]:
    db = get_db()
    ref = db.collection("services").document()
    data = {"name": name, "is_active": True}
    ref.set(data)
    return {"id": ref.id, **data}


def update_service(service_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    db = get_db()
    ref = db.collection("services").document(service_id)
    doc = ref.get()
    if not doc.exists:
        return None
    ref.update(update_data)
    return {"id": service_id, **doc.to_dict(), **update_data}


def set_prices_batch(prices: List[Dict[str, Any]]) -> None:
    db = get_db()
    batch = db.batch()
    for p in prices:
        doc_id = f"{p['garment_id']}_{p['service_id']}"
        ref = db.collection("prices").document(doc_id)
        batch.set(ref, {
            "garment_id": p["garment_id"],
            "service_id": p["service_id"],
            "price_paise": p["price_paise"],
        })
    batch.commit()
