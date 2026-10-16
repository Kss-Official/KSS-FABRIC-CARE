from typing import List, Optional, Dict, Any
from google.cloud.firestore_v1.transaction import Transaction
from app.core.firebase import get_db


def record_payment_success(
    amount_paise: int,
    is_express: bool,
    services_list: List[str],
    date_str: str,
    transaction: Transaction,
) -> None:
    db = get_db()
    ref = db.collection("stats").document(f"daily_{date_str}")
    doc = ref.get(transaction=transaction)
    
    if doc.exists:
        data = doc.to_dict()
        orders_placed = data.get("orders_placed", 0) + 1
        express_count = data.get("express_count", 0) + (1 if is_express else 0)
        revenue_paise = data.get("revenue_paise", 0) + amount_paise
        service_counts = data.get("service_counts", {})
        for s in services_list:
            service_counts[s] = service_counts.get(s, 0) + 1
    else:
        orders_placed = 1
        express_count = 1 if is_express else 0
        revenue_paise = amount_paise
        service_counts = {s: 1 for s in services_list}
        
    transaction.set(ref, {
        "orders_placed": orders_placed,
        "express_count": express_count,
        "revenue_paise": revenue_paise,
        "service_counts": service_counts,
        "date": date_str,
    }, merge=True)


def record_refund(
    amount_paise: int,
    date_str: str,
    transaction: Transaction,
) -> None:
    db = get_db()
    ref = db.collection("stats").document(f"daily_{date_str}")
    doc = ref.get(transaction=transaction)
    if doc.exists:
        data = doc.to_dict()
        revenue_paise = max(0, data.get("revenue_paise", 0) - amount_paise)
        transaction.set(ref, {"revenue_paise": revenue_paise}, merge=True)


def get_daily_stats_range(dates: List[str]) -> List[Dict[str, Any]]:
    db = get_db()
    results = []
    for d_str in dates:
        doc = db.collection("stats").document(f"daily_{d_str}").get()
        if doc.exists:
            results.append({"date": d_str, **doc.to_dict()})
        else:
            results.append({
                "date": d_str,
                "orders_placed": 0,
                "express_count": 0,
                "revenue_paise": 0,
                "service_counts": {},
            })
    return results
