from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List
from google.cloud.firestore_v1.transaction import Transaction, transactional
from google.cloud.firestore_v1.base_query import FieldFilter
from app.core.firebase import get_db
from app.core.config import settings
from app.core.errors import ConflictError, NotFoundError, ForbiddenError
from app.services.payment_gateway import get_payment_gateway
from app.repositories import payment_repo, order_repo, invoice_repo, counter_repo, stats_repo, notification_repo, task_repo, audit_repo


def initiate_payment(order_id: str, user_id: str, method: str) -> Dict[str, Any]:
    order = order_repo.get_order(order_id)
    if not order:
        raise NotFoundError("Order not found")
    if order.get("customer_id") != user_id:
        raise ForbiddenError("Cannot pay for another user's order")
    if order.get("status") != "PAYMENT_PENDING" or order.get("payment_status") != "pending":
        raise ConflictError("Order is not in payable state", fields={"code": "ORDER_NOT_PAYABLE"})

    expires_at = order.get("payment_expires_at")
    now_iso = datetime.now(timezone.utc).isoformat()
    if expires_at and expires_at < now_iso:
        raise ConflictError("Payment window has expired", fields={"code": "ORDER_NOT_PAYABLE"})

    gateway = get_payment_gateway()
    gw_order = gateway.create_order(amount_paise=order["total_paise"], receipt=order.get("code", "FC-XXXXX"))

    payment_doc = payment_repo.create_payment({
        "order_id": order_id,
        "order_code": order.get("code", "FC-XXXXX"),
        "user_id": user_id,
        "amount_paise": order["total_paise"],
        "method": method,
        "status": "created",
        "gateway_order_id": gw_order["gateway_order_id"],
        "gateway_payment_id": None,
        "gateway_signature": None,
        "failure_reason": None,
    })

    return {
        "payment_id": payment_doc["id"],
        "gateway_order_id": gw_order["gateway_order_id"],
        "amount_paise": order["total_paise"],
        "gateway_key": gw_order.get("gateway_key"),
    }


@transactional
def _verify_and_complete_payment_tx(
    transaction: Transaction,
    payment_id: str,
    gateway_payment_id: Optional[str] = None,
    gateway_signature: Optional[str] = None,
) -> Dict[str, Any]:
    db = get_db()
    pay_ref = db.collection("payments").document(payment_id)
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    now_date = now.strftime("%Y-%m-%d")

    # =========================================================================
    # PHASE 1: ALL READS
    # =========================================================================
    pay_doc = pay_ref.get(transaction=transaction)
    if not pay_doc.exists:
        raise NotFoundError("Payment record not found")

    payment = pay_doc.to_dict()
    payment["id"] = pay_doc.id

    if payment.get("status") == "paid":
        order = order_repo.get_order(payment["order_id"], transaction=transaction)
        return {"status": "paid", "order": order}

    order_id = payment["order_id"]
    order_ref = db.collection("orders").document(order_id)
    order_doc = order_ref.get(transaction=transaction)
    if not order_doc.exists:
        raise NotFoundError("Order not found")

    order = order_doc.to_dict()
    order["id"] = order_doc.id

    # Read invoice counter
    inv_counter_ref = db.collection("counters").document(f"invoices_{now.year}")
    inv_counter_doc = inv_counter_ref.get(transaction=transaction)
    curr_inv_num = inv_counter_doc.to_dict().get("next", 1) if inv_counter_doc.exists else 1
    invoice_no = f"INV-{now.year}-{curr_inv_num:06d}"

    # Read stats document
    stats_ref = db.collection("stats").document(f"daily_{now_date}")
    stats_doc = stats_ref.get(transaction=transaction)

    # Read admin users for notifications
    admin_uids = [
        d.id for d in db.collection("users").where(filter=FieldFilter("role", "==", "admin")).where(filter=FieldFilter("is_active", "==", True)).stream()
    ]

    # =========================================================================
    # PHASE 2: ALL WRITES
    # =========================================================================
    # 1. Update Payment
    transaction.update(pay_ref, {
        "status": "paid",
        "gateway_payment_id": gateway_payment_id,
        "gateway_signature": gateway_signature,
        "paid_at": now_iso,
    })

    # 2. Increment invoice counter
    transaction.set(inv_counter_ref, {"next": curr_inv_num + 1}, merge=True)

    # 3. Create invoice
    inv_ref = db.collection("invoices").document()
    inv_data = {
        "id": inv_ref.id,
        "invoice_no": invoice_no,
        "order_id": order_id,
        "order_code": order.get("code", "FC-XXXXX"),
        "customer_id": order.get("customer_id"),
        "amount_paise": order.get("total_paise", 0),
        "status": "paid",
        "issued_at": now_iso,
        "pdf_url": None,
        "line_items": order.get("items", []),
    }
    transaction.set(inv_ref, inv_data)

    # 4. Update Order
    hours = settings.EXPRESS_HOURS if order.get("is_express") else settings.STANDARD_HOURS
    due_by_iso = (now + timedelta(hours=hours)).isoformat()
    order_updates = {
        "status": "PLACED",
        "payment_status": "paid",
        "placed_at": now_iso,
        "due_by": due_by_iso,
        "invoice_id": inv_ref.id,
        "last_status_at": now_iso,
    }
    transaction.update(order_ref, order_updates)
    order.update(order_updates)

    # 5. Create Pickup Task (unassigned)
    pickup_ref = db.collection("tasks").document()
    pickup_task = {
        "id": pickup_ref.id,
        "order_id": order_id,
        "order_code": order.get("code", "FC-XXXXX"),
        "type": "pickup",
        "status": "unassigned",
        "agent_id": None,
        "agent_name": None,
        "customer": order.get("customer", {}),
        "address": order.get("address", {}),
        "items_count": sum(it.get("quantity", 1) for it in order.get("items", [])),
        "scheduled_at": order.get("pickup", {}).get("date", now_iso),
        "otp_hash": None,
        "otp_expires_at": None,
        "otp_attempts": 0,
        "started_at": None,
        "completed_at": None,
        "fail_reason": None,
    }
    transaction.set(pickup_ref, pickup_task)

    # 6. Add History
    hist_ref = order_ref.collection("history").document()
    transaction.set(hist_ref, {
        "from_status": "PAYMENT_PENDING",
        "to_status": "PLACED",
        "changed_by": None,
        "changed_by_name": "System",
        "note": "Payment completed online",
        "created_at": now_iso,
    })

    # 7. Customer & Admin Notifications
    code = order.get("code", "FC-XXXXX")
    cust_notif_ref = db.collection("notifications").document()
    transaction.set(cust_notif_ref, {
        "user_id": order.get("customer_id"),
        "type": "order_update",
        "title": "Payment received",
        "body": f"Payment received. Order {code} placed.",
        "order_id": order_id,
        "is_read": False,
        "created_at": now_iso,
    })
    for ad_id in admin_uids:
        ad_notif_ref = db.collection("notifications").document()
        transaction.set(ad_notif_ref, {
            "user_id": ad_id,
            "type": "order_update",
            "title": "New order",
            "body": f"New order {code} placed.",
            "order_id": order_id,
            "is_read": False,
            "created_at": now_iso,
        })

    # 8. Update Daily Stats
    if stats_doc.exists:
        sdata = stats_doc.to_dict()
        orders_placed = sdata.get("orders_placed", 0) + 1
        express_count = sdata.get("express_count", 0) + (1 if order.get("is_express") else 0)
        revenue_paise = sdata.get("revenue_paise", 0) + order.get("total_paise", 0)
        service_counts = sdata.get("service_counts", {})
        for it in order.get("items", []):
            for s in it.get("services", []):
                s_name = s.get("name") if isinstance(s, dict) else str(s)
                service_counts[s_name] = service_counts.get(s_name, 0) + 1
    else:
        orders_placed = 1
        express_count = 1 if order.get("is_express") else 0
        revenue_paise = order.get("total_paise", 0)
        service_counts = {}
        for it in order.get("items", []):
            for s in it.get("services", []):
                s_name = s.get("name") if isinstance(s, dict) else str(s)
                service_counts[s_name] = service_counts.get(s_name, 0) + 1

    transaction.set(stats_ref, {
        "orders_placed": orders_placed,
        "express_count": express_count,
        "revenue_paise": revenue_paise,
        "service_counts": service_counts,
        "date": now_date,
    }, merge=True)

    return {"status": "paid", "order": order, "invoice": inv_data}


def verify_payment(payment_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    payment = payment_repo.get_payment(payment_id)
    if not payment:
        raise NotFoundError("Payment not found")

    gateway = get_payment_gateway()
    is_valid = gateway.verify_payment(payload)
    if not is_valid:
        payment_repo.update_payment(payment_id, {"status": "failed", "failure_reason": "Invalid payment signature"})
        raise ConflictError("Payment verification failed", fields={"code": "PAYMENT_FAILED"})

    db = get_db()
    tx = db.transaction()
    result = _verify_and_complete_payment_tx(
        transaction=tx,
        payment_id=payment_id,
        gateway_payment_id=payload.get("razorpay_payment_id") or payload.get("payment_id"),
        gateway_signature=payload.get("razorpay_signature"),
    )
    return result


def process_payment_webhook(body_bytes: bytes, signature: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    gateway = get_payment_gateway()
    if not gateway.verify_webhook(body_bytes, signature):
        raise ForbiddenError("Invalid webhook signature")

    event = payload.get("event", "payment.captured")
    if event in ["payment.captured", "order.paid", "mock.payment.success"]:
        entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        gw_order_id = entity.get("order_id") or payload.get("gateway_order_id")
        gw_payment_id = entity.get("id") or payload.get("gateway_payment_id")
        
        payment = None
        if gw_order_id:
            payment = payment_repo.get_payment_by_gateway_order_id(gw_order_id)
        if not payment and payload.get("payment_id"):
            payment = payment_repo.get_payment(payload["payment_id"])

        if payment:
            db = get_db()
            tx = db.transaction()
            return _verify_and_complete_payment_tx(
                transaction=tx,
                payment_id=payment["id"],
                gateway_payment_id=gw_payment_id,
                gateway_signature=signature,
            )

    return {"status": "ignored"}


@transactional
def _refund_order_tx(
    transaction: Transaction,
    order_id: str,
    amount_paise: int,
    reason: str,
    actor_id: str,
) -> None:
    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()
    now_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # PHASE 1: ALL READS
    order_ref = db.collection("orders").document(order_id)
    order_doc = order_ref.get(transaction=transaction)
    if not order_doc.exists:
        raise NotFoundError("Order not found")

    pay_docs = list(db.collection("payments").where(filter=FieldFilter("order_id", "==", order_id)).limit(1).stream(transaction=transaction))
    inv_docs = list(db.collection("invoices").where(filter=FieldFilter("order_id", "==", order_id)).limit(1).stream(transaction=transaction))
    stats_ref = db.collection("stats").document(f"daily_{now_date}")
    stats_doc = stats_ref.get(transaction=transaction)

    # PHASE 2: ALL WRITES
    transaction.update(order_ref, {
        "status": "CANCELLED",
        "payment_status": "refunded",
        "cancelled_at": now_iso,
        "cancel_reason": reason,
        "last_status_at": now_iso,
    })

    if pay_docs:
        transaction.update(pay_docs[0].reference, {"status": "refunded"})

    if inv_docs:
        transaction.update(inv_docs[0].reference, {"status": "refunded"})

    if stats_doc.exists:
        rev = max(0, stats_doc.to_dict().get("revenue_paise", 0) - amount_paise)
        transaction.set(stats_ref, {"revenue_paise": rev}, merge=True)


def refund_order(order_id: str, reason: str, actor: Dict[str, Any]) -> None:
    order = order_repo.get_order(order_id)
    if not order:
        raise NotFoundError("Order not found")

    gateway = get_payment_gateway()
    payment = payment_repo.get_payment_by_order(order_id)
    if payment and payment.get("gateway_payment_id"):
        try:
            gateway.refund(payment["gateway_payment_id"], order.get("total_paise", 0))
        except Exception:
            pass

    db = get_db()
    tx = db.transaction()
    _refund_order_tx(
        transaction=tx,
        order_id=order_id,
        amount_paise=order.get("total_paise", 0),
        reason=reason,
        actor_id=actor.get("id", "system"),
    )
