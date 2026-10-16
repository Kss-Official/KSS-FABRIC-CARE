from datetime import datetime, timezone
from google.cloud.firestore_v1.transaction import Transaction
from app.core.firebase import get_db


def get_next_order_code(transaction: Transaction) -> str:
    db = get_db()
    ref = db.collection("counters").document("orders")
    snapshot = ref.get(transaction=transaction)
    if snapshot.exists:
        curr = snapshot.to_dict().get("next", 10001)
    else:
        curr = 10001
    
    next_val = curr + 1
    transaction.set(ref, {"next": next_val}, merge=True)
    return f"FC-{curr}"


def get_next_invoice_no(transaction: Transaction, year: int = None) -> str:
    if year is None:
        year = datetime.now(timezone.utc).year
    db = get_db()
    ref = db.collection("counters").document(f"invoices_{year}")
    snapshot = ref.get(transaction=transaction)
    if snapshot.exists:
        curr = snapshot.to_dict().get("next", 1)
    else:
        curr = 1
    
    next_val = curr + 1
    transaction.set(ref, {"next": next_val}, merge=True)
    return f"INV-{year}-{curr:06d}"
