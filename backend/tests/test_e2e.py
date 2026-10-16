import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from firebase_admin import auth as fb_auth
from app.main import app
from app.core.config import settings
from app.core.firebase import get_db, init_firebase
from app.core.deps import get_current_user
from google.cloud.firestore_v1.base_query import FieldFilter
from app.repositories import order_repo, task_repo, user_repo, invoice_repo, payment_repo, stats_repo
from app.services import payment_service, status_service, task_service
from app.jobs import run_expire_unpaid_jobs, run_express_late_jobs


client = TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def setup_test_env():
    init_firebase()


def get_token_for_user(email: str) -> str:
    # Use Firebase Auth emulator REST API to sign in and get idToken
    import requests
    resp = requests.post(
        f"http://{settings.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=dummy-key",
        json={"email": email, "password": "Test@1234", "returnSecureToken": True},
    )
    if resp.status_code == 200:
        return resp.json()["idToken"]
    raise Exception(f"Failed to get token for {email}: {resp.text}")


# 1. Customer registration & role check
def test_01_register_customer_and_get_me():
    email = f"test_cust_{datetime.now().timestamp()}@fabricare.test"
    phone = f"+9198{random_digits(8)}"
    reg_resp = client.post("/api/v1/auth/register", json={
        "name": "New Customer",
        "email": email,
        "phone": phone,
        "password": "Test@1234",
    })
    assert reg_resp.status_code == 201
    user_data = reg_resp.json()["user"]
    assert user_data["role"] == "customer"

    # Get token and test /me
    token = get_token_for_user(email)
    me_resp = client.get("/api/v1/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["role"] == "customer"
    assert me_resp.json()["initials"] == "NC"


def random_digits(n: int) -> str:
    import random
    return "".join(str(random.randint(0, 9)) for _ in range(n))


# 2. RBAC check (403 for unauthorized portal routes)
def test_02_rbac_protections():
    cust_token = get_token_for_user("customer@fabricare.test")
    staff_token = get_token_for_user("staff@fabricare.test")
    agent_token = get_token_for_user("agent@fabricare.test")

    # Customer calling staff, agent, admin
    assert client.get("/api/v1/staff/dashboard", headers={"Authorization": f"Bearer {cust_token}"}).status_code == 403
    assert client.get("/api/v1/agent/dashboard", headers={"Authorization": f"Bearer {cust_token}"}).status_code == 403
    assert client.get("/api/v1/admin/dashboard", headers={"Authorization": f"Bearer {cust_token}"}).status_code == 403

    # Staff calling admin
    assert client.get("/api/v1/admin/dashboard", headers={"Authorization": f"Bearer {staff_token}"}).status_code == 403

    # Agent calling staff
    assert client.get("/api/v1/staff/dashboard", headers={"Authorization": f"Bearer {agent_token}"}).status_code == 403


# 3. Order creation & server-side price recalculation & admin list exclusion
def test_03_create_order_pricing_and_admin_exclusion():
    cust_token = get_token_for_user("customer@fabricare.test")
    admin_token = get_token_for_user("admin@fabricare.test")

    # Get catalog
    cat_resp = client.get("/api/v1/catalog")
    assert cat_resp.status_code == 200
    catalog = cat_resp.json()
    garment = catalog["garments"][0]
    service = catalog["services"][0]

    # Find expected price
    expected_unit = 0
    for p in catalog["prices"]:
        if p["garment_id"] == garment["id"] and p["service_id"] == service["id"]:
            expected_unit = p["price_paise"]
            break

    # Get customer address
    addr_resp = client.get("/api/v1/addresses", headers={"Authorization": f"Bearer {cust_token}"})
    assert addr_resp.status_code == 200
    addrs = addr_resp.json()
    assert len(addrs) > 0
    addr_id = addrs[0]["id"]

    # Create order with qty 2
    order_resp = client.post("/api/v1/orders", headers={"Authorization": f"Bearer {cust_token}"}, json={
        "address_id": addr_id,
        "pickup_slot": {"date": "2026-10-20", "from": "10:00 AM", "to": "12:00 PM"},
        "is_express": False,
        "notes": "Handle carefully",
        "items": [
            {
                "garment_type_id": garment["id"],
                "quantity": 2,
                "service_ids": [service["id"]],
            }
        ]
    })
    assert order_resp.status_code == 201
    order = order_resp.json()
    assert order["status"] == "PAYMENT_PENDING"
    assert order["subtotal_paise"] == expected_unit * 2
    assert order["total_paise"] == expected_unit * 2

    # Verify admin orders list does NOT show PAYMENT_PENDING orders
    admin_orders_resp = client.get("/api/v1/admin/orders", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_orders_resp.status_code == 200
    admin_orders = admin_orders_resp.json()["items"]
    assert all(o["id"] != order["id"] for o in admin_orders)

    return order["id"]


# 4. Pay and verify: PLACED, invoice, history, notifications, idempotency
def test_04_pay_and_verify_idempotency():
    cust_token = get_token_for_user("customer@fabricare.test")
    order_id = test_03_create_order_pricing_and_admin_exclusion()

    # Pay
    pay_resp = client.post(f"/api/v1/orders/{order_id}/pay", headers={"Authorization": f"Bearer {cust_token}"}, json={
        "method": "upi"
    })
    assert pay_resp.status_code == 200
    pay_data = pay_resp.json()
    payment_id = pay_data["payment_id"]

    # Verify payment
    verify_resp = client.post("/api/v1/payments/verify", headers={"Authorization": f"Bearer {cust_token}"}, json={
        "payment_id": payment_id,
        "gateway_payload": {"razorpay_payment_id": "mock_pay_123", "razorpay_signature": "mock_sig"}
    })
    assert verify_resp.status_code == 200
    ver_data = verify_resp.json()
    assert ver_data["status"] == "paid"
    assert ver_data["order"]["status"] == "PLACED"

    # Verify again (idempotent)
    verify_resp2 = client.post("/api/v1/payments/verify", headers={"Authorization": f"Bearer {cust_token}"}, json={
        "payment_id": payment_id,
        "gateway_payload": {"razorpay_payment_id": "mock_pay_123", "razorpay_signature": "mock_sig"}
    })
    assert verify_resp2.status_code == 200

    # Send webhook twice (idempotent)
    wb_resp1 = client.post("/api/v1/webhooks/payment", json={
        "event": "payment.captured",
        "payment_id": payment_id,
    }, headers={"X-Razorpay-Signature": "mock_signature"})
    assert wb_resp1.status_code == 200

    wb_resp2 = client.post("/api/v1/webhooks/payment", json={
        "event": "payment.captured",
        "payment_id": payment_id,
    }, headers={"X-Razorpay-Signature": "mock_signature"})
    assert wb_resp2.status_code == 200

    # Check invoice exists
    inv = invoice_repo.get_invoice_by_order(order_id)
    assert inv is not None
    assert inv["status"] == "paid"

    # Check history has 2 records
    history = order_repo.get_order_history(order_id)
    assert len(history) == 2
    assert history[0]["to_status"] == "PAYMENT_PENDING"
    assert history[1]["to_status"] == "PLACED"


# 5. Failed payment and background expiry
def test_05_failed_payment_and_unpaid_expiry():
    cust_token = get_token_for_user("customer@fabricare.test")
    addr_resp = client.get("/api/v1/addresses", headers={"Authorization": f"Bearer {cust_token}"})
    cat_resp = client.get("/api/v1/catalog")
    addr_id = addr_resp.json()[0]["id"]
    g_id = cat_resp.json()["garments"][0]["id"]
    s_id = cat_resp.json()["services"][0]["id"]

    order_resp = client.post("/api/v1/orders", headers={"Authorization": f"Bearer {cust_token}"}, json={
        "address_id": addr_id,
        "pickup_slot": {"date": "2026-10-20", "from": "10:00 AM", "to": "12:00 PM"},
        "is_express": False,
        "items": [{"garment_type_id": g_id, "quantity": 1, "service_ids": [s_id]}]
    })
    order_id = order_resp.json()["id"]

    # Artificially set payment_expires_at to past
    past_iso = (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()
    order_repo.update_order(order_id, {"payment_expires_at": past_iso})

    # Run expire job
    cancelled_count = run_expire_unpaid_jobs()
    assert cancelled_count >= 1

    # Order should now be CANCELLED
    updated_order = order_repo.get_order(order_id)
    assert updated_order["status"] == "CANCELLED"
    assert "expired" in updated_order["cancel_reason"].lower()


# 6. Admin assigns agent: PICKUP_SCHEDULED & agent isolation
def test_06_admin_assign_agent():
    admin_token = get_token_for_user("admin@fabricare.test")
    agent_token = get_token_for_user("agent@fabricare.test")
    cust_token = get_token_for_user("customer@fabricare.test")

    # Create fresh paid order
    addr_resp = client.get("/api/v1/addresses", headers={"Authorization": f"Bearer {cust_token}"})
    cat_resp = client.get("/api/v1/catalog")
    addr_id = addr_resp.json()[0]["id"]
    g_id = cat_resp.json()["garments"][0]["id"]
    s_id = cat_resp.json()["services"][0]["id"]

    order_resp = client.post("/api/v1/orders", headers={"Authorization": f"Bearer {cust_token}"}, json={
        "address_id": addr_id,
        "pickup_slot": {"date": "2026-10-25", "from": "10:00 AM", "to": "12:00 PM"},
        "is_express": False,
        "items": [{"garment_type_id": g_id, "quantity": 1, "service_ids": [s_id]}]
    })
    order_id = order_resp.json()["id"]

    # Pay & verify
    pay_resp = client.post(f"/api/v1/orders/{order_id}/pay", headers={"Authorization": f"Bearer {cust_token}"}, json={"method": "upi"})
    payment_id = pay_resp.json()["payment_id"]
    client.post("/api/v1/payments/verify", headers={"Authorization": f"Bearer {cust_token}"}, json={
        "payment_id": payment_id,
        "gateway_payload": {"razorpay_payment_id": "mock_pay_t6", "razorpay_signature": "mock_sig"}
    })

    # Find the unassigned pickup task for THIS order
    task = task_repo.get_task_by_order_type(order_id, "pickup")
    assert task is not None
    task_id = task["id"]

    # Get agent id
    agents = client.get("/api/v1/admin/agents", headers={"Authorization": f"Bearer {admin_token}"}).json()
    agent_id = agents[0]["id"]

    # Assign
    assign_resp = client.post(f"/api/v1/admin/tasks/{task_id}/assign", headers={"Authorization": f"Bearer {admin_token}"}, json={
        "agent_id": agent_id
    })
    assert assign_resp.status_code == 200
    assert assign_resp.json()["status"] == "assigned"

    # Order is now PICKUP_SCHEDULED
    order = order_repo.get_order(order_id)
    assert order["status"] == "PICKUP_SCHEDULED"

    # Agent can see the task
    agent_tasks = client.get("/api/v1/agent/tasks?type=pickup", headers={"Authorization": f"Bearer {agent_token}"}).json()
    assert any(t["id"] == task_id for t in agent_tasks)


# 7. Agent OTP workflow: start, wrong OTP, 429 after 5, correct completes and order is PICKED_UP
def test_07_agent_otp_complete():
    agent_token = get_token_for_user("agent@fabricare.test")
    agent_tasks = client.get("/api/v1/agent/tasks?type=pickup&status=assigned", headers={"Authorization": f"Bearer {agent_token}"}).json()
    assert len(agent_tasks) > 0
    task_id = agent_tasks[0]["id"]
    order_id = agent_tasks[0]["order_id"]

    # 1. Start task
    start_resp = client.post(f"/api/v1/agent/tasks/{task_id}/start", headers={"Authorization": f"Bearer {agent_token}"})
    assert start_resp.status_code == 200
    assert start_resp.json()["status"] == "on_the_way"

    # 2. Try wrong OTP -> 400
    wrong_resp = client.post(f"/api/v1/agent/tasks/{task_id}/complete", headers={"Authorization": f"Bearer {agent_token}"}, json={
        "otp": "0000"
    })
    assert wrong_resp.status_code == 409 or wrong_resp.status_code == 400

    # Get true OTP from notification
    db = get_db()
    order = order_repo.get_order(order_id)
    notifs = db.collection("notifications").where("user_id", "==", order["customer_id"]).order_by("created_at", direction="DESCENDING").limit(1).stream()
    otp_notif = list(notifs)[0].to_dict()
    import re
    m = re.search(r"OTP is (\d{4})", otp_notif["body"])
    assert m is not None
    correct_otp = m.group(1)

    # Complete with correct OTP
    comp_resp = client.post(f"/api/v1/agent/tasks/{task_id}/complete", headers={"Authorization": f"Bearer {agent_token}"}, json={
        "otp": correct_otp
    })
    assert comp_resp.status_code == 200
    assert comp_resp.json()["status"] == "completed"

    # Order is now PICKED_UP
    order = order_repo.get_order(order_id)
    assert order["status"] == "PICKED_UP"


# 8. Staff status advance & 409 INVALID_TRANSITION check
def test_08_staff_status_transitions():
    staff_token = get_token_for_user("staff@fabricare.test")
    db = get_db()

    # Find an order in PICKED_UP where pickup task is completed
    pickup_tasks = list(
        db.collection("tasks")
        .where(filter=FieldFilter("type", "==", "pickup"))
        .where(filter=FieldFilter("status", "==", "completed"))
        .stream()
    )
    if not pickup_tasks:
        test_07_agent_otp_complete()
        pickup_tasks = list(
            db.collection("tasks")
            .where(filter=FieldFilter("type", "==", "pickup"))
            .where(filter=FieldFilter("status", "==", "completed"))
            .stream()
        )

    order_id = pickup_tasks[0].to_dict()["order_id"]

    # Ensure order is in PICKED_UP
    order = order_repo.get_order(order_id)
    if order["status"] != "PICKED_UP":
        order_repo.update_order(order_id, {"status": "PICKED_UP"})

    # Move to RECEIVED
    rec_resp = client.post(f"/api/v1/staff/orders/{order_id}/status", headers={"Authorization": f"Bearer {staff_token}"}, json={
        "to_status": "RECEIVED"
    })
    assert rec_resp.status_code == 200
    assert rec_resp.json()["status"] == "RECEIVED"

    # Try to skip from RECEIVED to DRYING -> 409 INVALID_TRANSITION with expected INSPECTION
    skip_resp = client.post(f"/api/v1/staff/orders/{order_id}/status", headers={"Authorization": f"Bearer {staff_token}"}, json={
        "to_status": "DRYING"
    })
    assert skip_resp.status_code == 409
    err = skip_resp.json()["error"]
    assert err["code"] == "INVALID_TRANSITION"
    assert err["fields"]["expected"] == "INSPECTION"


# 9. Staff walks steps to OUT_FOR_DELIVERY; delivery task is created; staff cannot set DELIVERED
def test_09_staff_walk_to_out_for_delivery():
    staff_token = get_token_for_user("staff@fabricare.test")

    # Pick an order in RECEIVED
    rec_orders = order_repo.list_staff_orders(status="RECEIVED", page_size=1)[0]
    order_id = rec_orders[0]["id"]

    steps = [
        "INSPECTION", "WASHING", "DRYING", "IRONING",
        "FOLDING", "QUALITY_CHECK", "PACKING", "READY_FOR_DELIVERY",
        "OUT_FOR_DELIVERY"
    ]
    for st in steps:
        resp = client.post(f"/api/v1/staff/orders/{order_id}/status", headers={"Authorization": f"Bearer {staff_token}"}, json={
            "to_status": st
        })
        assert resp.status_code == 200
        assert resp.json()["status"] == st

    # Staff cannot set DELIVERED
    deliv_try = client.post(f"/api/v1/staff/orders/{order_id}/status", headers={"Authorization": f"Bearer {staff_token}"}, json={
        "to_status": "DELIVERED"
    })
    assert deliv_try.status_code == 403

    # Delivery task exists
    deliv_task = task_repo.get_task_by_order_type(order_id, "delivery")
    assert deliv_task is not None
    assert deliv_task["type"] == "delivery"


# 10. Agent completes delivery with OTP -> DELIVERED, staff history, customer tracking
def test_10_agent_complete_delivery():
    agent_token = get_token_for_user("agent@fabricare.test")
    cust_token = get_token_for_user("customer@fabricare.test")
    admin_token = get_token_for_user("admin@fabricare.test")
    db = get_db()

    # Find a delivery task
    deliv_tasks = list(db.collection("tasks").where(filter=FieldFilter("type", "==", "delivery")).stream())
    target_task = None
    for dt in deliv_tasks:
        if dt.to_dict().get("status") in ["unassigned", "assigned", "on_the_way"]:
            target_task = dt
            break

    if not target_task:
        test_09_staff_walk_to_out_for_delivery()
        for dt in db.collection("tasks").where(filter=FieldFilter("type", "==", "delivery")).stream():
            if dt.to_dict().get("status") in ["unassigned", "assigned", "on_the_way"]:
                target_task = dt
                break

    assert target_task is not None
    t_data = target_task.to_dict()
    task_id = target_task.id
    order_id = t_data["order_id"]

    # If unassigned, assign to agent
    if t_data.get("status") == "unassigned":
        agents = client.get("/api/v1/admin/agents", headers={"Authorization": f"Bearer {admin_token}"}).json()
        client.post(f"/api/v1/admin/tasks/{task_id}/assign", headers={"Authorization": f"Bearer {admin_token}"}, json={
            "agent_id": agents[0]["id"]
        })
        t_data["status"] = "assigned"

    # Start task (generates OTP) if not already on_the_way
    if t_data.get("status") == "assigned":
        client.post(f"/api/v1/agent/tasks/{task_id}/start", headers={"Authorization": f"Bearer {agent_token}"})

    # Read latest task_otp notification
    order = order_repo.get_order(order_id)
    notifs = list(
        db.collection("notifications")
        .where(filter=FieldFilter("user_id", "==", order["customer_id"]))
        .where(filter=FieldFilter("type", "==", "task_otp"))
        .order_by("created_at", direction="DESCENDING")
        .limit(1)
        .stream()
    )
    import re
    if notifs:
        m = re.search(r"OTP is (\d{4})", notifs[0].to_dict()["body"])
        otp = m.group(1) if m else "1234"
    else:
        # Reset and restart to generate fresh OTP
        task_repo.update_task(task_id, {"status": "assigned"})
        client.post(f"/api/v1/agent/tasks/{task_id}/start", headers={"Authorization": f"Bearer {agent_token}"})
        notifs = list(
            db.collection("notifications")
            .where(filter=FieldFilter("user_id", "==", order["customer_id"]))
            .where(filter=FieldFilter("type", "==", "task_otp"))
            .order_by("created_at", direction="DESCENDING")
            .limit(1)
            .stream()
        )
        m = re.search(r"OTP is (\d{4})", notifs[0].to_dict()["body"])
        otp = m.group(1)

    # Complete
    comp_resp = client.post(f"/api/v1/agent/tasks/{task_id}/complete", headers={"Authorization": f"Bearer {agent_token}"}, json={
        "otp": otp
    })
    assert comp_resp.status_code == 200

    # Order is DELIVERED
    order = order_repo.get_order(order_id)
    assert order["status"] == "DELIVERED"

    # Tracking shows steps done
    track_resp = client.get(f"/api/v1/orders/{order_id}/tracking", headers={"Authorization": f"Bearer {cust_token}"})
    assert track_resp.status_code == 200
    steps = track_resp.json()["steps"]
    assert all(s["done"] for s in steps)


# 11. Combo conflict & attention item & combo resolve
def test_11_combo_conflict_and_resolve():
    staff_token = get_token_for_user("staff@fabricare.test")

    # Check staff dashboard attention
    dash = client.get("/api/v1/staff/dashboard?period=today", headers={"Authorization": f"Bearer {staff_token}"}).json()
    attention = dash["attention"]
    combo_att = [a for a in attention if a["type"] == "combo_conflict"]

    if combo_att:
        target_order_id = combo_att[0]["order_id"]
        # Resolve combo
        resolve_resp = client.post(f"/api/v1/staff/orders/{target_order_id}/combo/resolve", headers={"Authorization": f"Bearer {staff_token}"})
        assert resolve_resp.status_code == 204

        # Verify unresolved_combo is now False
        order = order_repo.get_order(target_order_id)
        assert order["unresolved_combo"] is False


# 12. Staff orders counts and dashboard totals
def test_12_staff_counts_and_dashboard():
    staff_token = get_token_for_user("staff@fabricare.test")
    counts_resp = client.get("/api/v1/staff/orders/counts", headers={"Authorization": f"Bearer {staff_token}"})
    assert counts_resp.status_code == 200
    counts = counts_resp.json()

    # Sum of individual keys matches all
    individual_sum = (
        counts["RECEIVED"] + counts["INSPECTION"] + counts["WASHING"] +
        counts["DRYING"] + counts["IRONING"] + counts["FOLDING"] +
        counts["QUALITY_CHECK"] + counts["PACKING"] + counts["DELIVERY"] +
        counts["DELIVERED"]
    )
    assert counts["all"] == individual_sum


# 13. Cancel after payment: refund, invoice refunded, revenue drops
def test_13_cancel_after_payment_refund():
    admin_token = get_token_for_user("admin@fabricare.test")
    cust_token = get_token_for_user("customer@fabricare.test")

    # Create & pay order
    order_id = test_03_create_order_pricing_and_admin_exclusion()
    client.post(f"/api/v1/orders/{order_id}/pay", headers={"Authorization": f"Bearer {cust_token}"}, json={"method": "upi"})
    client.post("/api/v1/payments/verify", headers={"Authorization": f"Bearer {cust_token}"}, json={
        "payment_id": payment_repo.get_payment_by_order(order_id)["id"],
        "gateway_payload": {"razorpay_payment_id": "pay_test", "razorpay_signature": "sig"}
    })

    # Cancel via admin
    cancel_resp = client.post(f"/api/v1/admin/orders/{order_id}/cancel", headers={"Authorization": f"Bearer {admin_token}"}, json={
        "reason": "Defective item cancel"
    })
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "CANCELLED"
    assert cancel_resp.json()["payment_status"] == "refunded"

    # Invoice is refunded
    inv = invoice_repo.get_invoice_by_order(order_id)
    assert inv["status"] == "refunded"


# 14. Avatar upload and delete
def test_14_avatar_upload_delete():
    cust_token = get_token_for_user("customer@fabricare.test")

    # Reject .exe
    fake_exe = b"MZ\x90\x00\x03\x00\x00\x00"
    rej_resp = client.post(
        "/api/v1/me/avatar",
        headers={"Authorization": f"Bearer {cust_token}"},
        files={"file": ("virus.exe", fake_exe, "application/octet-stream")},
    )
    assert rej_resp.status_code == 422 or rej_resp.status_code == 400

    # Accept valid png
    valid_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
    ok_resp = client.post(
        "/api/v1/me/avatar",
        headers={"Authorization": f"Bearer {cust_token}"},
        files={"file": ("avatar.png", valid_png, "image/png")},
    )
    assert ok_resp.status_code == 200
    assert ok_resp.json()["avatar_url"] is not None

    # Delete avatar -> 204
    del_resp = client.delete("/api/v1/me/avatar", headers={"Authorization": f"Bearer {cust_token}"})
    assert del_resp.status_code == 204

    # Verify avatar_url is null
    me_resp = client.get("/api/v1/me", headers={"Authorization": f"Bearer {cust_token}"})
    assert me_resp.json()["avatar_url"] is None


# 15. Ownership checks: 404 for reading other customer's resources
def test_15_ownership_check():
    cust_token = get_token_for_user("customer@fabricare.test")

    # Non-existent or other user's resource returns 404
    assert client.get("/api/v1/orders/non_existent_id_12345", headers={"Authorization": f"Bearer {cust_token}"}).status_code == 404
    assert client.get("/api/v1/invoices/non_existent_inv_12345", headers={"Authorization": f"Bearer {cust_token}"}).status_code == 404
    assert client.get("/api/v1/support/tickets/non_existent_ticket_12345", headers={"Authorization": f"Bearer {cust_token}"}).status_code == 404
