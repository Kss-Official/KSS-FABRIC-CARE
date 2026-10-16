import sys
import random
from datetime import datetime, timezone, timedelta
from firebase_admin import auth as fb_auth
from app.core.config import settings
from app.core.firebase import get_db
from app.repositories import order_repo
from app.services.status_service import STEP_LABELS


SERVICES_LIST = [
    "Wash & Fold",
    "Wash + Iron",
    "Steam + Iron",
    "Dry Clean",
    "Wash",
    "Iron",
]

GARMENTS_LIST = [
    "Shirt",
    "T-Shirt",
    "Trousers",
    "Jeans",
    "Kurta",
    "Saree",
    "Suit (2-Piece)",
    "Bed Sheet",
]

# Base price per service (in paise)
SERVICE_BASE_PRICES = {
    "Wash & Fold": 5000,    # Rs. 50
    "Wash + Iron": 7000,    # Rs. 70
    "Steam + Iron": 6000,   # Rs. 60
    "Dry Clean": 15000,     # Rs. 150
    "Wash": 4000,           # Rs. 40
    "Iron": 3000,           # Rs. 30
}

GARMENT_MULTIPLIERS = {
    "Shirt": 1.0,
    "T-Shirt": 0.8,
    "Trousers": 1.2,
    "Jeans": 1.4,
    "Kurta": 1.3,
    "Saree": 2.0,
    "Suit (2-Piece)": 3.0,
    "Bed Sheet": 2.5,
}

SEED_USERS = [
    {
        "email": "customer@fabricare.test",
        "password": "Test@1234",
        "name": "Pratiksha Sharma",
        "phone": "+919876543210",
        "role": "customer",
    },
    {
        "email": "customer@fabricare.com",
        "password": "Test@1234",
        "name": "Pratiksha Sharma",
        "phone": "+919876543220",
        "role": "customer",
    },
    {
        "email": "agent@fabricare.test",
        "password": "Test@1234",
        "name": "Rajesh Kumar",
        "phone": "+919876543211",
        "role": "agent",
        "agent_profile": {
            "vehicle_type": "Honda Activa",
            "vehicle_number": "MH-02-CB-1234",
            "is_online": True,
            "last_lat": 19.0760,
            "last_lng": 72.8777,
            "last_seen_at": datetime.now(timezone.utc).isoformat(),
            "active_tasks": 2,
        },
    },
    {
        "email": "agent@fabricare.com",
        "password": "Test@1234",
        "name": "Rajesh Kumar",
        "phone": "+919876543221",
        "role": "agent",
        "agent_profile": {
            "vehicle_type": "Honda Activa",
            "vehicle_number": "MH-02-CB-1234",
            "is_online": True,
            "last_lat": 19.0760,
            "last_lng": 72.8777,
            "last_seen_at": datetime.now(timezone.utc).isoformat(),
            "active_tasks": 2,
        },
    },
    {
        "email": "ravi.kumar@fabricare.com",
        "password": "Test@1234",
        "name": "Ravi Kumar",
        "phone": "+919876543224",
        "role": "agent",
        "agent_profile": {
            "vehicle_type": "TVS Jupiter",
            "vehicle_number": "MH-02-DN-5678",
            "is_online": True,
            "last_lat": 19.0760,
            "last_lng": 72.8777,
            "last_seen_at": datetime.now(timezone.utc).isoformat(),
            "active_tasks": 1,
        },
    },
    {
        "email": "staff@fabricare.test",
        "password": "Test@1234",
        "name": "laundry_anita",
        "phone": "+919876543212",
        "role": "staff",
        "staff_profile": {
            "employee_code": "FC-STF-01",
            "shift": "Morning (8 AM - 4 PM)",
            "active_orders": 8,
        },
    },
    {
        "email": "staff@fabricare.com",
        "password": "Test@1234",
        "name": "laundry_anita",
        "phone": "+919876543222",
        "role": "staff",
        "staff_profile": {
            "employee_code": "FC-STF-01",
            "shift": "Morning (8 AM - 4 PM)",
            "active_orders": 8,
        },
    },
    {
        "email": "anita.sharma@fabricare.com",
        "password": "Test@1234",
        "name": "Anita Sharma",
        "phone": "+919876543225",
        "role": "staff",
        "staff_profile": {
            "employee_code": "FC-STF-02",
            "shift": "Morning (8 AM - 4 PM)",
            "active_orders": 4,
        },
    },
    {
        "email": "admin@fabricare.test",
        "password": "Test@1234",
        "name": "Super Admin",
        "phone": "+919876543213",
        "role": "admin",
    },
    {
        "email": "admin@fabricare.com",
        "password": "Test@1234",
        "name": "Super Admin",
        "phone": "+919876543223",
        "role": "admin",
    },
]


def seed_database(confirm: bool = False):
    if not settings.USE_EMULATOR and not confirm:
        print("ERROR: In production or without emulator, you must pass --confirm to seed.")
        sys.exit(1)

    print("--- Starting FabriCare Database Seeding ---")
    db = get_db()
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    now_date = now.strftime("%Y-%m-%d")

    # 1. Counters
    print("Initializing counters...")
    db.collection("counters").document("orders").set({"next": 10035}, merge=True)
    db.collection("counters").document(f"invoices_{now.year}").set({"next": 35}, merge=True)

    # 2. Users & Auth
    print("Creating/updating test users...")
    user_docs = {}
    for u in SEED_USERS:
        # Check if auth user exists
        try:
            user_record = fb_auth.get_user_by_email(u["email"])
            uid = user_record.uid
            fb_auth.update_user(uid, password=u["password"], display_name=u["name"])
        except fb_auth.UserNotFoundError:
            try:
                user_record = fb_auth.create_user(
                    email=u["email"],
                    password=u["password"],
                    display_name=u["name"],
                    phone_number=u["phone"],
                )
            except Exception:
                user_record = fb_auth.create_user(
                    email=u["email"],
                    password=u["password"],
                    display_name=u["name"],
                )
            uid = user_record.uid

        fb_auth.set_custom_user_claims(uid, {"role": u["role"]})

        user_data = {
            "id": uid,
            "name": u["name"],
            "name_lower": u["name"].lower(),
            "email": u["email"].lower(),
            "phone": u["phone"],
            "role": u["role"],
            "avatar_url": None,
            "is_active": True,
            "last_login_at": now_iso,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        if "agent_profile" in u:
            user_data["agent_profile"] = u["agent_profile"]
        if "staff_profile" in u:
            user_data["staff_profile"] = u["staff_profile"]

        db.collection("users").document(uid).set(user_data, merge=True)
        db.collection("phone_index").document(u["phone"]).set({"uid": uid, "created_at": now_iso}, merge=True)
        user_docs[u["role"]] = {"id": uid, **user_data}

    # Add default address for customer
    customer_uid = user_docs["customer"]["id"]
    cust_addr_ref = db.collection("users").document(customer_uid).collection("addresses").document("default_home")
    cust_address = {
        "id": "default_home",
        "label": "Home",
        "line1": "Flat 402, Sunshine Heights, Powai",
        "city": "Mumbai",
        "pincode": "400076",
        "lat": 19.1176,
        "lng": 72.9060,
        "is_default": True,
    }
    cust_addr_ref.set(cust_address)

    # 3. Garments
    print("Seeding garment types...")
    garment_map = {}
    for g_name in GARMENTS_LIST:
        doc_id = g_name.lower().replace(" ", "_").replace("(", "").replace(")", "").replace("-", "_")
        ref = db.collection("garment_types").document(doc_id)
        ref.set({"name": g_name, "is_active": True}, merge=True)
        garment_map[g_name] = doc_id

    # 4. Services
    print("Seeding services...")
    service_map = {}
    for s_name in SERVICES_LIST:
        doc_id = s_name.lower().replace(" ", "_").replace("+", "plus").replace("&", "and")
        ref = db.collection("services").document(doc_id)
        ref.set({"name": s_name, "is_active": True}, merge=True)
        service_map[s_name] = doc_id

    # 5. Prices
    print("Seeding pricing matrix...")
    batch = db.batch()
    batch_count = 0
    all_prices = []
    for g_name, g_id in garment_map.items():
        multiplier = GARMENT_MULTIPLIERS.get(g_name, 1.0)
        for s_name, s_id in service_map.items():
            base = SERVICE_BASE_PRICES.get(s_name, 5000)
            price_paise = int(base * multiplier)
            price_id = f"{g_id}_{s_id}"
            ref = db.collection("prices").document(price_id)
            p_data = {
                "garment_id": g_id,
                "service_id": s_id,
                "price_paise": price_paise,
            }
            batch.set(ref, p_data, merge=True)
            all_prices.append(p_data)
            batch_count += 1
            if batch_count == 400:
                batch.commit()
                batch = db.batch()
                batch_count = 0
    if batch_count > 0:
        batch.commit()

    # 6. Sample Orders (30 orders covering PLACED through DELIVERED + 2 CANCELLED)
    print("Seeding 32 sample orders with history, invoices, and tasks...")
    statuses = [
        "PLACED", "PICKUP_SCHEDULED", "PICKED_UP",
        "RECEIVED", "INSPECTION", "WASHING", "DRYING",
        "IRONING", "FOLDING", "QUALITY_CHECK", "PACKING",
        "READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "DELIVERED",
        "CANCELLED"
    ]

    service_keys = list(service_map.keys())
    garment_keys = list(garment_map.keys())

    # Pre-calculated daily stats
    daily_stats_agg = {
        now_date: {"orders_placed": 0, "express_count": 0, "revenue_paise": 0, "service_counts": {}}
    }
    for d_offset in range(1, 8):
        past_d = (now - timedelta(days=d_offset)).strftime("%Y-%m-%d")
        daily_stats_agg[past_d] = {"orders_placed": 0, "express_count": 0, "revenue_paise": 0, "service_counts": {}}

    for i in range(1, 33):
        order_code = f"FC-{10000 + i}"
        inv_no = f"INV-{now.year}-{i:06d}"
        created_time = now - timedelta(days=random.randint(0, 6), hours=random.randint(1, 20))
        created_iso = created_time.isoformat()
        date_str = created_time.strftime("%Y-%m-%d")

        # Pick status
        if i == 31 or i == 32:
            st = "CANCELLED"
            payment_st = "refunded" if i == 31 else "failed"
        elif i <= 2:
            st = "PLACED"
            payment_st = "paid"
        elif i <= 4:
            st = "PICKUP_SCHEDULED"
            payment_st = "paid"
        elif i <= 6:
            st = "PICKED_UP"
            payment_st = "paid"
        elif i <= 9:
            st = "RECEIVED"
            payment_st = "paid"
        elif i <= 12:
            st = "WASHING"
            payment_st = "paid"
        elif i <= 15:
            st = "IRONING"
            payment_st = "paid"
        elif i <= 18:
            st = "PACKING"
            payment_st = "paid"
        elif i <= 21:
            st = "READY_FOR_DELIVERY"
            payment_st = "paid"
        elif i <= 24:
            st = "OUT_FOR_DELIVERY"
            payment_st = "paid"
        else:
            st = "DELIVERED"
            payment_st = "paid"

        is_express = (i % 3 == 0)
        # Combo items: make orders 7, 8, 9, 10, 11 combo orders!
        is_combo = (i in [7, 8, 9, 10, 11] or i % 5 == 0)
        unresolved_combo = is_combo and (st in ["RECEIVED", "INSPECTION", "WASHING"]) and (i in [7, 8])

        # Generate 1-3 items
        order_items = []
        subtotal = 0
        g_sample = random.sample(garment_keys, k=random.randint(1, 2))
        for g_idx, g_name in enumerate(g_sample):
            g_id = garment_map[g_name]
            qty = random.randint(1, 3)
            if is_combo and g_idx == 0:
                s_selected = ["Wash & Fold", "Iron"]
            else:
                s_selected = [random.choice(service_keys)]

            item_services = []
            unit_price = 0
            for s_name in s_selected:
                s_id = service_map[s_name]
                multiplier = GARMENT_MULTIPLIERS.get(g_name, 1.0)
                price = int(SERVICE_BASE_PRICES.get(s_name, 5000) * multiplier)
                item_services.append({"service_id": s_id, "name": s_name, "price_paise": price})
                unit_price += price

            order_items.append({
                "garment_id": g_id,
                "garment": g_name,
                "quantity": qty,
                "services": item_services,
                "unit_price_paise": unit_price,
                "combo_resolved": not unresolved_combo,
            })
            subtotal += unit_price * qty

        express_charge = (subtotal * settings.EXPRESS_SURCHARGE_PERCENT) // 100 if is_express else 0
        total_paise = subtotal + express_charge

        due_by_time = created_time + timedelta(hours=settings.EXPRESS_HOURS if is_express else settings.STANDARD_HOURS)
        due_by_iso = due_by_time.isoformat()

        # Assigned staff
        assigned_staff_id = user_docs["staff"]["id"] if st in statuses[3:] else None
        assigned_staff_name = "laundry_anita" if assigned_staff_id else None

        order_ref = db.collection("orders").document(f"order_{i}")
        order_doc_data = {
            "id": f"order_{i}",
            "code": order_code,
            "customer_id": customer_uid,
            "customer": {"name": "Pratiksha Sharma", "phone": "+919876543210"},
            "address": cust_address,
            "pickup": {"date": created_time.strftime("%Y-%m-%d"), "from": "10:00 AM", "to": "12:00 PM"},
            "status": st,
            "payment_status": payment_st,
            "is_express": is_express,
            "is_combo": is_combo,
            "notes": "Please handle delicate garments with care." if i % 4 == 0 else None,
            "items": order_items,
            "subtotal_paise": subtotal,
            "express_charge_paise": express_charge,
            "total_paise": total_paise,
            "created_at": created_iso,
            "placed_at": created_iso if payment_st == "paid" else None,
            "due_by": due_by_iso,
            "received_at": (created_time + timedelta(hours=3)).isoformat() if st in statuses[3:] else None,
            "delivered_at": (created_time + timedelta(hours=20)).isoformat() if st == "DELIVERED" else None,
            "cancelled_at": (created_time + timedelta(hours=2)).isoformat() if st == "CANCELLED" else None,
            "cancel_reason": "Customer requested cancellation" if st == "CANCELLED" else None,
            "assigned_staff_id": assigned_staff_id,
            "assigned_staff_name": assigned_staff_name,
            "payment_expires_at": (created_time + timedelta(minutes=30)).isoformat(),
            "search_tokens": [order_code.lower(), "+919876543210", "pratiksha", "sharma"],
            "unresolved_combo": unresolved_combo,
            "express_late_notified": False,
            "invoice_id": f"inv_{i}" if payment_st == "paid" else None,
            "last_status_at": now_iso,
        }
        order_ref.set(order_doc_data)

        # History
        hist_ref = order_ref.collection("history").document("h1")
        hist_ref.set({
            "from_status": None,
            "to_status": "PAYMENT_PENDING",
            "changed_by": customer_uid,
            "changed_by_name": "Pratiksha Sharma",
            "note": "Order created",
            "created_at": created_iso,
        })
        if payment_st == "paid":
            order_ref.collection("history").document("h2").set({
                "from_status": "PAYMENT_PENDING",
                "to_status": "PLACED",
                "changed_by": None,
                "changed_by_name": "System",
                "note": "Online payment successful",
                "created_at": created_iso,
            })
            if st != "PLACED":
                order_ref.collection("history").document("h3").set({
                    "from_status": "PLACED",
                    "to_status": st,
                    "changed_by": user_docs["staff"]["id"],
                    "changed_by_name": "laundry_anita",
                    "note": f"Order moved to {st}",
                    "created_at": now_iso,
                })

        # Invoices
        if payment_st == "paid":
            inv_ref = db.collection("invoices").document(f"inv_{i}")
            inv_ref.set({
                "id": f"inv_{i}",
                "invoice_no": inv_no,
                "order_id": f"order_{i}",
                "order_code": order_code,
                "customer_id": customer_uid,
                "amount_paise": total_paise,
                "status": "paid",
                "issued_at": created_iso,
                "pdf_url": None,
                "line_items": order_items,
            })

            # Payments
            pay_ref = db.collection("payments").document(f"pay_{i}")
            pay_ref.set({
                "id": f"pay_{i}",
                "order_id": f"order_{i}",
                "order_code": order_code,
                "user_id": customer_uid,
                "amount_paise": total_paise,
                "method": "upi" if i % 2 == 0 else "card",
                "status": "paid",
                "gateway_order_id": f"gw_order_{i}",
                "gateway_payment_id": f"gw_pay_{i}",
                "gateway_signature": "mock_sig",
                "failure_reason": None,
                "created_at": created_iso,
            })

            # Stats aggregation
            if date_str in daily_stats_agg:
                agg = daily_stats_agg[date_str]
                agg["orders_placed"] += 1
                if is_express:
                    agg["express_count"] += 1
                agg["revenue_paise"] += total_paise
                for it in order_items:
                    for s in it["services"]:
                        s_name = s["name"]
                        agg["service_counts"][s_name] = agg["service_counts"].get(s_name, 0) + 1

        # Tasks
        agent_uid = user_docs["agent"]["id"]
        if st in ["PLACED", "PICKUP_SCHEDULED", "PICKED_UP"]:
            task_status = "unassigned" if st == "PLACED" else ("assigned" if st == "PICKUP_SCHEDULED" else "completed")
            db.collection("tasks").document(f"task_pickup_{i}").set({
                "id": f"task_pickup_{i}",
                "order_id": f"order_{i}",
                "order_code": order_code,
                "type": "pickup",
                "status": task_status,
                "agent_id": agent_uid if task_status != "unassigned" else None,
                "agent_name": "Rajesh Kumar" if task_status != "unassigned" else None,
                "customer": {"name": "Pratiksha Sharma", "phone": "+919876543210"},
                "address": cust_address,
                "items_count": sum(it["quantity"] for it in order_items),
                "scheduled_at": created_iso,
                "otp_hash": None,
                "otp_expires_at": None,
                "otp_attempts": 0,
                "started_at": created_iso if task_status == "completed" else None,
                "completed_at": created_iso if task_status == "completed" else None,
                "fail_reason": None,
            })
        elif st in ["READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "DELIVERED"]:
            task_status = "assigned" if st == "READY_FOR_DELIVERY" else ("on_the_way" if st == "OUT_FOR_DELIVERY" else "completed")
            db.collection("tasks").document(f"task_deliv_{i}").set({
                "id": f"task_deliv_{i}",
                "order_id": f"order_{i}",
                "order_code": order_code,
                "type": "delivery",
                "status": task_status,
                "agent_id": agent_uid,
                "agent_name": "Rajesh Kumar",
                "customer": {"name": "Pratiksha Sharma", "phone": "+919876543210"},
                "address": cust_address,
                "items_count": sum(it["quantity"] for it in order_items),
                "scheduled_at": now_iso,
                "otp_hash": None,
                "otp_expires_at": None,
                "otp_attempts": 0,
                "started_at": now_iso if task_status in ["on_the_way", "completed"] else None,
                "completed_at": now_iso if task_status == "completed" else None,
                "fail_reason": None,
            })

    # Save daily stats
    print("Writing aggregated daily stats documents...")
    for d_str, sdata in daily_stats_agg.items():
        db.collection("stats").document(f"daily_{d_str}").set({
            "orders_placed": max(sdata["orders_placed"], 3),
            "express_count": max(sdata["express_count"], 1),
            "revenue_paise": max(sdata["revenue_paise"], 45000),
            "service_counts": sdata["service_counts"] if sdata["service_counts"] else {"Wash & Fold": 10, "Dry Clean": 5},
            "date": d_str,
        }, merge=True)

    # 7. Seed Notifications (6 per user)
    print("Seeding notifications...")
    for role, u_dict in user_docs.items():
        uid = u_dict["id"]
        for j in range(1, 7):
            ref = db.collection("notifications").document(f"notif_{role}_{j}")
            ref.set({
                "id": f"notif_{role}_{j}",
                "user_id": uid,
                "type": "order_update",
                "title": f"Welcome to FabriCare #{j}",
                "body": f"Notification message {j} for {u_dict['name']}.",
                "order_id": "order_1",
                "is_read": (j % 2 == 0),
                "created_at": (now - timedelta(hours=j * 3)).isoformat(),
            })

    # 8. Seed Support Tickets (3 tickets)
    print("Seeding support tickets...")
    for t_idx in range(1, 4):
        t_id = f"ticket_{t_idx}"
        t_ref = db.collection("support_tickets").document(t_id)
        t_ref.set({
            "id": t_id,
            "customer_id": customer_uid,
            "customer_name": "Pratiksha Sharma",
            "order_id": f"order_{t_idx}",
            "subject": f"Query regarding order FC-{10000 + t_idx}",
            "status": "open" if t_idx != 3 else "closed",
            "created_at": (now - timedelta(days=t_idx)).isoformat(),
            "last_message_at": (now - timedelta(hours=t_idx * 2)).isoformat(),
        })
        t_ref.collection("messages").document("m1").set({
            "sender_id": customer_uid,
            "sender_role": "customer",
            "text": f"Hello, I wanted to inquire about the delivery status of order FC-{10000 + t_idx}.",
            "created_at": (now - timedelta(days=t_idx)).isoformat(),
        })
        t_ref.collection("messages").document("m2").set({
            "sender_id": user_docs["admin"]["id"],
            "sender_role": "admin",
            "text": "Hello Pratiksha! Your order is being processed by our staff and will be delivered on schedule.",
            "created_at": (now - timedelta(hours=t_idx * 2)).isoformat(),
        })

    print("--- FabriCare Database Seeding Complete! ---")


if __name__ == "__main__":
    confirm_flag = "--confirm" in sys.argv
    seed_database(confirm=confirm_flag)
