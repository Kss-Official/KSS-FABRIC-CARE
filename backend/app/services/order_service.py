from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from google.cloud.firestore_v1.transaction import Transaction, transactional
from app.core.firebase import get_db
from app.core.config import settings
from app.core.errors import NotFoundError, ValidationError, ConflictError
from app.repositories import order_repo, catalog_repo, user_repo, counter_repo


def build_search_tokens(code: str, phone: str, name: str) -> List[str]:
    tokens = set()
    if code:
        tokens.add(code.lower())
    if phone:
        tokens.add(phone.lower())
    if name:
        for word in name.lower().split():
            if word:
                tokens.add(word)
    return list(tokens)


@transactional
def _create_order_tx(
    transaction: Transaction,
    customer_id: str,
    customer_name: str,
    customer_phone: str,
    address_data: Dict[str, Any],
    pickup_slot: Dict[str, Any],
    is_express: bool,
    notes: Optional[str],
    items_input: List[Dict[str, Any]],
) -> Dict[str, Any]:
    db = get_db()
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    expires_at = (now + timedelta(minutes=30)).isoformat()

    # Recalculate prices from prices collection
    all_prices = {f"{p['garment_id']}_{p['service_id']}": p['price_paise'] for p in catalog_repo.get_all_prices()}
    garments_map = {g['id']: g['name'] for g in catalog_repo.get_all_garments()}
    services_map = {s['id']: s['name'] for s in catalog_repo.get_all_services()}

    processed_items = []
    subtotal_paise = 0
    is_combo_order = False

    for item in items_input:
        g_id = item["garment_type_id"]
        qty = item["quantity"]
        s_ids = item["service_ids"]

        if g_id not in garments_map:
            raise ValidationError(f"Garment type {g_id} not found")

        g_name = garments_map[g_id]
        item_services = []
        unit_price = 0

        for sid in s_ids:
            if sid not in services_map:
                raise ValidationError(f"Service {sid} not found")
            price_key = f"{g_id}_{sid}"
            price_paise = all_prices.get(price_key, 0)
            item_services.append({
                "service_id": sid,
                "name": services_map[sid],
                "price_paise": price_paise,
            })
            unit_price += price_paise

        is_item_combo = len(s_ids) >= 2
        if is_item_combo:
            is_combo_order = True

        processed_items.append({
            "garment_id": g_id,
            "garment": g_name,
            "quantity": qty,
            "services": item_services,
            "unit_price_paise": unit_price,
            "combo_resolved": False if is_item_combo else True,
        })
        subtotal_paise += unit_price * qty

    express_charge = (subtotal_paise * settings.EXPRESS_SURCHARGE_PERCENT) // 100 if is_express else 0
    total_paise = subtotal_paise + express_charge

    # Next order code inside transaction
    order_code = counter_repo.get_next_order_code(transaction)

    order_ref = db.collection("orders").document()
    order_id = order_ref.id

    search_tokens = build_search_tokens(order_code, customer_phone, customer_name)

    order_data = {
        "id": order_id,
        "code": order_code,
        "customer_id": customer_id,
        "customer": {
            "name": customer_name,
            "phone": customer_phone,
        },
        "address": address_data,
        "pickup": pickup_slot,
        "status": "PAYMENT_PENDING",
        "payment_status": "pending",
        "is_express": is_express,
        "is_combo": is_combo_order,
        "notes": notes,
        "items": processed_items,
        "subtotal_paise": subtotal_paise,
        "express_charge_paise": express_charge,
        "total_paise": total_paise,
        "created_at": now_iso,
        "placed_at": None,
        "due_by": None,
        "received_at": None,
        "delivered_at": None,
        "cancelled_at": None,
        "cancel_reason": None,
        "assigned_staff_id": None,
        "assigned_staff_name": None,
        "payment_expires_at": expires_at,
        "search_tokens": search_tokens,
        "unresolved_combo": is_combo_order,
        "express_late_notified": False,
        "invoice_id": None,
        "last_status_at": now_iso,
    }

    transaction.set(order_ref, order_data)

    # Initial history record
    order_repo.add_order_history(
        order_id=order_id,
        history_data={
            "from_status": None,
            "to_status": "PAYMENT_PENDING",
            "changed_by": customer_id,
            "changed_by_name": customer_name,
            "note": "Order initiated by customer",
        },
        transaction=transaction,
    )

    return order_data


def create_customer_order(
    customer_id: str,
    address_id: str,
    pickup_slot: Dict[str, Any],
    is_express: bool,
    notes: Optional[str],
    items_input: List[Dict[str, Any]],
) -> Dict[str, Any]:
    user = user_repo.get_user(customer_id)
    if not user:
        raise NotFoundError("Customer user not found")

    address = user_repo.get_address(customer_id, address_id)
    if not address:
        raise NotFoundError("Address not found")

    db = get_db()
    tx = db.transaction()
    return _create_order_tx(
        transaction=tx,
        customer_id=customer_id,
        customer_name=user.get("name", "Customer"),
        customer_phone=user.get("phone", ""),
        address_data=address,
        pickup_slot=pickup_slot,
        is_express=is_express,
        notes=notes,
        items_input=items_input,
    )


def resolve_order_combo(order_id: str, note: Optional[str] = None) -> None:
    order = order_repo.get_order(order_id)
    if not order:
        raise NotFoundError("Order not found")

    items = order.get("items", [])
    for it in items:
        it["combo_resolved"] = True

    order_repo.update_order(order_id, {
        "items": items,
        "unresolved_combo": False,
    })
