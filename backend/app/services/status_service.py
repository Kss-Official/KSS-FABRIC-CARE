from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from google.cloud.firestore_v1.transaction import Transaction, transactional
from google.cloud.firestore_v1.base_query import FieldFilter
from app.core.firebase import get_db
from app.core.config import settings
from app.core.errors import ForbiddenError, ConflictError, NotFoundError
from app.repositories.order_repo import (
    ORDER_STAGES,
    get_next_order_status,
)
from app.repositories import order_repo, task_repo, notification_repo, user_repo, audit_repo


STEP_LABELS: Dict[str, str] = {
    "PAYMENT_PENDING": "Payment pending",
    "PLACED": "Order placed",
    "PICKUP_SCHEDULED": "Pickup scheduled",
    "PICKED_UP": "Picked up",
    "RECEIVED": "Received at laundry",
    "INSPECTION": "Inspection",
    "WASHING": "Washing",
    "DRYING": "Drying",
    "IRONING": "Ironing",
    "FOLDING": "Folding",
    "QUALITY_CHECK": "Quality check",
    "PACKING": "Packing",
    "READY_FOR_DELIVERY": "Ready for delivery",
    "OUT_FOR_DELIVERY": "Out for delivery",
    "DELIVERED": "Delivered",
    "CANCELLED": "Cancelled",
}


def notify_admins(title: str, body: str, order_id: Optional[str] = None):
    db = get_db()
    admin_docs = db.collection("users").where(filter=FieldFilter("role", "==", "admin")).where(filter=FieldFilter("is_active", "==", True)).stream()
    for doc in admin_docs:
        notification_repo.create_notification(
            user_id=doc.id,
            notif_data={"type": "order_update", "title": title, "body": body, "order_id": order_id},
        )


def notify_staff(title: str, body: str, order_id: Optional[str] = None):
    db = get_db()
    staff_docs = db.collection("users").where(filter=FieldFilter("role", "==", "staff")).where(filter=FieldFilter("is_active", "==", True)).stream()
    for doc in staff_docs:
        notification_repo.create_notification(
            user_id=doc.id,
            notif_data={"type": "order_update", "title": title, "body": body, "order_id": order_id},
        )


@transactional
def _change_status_tx(
    transaction: Transaction,
    order_id: str,
    to_status: str,
    actor: Dict[str, Any],
    note: Optional[str] = None,
    is_override: bool = False,
    ip: Optional[str] = None,
) -> Dict[str, Any]:
    db = get_db()
    order_ref = db.collection("orders").document(order_id)

    # =========================================================================
    # PHASE 1: ALL READS (Must execute before any write in the transaction)
    # =========================================================================
    order_doc = order_ref.get(transaction=transaction)
    if not order_doc.exists:
        raise NotFoundError("Order not found")

    order = order_doc.to_dict()
    order["id"] = order_doc.id
    current_status = order.get("status")
    actor_role = actor.get("role", "system")
    actor_id = actor.get("id")
    actor_name = actor.get("name", "System")
    code = order.get("code", "FC-XXXXX")
    now_iso = datetime.now(timezone.utc).isoformat()

    # Pre-read pickup task if needed
    pickup_task = None
    if to_status == "RECEIVED":
        pickup_task = task_repo.get_task_by_order_type(order_id, "pickup", transaction=transaction)

    # Pre-read existing delivery task if needed
    existing_deliv = None
    if to_status == "OUT_FOR_DELIVERY":
        existing_deliv = task_repo.get_task_by_order_type(order_id, "delivery", transaction=transaction)

    # Pre-read admin and staff user IDs for notifications
    admin_uids = [
        d.id for d in db.collection("users").where(filter=FieldFilter("role", "==", "admin")).where(filter=FieldFilter("is_active", "==", True)).stream()
    ]
    staff_uids = [
        d.id for d in db.collection("users").where(filter=FieldFilter("role", "==", "staff")).where(filter=FieldFilter("is_active", "==", True)).stream()
    ]

    # Pre-read available agent if auto-assigning delivery
    assigned_delivery_agent = None
    if to_status == "OUT_FOR_DELIVERY" and not existing_deliv and settings.AUTO_ASSIGN:
        available_agents = user_repo.list_agents(available=True)
        if available_agents:
            available_agents.sort(key=lambda a: a.get("active_tasks", 0))
            assigned_delivery_agent = available_agents[0]

    # Validate transition rules
    if to_status == "CANCELLED":
        if actor_role == "customer":
            allowed_cancel_statuses = ["PAYMENT_PENDING", "PLACED", "PICKUP_SCHEDULED"]
            if current_status not in allowed_cancel_statuses:
                raise ConflictError("Orders cannot be cancelled once picked up")
            if order.get("customer_id") != actor_id:
                raise ForbiddenError("You cannot cancel another customer's order")
        elif actor_role == "admin":
            if current_status in ["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]:
                raise ConflictError("Cannot cancel order after it is out for delivery")
        elif actor_role == "system":
            pass
        else:
            raise ForbiddenError("Only customer or admin can cancel an order")
    elif is_override:
        if actor_role != "admin":
            raise ForbiddenError("Only admins can perform status override")
        if not note:
            raise ConflictError("Note is required for status override")
        try:
            curr_idx = ORDER_STAGES.index(current_status)
            target_idx = ORDER_STAGES.index(to_status)
            if target_idx <= curr_idx:
                raise ConflictError("Status override can only move to a later status")
        except ValueError:
            raise ConflictError(f"Invalid target status: {to_status}")
    else:
        expected_next = get_next_order_status(current_status)
        if to_status != expected_next:
            raise ConflictError(
                f"Invalid transition from {current_status} to {to_status}",
                fields={"expected": expected_next, "code": "INVALID_TRANSITION"}
            )
        if to_status == "PLACED":
            if actor_role != "system":
                raise ForbiddenError("Only system can mark order as PLACED upon payment")
        elif to_status == "PICKUP_SCHEDULED":
            if actor_role not in ["admin", "system"]:
                raise ForbiddenError("Only admin can schedule pickup")
        elif to_status == "PICKED_UP":
            if actor_role not in ["agent", "admin", "system"]:
                raise ForbiddenError("Only delivery agent can complete pickup")
        elif to_status in ["RECEIVED", "INSPECTION", "WASHING", "DRYING", "IRONING", "FOLDING", "QUALITY_CHECK", "PACKING", "READY_FOR_DELIVERY", "OUT_FOR_DELIVERY"]:
            if actor_role not in ["staff", "admin"]:
                raise ForbiddenError("Only laundry staff can update laundry stages")
            if to_status == "RECEIVED":
                if not pickup_task or pickup_task.get("status") != "completed":
                    raise ConflictError("Cannot mark RECEIVED until pickup task is completed")
        elif to_status == "DELIVERED":
            if actor_role not in ["agent", "admin"]:
                raise ForbiddenError("Staff can never set DELIVERED (only agent OTP or admin override)")

    # =========================================================================
    # PHASE 2: ALL WRITES
    # =========================================================================
    if to_status == "CANCELLED":
        update_fields = {
            "status": "CANCELLED",
            "cancelled_at": now_iso,
            "cancel_reason": note or "Order cancelled",
            "last_status_at": now_iso,
        }
        transaction.update(order_ref, update_fields)
        order_repo.add_order_history(
            order_id=order_id,
            history_data={
                "from_status": current_status,
                "to_status": "CANCELLED",
                "changed_by": actor_id,
                "changed_by_name": actor_name,
                "note": note or "Cancelled",
            },
            transaction=transaction,
        )
        notification_repo.create_notification(
            user_id=order.get("customer_id"),
            notif_data={"type": "order_update", "title": "Order cancelled", "body": f"Order {code} has been cancelled.", "order_id": order_id},
            transaction=transaction,
        )
        if current_status != "PAYMENT_PENDING":
            for ad_id in admin_uids:
                notification_repo.create_notification(
                    user_id=ad_id,
                    notif_data={"type": "order_update", "title": "Order cancelled", "body": f"Order {code} was cancelled ({note or 'No reason provided'}).", "order_id": order_id},
                    transaction=transaction,
                )
        order.update(update_fields)
        return order

    # Normal or override status update
    update_fields = {
        "status": to_status,
        "last_status_at": now_iso,
    }
    if to_status == "PLACED" and not order.get("placed_at"):
        update_fields["placed_at"] = now_iso
    elif to_status == "RECEIVED" and not order.get("received_at"):
        update_fields["received_at"] = now_iso
    elif to_status == "DELIVERED" and not order.get("delivered_at"):
        update_fields["delivered_at"] = now_iso

    # When staff sets OUT_FOR_DELIVERY, create delivery task
    delivery_task_assigned_agent_id = None
    if to_status == "OUT_FOR_DELIVERY" and not existing_deliv:
        deliv_ref = db.collection("tasks").document()
        agent_id_val = assigned_delivery_agent["id"] if assigned_delivery_agent else None
        agent_name_val = assigned_delivery_agent["name"] if assigned_delivery_agent else None
        delivery_task_assigned_agent_id = agent_id_val

        deliv_task_data = {
            "id": deliv_ref.id,
            "order_id": order_id,
            "order_code": code,
            "type": "delivery",
            "status": "assigned" if agent_id_val else "unassigned",
            "agent_id": agent_id_val,
            "agent_name": agent_name_val,
            "customer": order.get("customer", {}),
            "address": order.get("address", {}),
            "items_count": sum(it.get("quantity", 1) for it in order.get("items", [])),
            "scheduled_at": now_iso,
            "otp_hash": None,
            "otp_expires_at": None,
            "otp_attempts": 0,
            "started_at": None,
            "completed_at": None,
            "fail_reason": None,
        }
        transaction.set(deliv_ref, deliv_task_data)

    transaction.update(order_ref, update_fields)

    # History
    order_repo.add_order_history(
        order_id=order_id,
        history_data={
            "from_status": current_status,
            "to_status": to_status,
            "changed_by": actor_id,
            "changed_by_name": actor_name,
            "note": note,
        },
        transaction=transaction,
    )

    # Notifications
    step_label = STEP_LABELS.get(to_status, to_status)
    if to_status == "PLACED":
        notification_repo.create_notification(
            user_id=order.get("customer_id"),
            notif_data={"type": "order_update", "title": "Payment received", "body": f"Payment received. Order {code} placed.", "order_id": order_id},
            transaction=transaction,
        )
        for ad_id in admin_uids:
            notification_repo.create_notification(
                user_id=ad_id,
                notif_data={"type": "order_update", "title": "New order", "body": f"New order {code} placed.", "order_id": order_id},
                transaction=transaction,
            )
    elif to_status == "PICKUP_SCHEDULED":
        notification_repo.create_notification(
            user_id=order.get("customer_id"),
            notif_data={"type": "order_update", "title": "Pickup scheduled", "body": f"Pickup scheduled for order {code}.", "order_id": order_id},
            transaction=transaction,
        )
    elif to_status == "PICKED_UP":
        notification_repo.create_notification(
            user_id=order.get("customer_id"),
            notif_data={"type": "order_update", "title": "Clothes picked up", "body": f"Your clothes for order {code} have been picked up.", "order_id": order_id},
            transaction=transaction,
        )
        for st_id in staff_uids:
            notification_repo.create_notification(
                user_id=st_id,
                notif_data={"type": "order_update", "title": "Incoming laundry", "body": f"{code} is on the way to the laundry.", "order_id": order_id},
                transaction=transaction,
            )
    elif to_status in ["RECEIVED", "INSPECTION", "WASHING", "DRYING", "IRONING", "FOLDING", "QUALITY_CHECK", "PACKING", "READY_FOR_DELIVERY"]:
        notification_repo.create_notification(
            user_id=order.get("customer_id"),
            notif_data={"type": "order_update", "title": "Order in progress", "body": f"Your clothes are in {step_label}.", "order_id": order_id},
            transaction=transaction,
        )
    elif to_status == "OUT_FOR_DELIVERY":
        notification_repo.create_notification(
            user_id=order.get("customer_id"),
            notif_data={"type": "order_update", "title": "Out for delivery", "body": f"Order {code} is out for delivery.", "order_id": order_id},
            transaction=transaction,
        )
        if delivery_task_assigned_agent_id:
            notification_repo.create_notification(
                user_id=delivery_task_assigned_agent_id,
                notif_data={"type": "task_assigned", "title": "New delivery assigned", "body": f"You have been assigned delivery for {code}.", "order_id": order_id},
                transaction=transaction,
            )
        else:
            for ad_id in admin_uids:
                notification_repo.create_notification(
                    user_id=ad_id,
                    notif_data={"type": "order_update", "title": "Unassigned delivery", "body": f"Order {code} is ready for delivery but unassigned.", "order_id": order_id},
                    transaction=transaction,
                )
    elif to_status == "DELIVERED":
        notification_repo.create_notification(
            user_id=order.get("customer_id"),
            notif_data={"type": "order_delivered", "title": "Delivered", "body": f"Order {code} has been delivered. Thank you for choosing FabriCare!", "order_id": order_id},
            transaction=transaction,
        )
        for ad_id in admin_uids:
            notification_repo.create_notification(
                user_id=ad_id,
                notif_data={"type": "order_delivered", "title": "Order delivered", "body": f"Order {code} has been delivered.", "order_id": order_id},
                transaction=transaction,
            )

    order.update(update_fields)
    return order


def change_status(
    order_id: str,
    to_status: str,
    actor: Dict[str, Any],
    note: Optional[str] = None,
    is_override: bool = False,
    ip: Optional[str] = None,
) -> Dict[str, Any]:
    db = get_db()
    tx = db.transaction()
    order = _change_status_tx(
        transaction=tx,
        order_id=order_id,
        to_status=to_status,
        actor=actor,
        note=note,
        is_override=is_override,
        ip=ip,
    )
    if is_override or actor.get("role") == "admin":
        audit_repo.log_audit(
            actor_id=actor.get("id") or "system",
            action="ORDER_STATUS_OVERRIDE" if is_override else f"ORDER_STATUS_{to_status}",
            entity="order",
            entity_id=order_id,
            before=None,
            after={"status": to_status, "note": note},
            ip=ip,
        )
    return order
