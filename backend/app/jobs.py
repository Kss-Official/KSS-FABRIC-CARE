from datetime import datetime, timezone, timedelta
from app.core.firebase import get_db
from app.repositories import order_repo, notification_repo
from app.services import status_service


def run_expire_unpaid_jobs() -> int:
    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()
    # Query unpaid expired orders
    query = (
        db.collection("orders")
        .where("status", "==", "PAYMENT_PENDING")
        .where("payment_expires_at", "<", now_iso)
    )
    docs = list(query.stream())
    cancelled_count = 0
    for doc in docs:
        try:
            status_service.change_status(
                order_id=doc.id,
                to_status="CANCELLED",
                actor={"id": "system", "name": "System Expiry Job", "role": "system"},
                note="Payment expired (30 minute timeout)",
            )
            cancelled_count += 1
        except Exception:
            pass
    return cancelled_count


def run_express_late_jobs() -> int:
    db = get_db()
    now = datetime.now(timezone.utc)
    two_hours_later = (now + timedelta(hours=2)).isoformat()
    pre_packing_statuses = ["RECEIVED", "INSPECTION", "WASHING", "DRYING", "IRONING", "FOLDING", "QUALITY_CHECK"]

    query = (
        db.collection("orders")
        .where("is_express", "==", True)
        .where("express_late_notified", "==", False)
    )
    docs = list(query.stream())
    notified_count = 0

    for doc in docs:
        data = doc.to_dict()
        due_by = data.get("due_by")
        st = data.get("status")
        if due_by and due_by <= two_hours_later and st in pre_packing_statuses:
            code = data.get("code", "FC-XXXXX")
            status_service.notify_staff(
                title="Express order running late",
                body=f"Express order {code} is due in under 2 hours and is currently in {st}.",
                order_id=doc.id,
            )
            db.collection("orders").document(doc.id).update({"express_late_notified": True})
            notified_count += 1

    return notified_count


def run_all_jobs() -> dict:
    expired = run_expire_unpaid_jobs()
    express = run_express_late_jobs()
    return {"expired_unpaid_cancelled": expired, "express_late_notified": express}


if __name__ == "__main__":
    import sys
    print("Running background jobs...")
    result = run_all_jobs()
    print("Result:", result)
