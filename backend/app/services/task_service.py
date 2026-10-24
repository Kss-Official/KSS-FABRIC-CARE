import random
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from google.cloud.firestore_v1.transaction import Transaction, transactional
from google.cloud.firestore_v1.base_query import FieldFilter
from app.core.firebase import get_db
from app.core.errors import NotFoundError, ForbiddenError, ConflictError, RateLimitError
from app.repositories import task_repo, order_repo, user_repo, notification_repo
from app.services import status_service


def hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()


def assign_task_to_agent(task_id: str, agent_id: str, admin_actor: Dict[str, Any]) -> Dict[str, Any]:
    agent = user_repo.get_user(agent_id)
    if not agent or agent.get("role") != "agent":
        raise NotFoundError("Agent not found")

    task = task_repo.get_task(task_id)
    if not task:
        raise NotFoundError("Task not found")

    prev_agent_id = task.get("agent_id")
    agent_name = agent.get("name", "Agent")
    now_iso = datetime.now(timezone.utc).isoformat()

    if prev_agent_id and prev_agent_id != agent_id:
        prev_agent = user_repo.get_user(prev_agent_id)
        if prev_agent:
            prof = prev_agent.get("agent_profile", {})
            prof["active_tasks"] = max(0, prof.get("active_tasks", 1) - 1)
            user_repo.update_user(prev_agent_id, {"agent_profile": prof})

    prof = agent.get("agent_profile", {})
    prof["active_tasks"] = prof.get("active_tasks", 0) + 1
    user_repo.update_user(agent_id, {"agent_profile": prof})

    task_repo.update_task(task_id, {
        "agent_id": agent_id,
        "agent_name": agent_name,
        "status": "assigned",
        "assigned_at": now_iso,
    })

    order_id = task.get("order_id")
    order = order_repo.get_order(order_id)
    if order and task.get("type") == "pickup" and order.get("status") == "PLACED":
        status_service.change_status(
            order_id=order_id,
            to_status="PICKUP_SCHEDULED",
            actor=admin_actor,
            note=f"Pickup assigned to agent {agent_name}",
        )

    code = task.get("order_code", "")
    notification_repo.create_notification(
        user_id=agent_id,
        notif_data={
            "type": "task_assigned",
            "title": f"New {task.get('type')} assigned",
            "body": f"You have been assigned order {code} for {task.get('type')}.",
            "order_id": order_id,
        },
    )

    if order:
        cust_id = order.get("customer_id")
        if cust_id:
            notification_repo.create_notification(
                user_id=cust_id,
                notif_data={
                    "type": "order_update",
                    "title": f"{task.get('type').capitalize()} scheduled",
                    "body": f"Agent {agent_name} will handle your {task.get('type')} for order {code}.",
                    "order_id": order_id,
                },
            )

    return task_repo.get_task(task_id)


def start_task(task_id: str, agent_id: str) -> Dict[str, Any]:
    task = task_repo.get_task(task_id)
    if not task:
        raise NotFoundError("Task not found")
    if task.get("agent_id") != agent_id:
        raise ForbiddenError("You are not assigned to this task")
    if task.get("status") != "assigned":
        raise ConflictError(f"Task cannot be started from status {task.get('status')}")

    otp = f"{random.randint(1000, 9999)}"
    hashed = hash_otp(otp)
    now = datetime.now(timezone.utc)
    expires_at = (now + timedelta(hours=24)).isoformat()

    task_repo.update_task(task_id, {
        "status": "on_the_way",
        "started_at": now.isoformat(),
        "otp_hash": hashed,
        "otp_expires_at": expires_at,
        "otp_attempts": 0,
    })

    order = order_repo.get_order(task.get("order_id"))
    if order and order.get("customer_id"):
        notification_repo.create_notification(
            user_id=order["customer_id"],
            notif_data={
                "type": "task_otp",
                "title": "Delivery verification OTP",
                "body": f"Your OTP is {otp} for order {task.get('order_code')}. Share it with the delivery agent.",
                "order_id": task.get("order_id"),
            },
        )

    return task_repo.get_task(task_id)


@transactional
def _complete_task_tx(
    transaction: Transaction,
    task_id: str,
    otp: str,
    notes: Optional[str],
    agent_id: str,
) -> Dict[str, Any]:
    db = get_db()
    task_ref = db.collection("tasks").document(task_id)
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    # =========================================================================
    # PHASE 1: ALL READS
    # =========================================================================
    task_doc = task_ref.get(transaction=transaction)
    if not task_doc.exists:
        raise NotFoundError("Task not found")

    task = task_doc.to_dict()
    task["id"] = task_doc.id

    if task.get("agent_id") != agent_id:
        raise ForbiddenError("You are not assigned to this task")
    if task.get("status") != "on_the_way":
        raise ConflictError(f"Task must be on_the_way to complete, currently {task.get('status')}")

    attempts = task.get("otp_attempts", 0)
    if attempts >= 5:
        raise RateLimitError("Maximum OTP attempts exceeded", fields={"code": "RATE_LIMITED"})

    stored_hash = task.get("otp_hash")
    input_hash = hash_otp(otp)
    if stored_hash != input_hash:
        transaction.update(task_ref, {"otp_attempts": attempts + 1})
        raise ConflictError("Invalid OTP provided", fields={"code": "INVALID_OTP"})

    expires_at = task.get("otp_expires_at")
    if expires_at and expires_at < now.isoformat():
        raise ConflictError("OTP has expired", fields={"code": "INVALID_OTP"})

    # Read Agent user
    agent_ref = db.collection("users").document(agent_id)
    agent_doc = agent_ref.get(transaction=transaction)
    agent_user = agent_doc.to_dict() if agent_doc.exists else {}

    # Read Order
    order_id = task.get("order_id")
    order_ref = db.collection("orders").document(order_id)
    order_doc = order_ref.get(transaction=transaction)
    if not order_doc.exists:
        raise NotFoundError("Order not found")
    order = order_doc.to_dict()

    # Read Admin and Staff UIDs for notifications
    admin_uids = [
        d.id for d in db.collection("users").where(filter=FieldFilter("role", "==", "admin")).where(filter=FieldFilter("is_active", "==", True)).stream()
    ]
    staff_uids = [
        d.id for d in db.collection("users").where(filter=FieldFilter("role", "==", "staff")).where(filter=FieldFilter("is_active", "==", True)).stream()
    ]

    # =========================================================================
    # PHASE 2: ALL WRITES
    # =========================================================================
    # 1. Update Task
    transaction.update(task_ref, {
        "status": "completed",
        "completed_at": now_iso,
        "notes": notes,
    })

    # 2. Update Agent active_tasks
    if agent_user:
        prof = agent_user.get("agent_profile", {})
        prof["active_tasks"] = max(0, prof.get("active_tasks", 1) - 1)
        transaction.update(agent_ref, {"agent_profile": prof})

    # 3. Update Order status
    target_status = "PICKED_UP" if task.get("type") == "pickup" else "DELIVERED"
    order_updates = {
        "status": target_status,
        "last_status_at": now_iso,
    }
    if target_status == "DELIVERED" and not order.get("delivered_at"):
        order_updates["delivered_at"] = now_iso
    transaction.update(order_ref, order_updates)

    # 4. History
    hist_ref = order_ref.collection("history").document()
    transaction.set(hist_ref, {
        "from_status": order.get("status"),
        "to_status": target_status,
        "changed_by": agent_id,
        "changed_by_name": agent_user.get("name", "Agent"),
        "note": f"{task.get('type').capitalize()} completed by agent with OTP",
        "created_at": now_iso,
    })

    # 5. Notifications
    code = order.get("code", "FC-XXXXX")
    if target_status == "PICKED_UP":
        cust_notif = db.collection("notifications").document()
        transaction.set(cust_notif, {
            "user_id": order.get("customer_id"),
            "type": "order_update",
            "title": "Clothes picked up",
            "body": f"Your clothes for order {code} have been picked up.",
            "order_id": order_id,
            "is_read": False,
            "created_at": now_iso,
        })
        for st_id in staff_uids:
            st_notif = db.collection("notifications").document()
            transaction.set(st_notif, {
                "user_id": st_id,
                "type": "order_update",
                "title": "Incoming laundry",
                "body": f"{code} is on the way to the laundry.",
                "order_id": order_id,
                "is_read": False,
                "created_at": now_iso,
            })
    elif target_status == "DELIVERED":
        cust_notif = db.collection("notifications").document()
        transaction.set(cust_notif, {
            "user_id": order.get("customer_id"),
            "type": "order_delivered",
            "title": "Delivered",
            "body": f"Order {code} has been delivered. Thank you for choosing FabriCare!",
            "order_id": order_id,
            "is_read": False,
            "created_at": now_iso,
        })
        for ad_id in admin_uids:
            ad_notif = db.collection("notifications").document()
            transaction.set(ad_notif, {
                "user_id": ad_id,
                "type": "order_delivered",
                "title": "Order delivered",
                "body": f"Order {code} has been delivered.",
                "order_id": order_id,
                "is_read": False,
                "created_at": now_iso,
            })

    task["status"] = "completed"
    task["completed_at"] = now_iso
    return task


def complete_task(task_id: str, otp: str, notes: Optional[str], agent_id: str) -> Dict[str, Any]:
    db = get_db()
    tx = db.transaction()
    return _complete_task_tx(
        transaction=tx,
        task_id=task_id,
        otp=otp,
        notes=notes,
        agent_id=agent_id,
    )


def fail_task(task_id: str, reason: str, agent_id: str) -> Dict[str, Any]:
    task = task_repo.get_task(task_id)
    if not task:
        raise NotFoundError("Task not found")
    if task.get("agent_id") != agent_id:
        raise ForbiddenError("You are not assigned to this task")

    now_iso = datetime.now(timezone.utc).isoformat()
    task_repo.update_task(task_id, {
        "status": "failed",
        "fail_reason": reason,
        "completed_at": now_iso,
    })

    agent_user = user_repo.get_user(agent_id)
    if agent_user:
        prof = agent_user.get("agent_profile", {})
        prof["active_tasks"] = max(0, prof.get("active_tasks", 1) - 1)
        user_repo.update_user(agent_id, {"agent_profile": prof})

    code = task.get("order_code", "")
    ttype = task.get("type", "task")
    status_service.notify_admins(
        title="Task failed",
        body=f"{ttype.capitalize()} failed for order {code}. Reason: {reason}",
        order_id=task.get("order_id"),
    )

    return task_repo.get_task(task_id)
