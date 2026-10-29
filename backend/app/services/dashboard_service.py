from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from google.cloud.firestore_v1.base_query import FieldFilter
from app.core.firebase import get_db
from app.repositories import stats_repo, user_repo, order_repo


STAFF_STAGE_LABELS = [
    ("RECEIVED", "Received"),
    ("INSPECTION", "Inspection"),
    ("WASHING", "Washing"),
    ("DRYING", "Drying"),
    ("IRONING", "Ironing"),
    ("FOLDING", "Folding"),
    ("QUALITY_CHECK", "Quality Check"),
    ("PACKING", "Packing"),
]

ACTIVE_LAUNDRY_STATUSES = [
    "RECEIVED", "INSPECTION", "WASHING", "DRYING",
    "IRONING", "FOLDING", "QUALITY_CHECK", "PACKING",
    "READY_FOR_DELIVERY", "OUT_FOR_DELIVERY"
]


def get_staff_dashboard(period: str = "today") -> Dict[str, Any]:
    db = get_db()
    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")

    # 1. Total Incoming (active orders)
    active_docs_query = db.collection("orders").where(filter=FieldFilter("status", "in", ACTIVE_LAUNDRY_STATUSES))
    active_orders = list(active_docs_query.stream())
    total_active = len(active_orders)

    today_delta_incoming = sum(
        1 for o in active_orders if (o.to_dict().get("received_at") or "").startswith(today_str)
    )

    # 2. Express Active
    express_active = [o for o in active_orders if o.to_dict().get("is_express")]
    express_val = len(express_active)
    express_today_delta = sum(
        1 for o in express_active if (o.to_dict().get("received_at") or "").startswith(today_str)
    )

    # 3. Combo Active
    combo_active = [o for o in active_orders if o.to_dict().get("is_combo")]
    combo_val = len(combo_active)
    combo_percent = round((combo_val / total_active * 100)) if total_active > 0 else 0

    # 4. Stages counts
    stage_counts = {}
    for st_key, _ in STAFF_STAGE_LABELS:
        stage_counts[st_key] = 0
    for o in active_orders:
        st = o.to_dict().get("status")
        if st in stage_counts:
            stage_counts[st] += 1

    stages_items = []
    stages_total = sum(stage_counts.values())
    for st_key, label in STAFF_STAGE_LABELS:
        cnt = stage_counts[st_key]
        pct = round((cnt / stages_total * 100)) if stages_total > 0 else 0
        stages_items.append({
            "status": st_key,
            "label": label,
            "count": cnt,
            "percent": pct,
        })

    # 5. Attention List (Section 4.4)
    attention = []
    two_hours_later = (now + timedelta(hours=2)).isoformat()
    pre_packing_statuses = ["RECEIVED", "INSPECTION", "WASHING", "DRYING", "IRONING", "FOLDING", "QUALITY_CHECK"]

    for o in active_orders:
        data = o.to_dict()
        order_id = o.id
        code = data.get("code", "FC-XXXXX")
        st = data.get("status")

        # Combo conflict
        if data.get("unresolved_combo") and st in ACTIVE_LAUNDRY_STATUSES[:8]:
            service_names = []
            for it in data.get("items", []):
                for s in it.get("services", []):
                    s_name = s.get("name") if isinstance(s, dict) else str(s)
                    if s_name not in service_names:
                        service_names.append(s_name)
            attention.append({
                "type": "combo_conflict",
                "title": "Same cloth, two services",
                "description": f"Order {code} requires {', '.join(service_names)} on the same item.",
                "order_id": order_id,
                "action": "review",
            })

        # Express late
        due_by = data.get("due_by")
        if data.get("is_express") and due_by and due_by <= two_hours_later and st in pre_packing_statuses:
            attention.append({
                "type": "express_late",
                "title": "Express order running late",
                "description": f"Express order {code} is due soon and is currently in {st}.",
                "order_id": order_id,
                "action": "open",
            })

    # 6. Services breakdown by period
    days_back = 0 if period == "today" else (7 if period == "week" else 30)
    target_dates = [(now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(days_back + 1)]
    daily_stats = stats_repo.get_daily_stats_range(target_dates)

    combined_service_counts: Dict[str, int] = {}
    total_orders_placed = 0
    total_express = 0

    for stat in daily_stats:
        total_orders_placed += stat.get("orders_placed", 0)
        total_express += stat.get("express_count", 0)
        for s_name, count in stat.get("service_counts", {}).items():
            combined_service_counts[s_name] = combined_service_counts.get(s_name, 0) + count

    # Top 5 services
    sorted_services = sorted(combined_service_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    service_items = [{"service": s_name, "count": count} for s_name, count in sorted_services]
    # Add Express item as specified
    service_items.append({"service": "Express", "count": total_express})

    # 7. Recent Requests (latest 4 by received_at)
    recent_query = (
        db.collection("orders")
        .where(filter=FieldFilter("status", "in", ACTIVE_LAUNDRY_STATUSES))
        .order_by("received_at", direction="DESCENDING")
        .limit(4)
    )
    recent_docs = list(recent_query.stream())
    recent_requests = []
    for rd in recent_docs:
        rdata = rd.to_dict()
        items_list = rdata.get("items", [])
        if items_list:
            first_item = items_list[0]
            g_name = first_item.get("garment", "Item")
            qty = first_item.get("quantity", 1)
            more_count = len(items_list) - 1
            items_str = f"{g_name} x {qty}" + (f" +{more_count} more" if more_count > 0 else "")
        else:
            items_str = "No items"

        s_names = []
        for it in items_list:
            for s in it.get("services", []):
                name = s.get("name") if isinstance(s, dict) else str(s)
                if name not in s_names:
                    s_names.append(name)

        tags = []
        if rdata.get("is_express"):
            tags.append("express")
        if rdata.get("is_combo"):
            tags.append("combo")

        recent_requests.append({
            "id": rd.id,
            "code": rdata.get("code", "FC-XXXXX"),
            "customer_name": rdata.get("customer", {}).get("name", "Customer"),
            "items": items_str,
            "services": s_names,
            "tags": tags,
            "received_at": rdata.get("received_at"),
        })

    return {
        "kpis": {
            "total_incoming": {"value": total_active, "today_delta": today_delta_incoming},
            "express": {"value": express_val, "today_delta": express_today_delta},
            "combo": {"value": combo_val, "percent": combo_percent},
            "needs_attention": {"value": len(attention)},
        },
        "stages": {
            "total": stages_total,
            "items": stages_items,
        },
        "services": {
            "period": period,
            "total": total_orders_placed,
            "items": service_items,
        },
        "recent_requests": recent_requests,
        "attention": attention,
    }


def get_admin_dashboard(period: str = "today") -> Dict[str, Any]:
    db = get_db()
    now = datetime.now(timezone.utc)
    days_back = 0 if period == "today" else (7 if period == "week" else 30)
    target_dates = [(now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(days_back + 1)]
    target_dates.reverse()  # chronological order
    daily_stats = stats_repo.get_daily_stats_range(target_dates)

    total_orders = sum(s.get("orders_placed", 0) for s in daily_stats)
    total_rev = sum(s.get("revenue_paise", 0) for s in daily_stats)

    orders_by_day = [{"date": s["date"], "count": s.get("orders_placed", 0)} for s in daily_stats]
    revenue_by_day = [{"date": s["date"], "amount_paise": s.get("revenue_paise", 0)} for s in daily_stats]

    # Active customers
    cust_res = db.collection("users").where(filter=FieldFilter("role", "==", "customer")).where(filter=FieldFilter("is_active", "==", True)).count().get()
    active_cust_count = cust_res[0][0].value

    # Pending pickups
    pickups_res = (
        db.collection("tasks")
        .where(filter=FieldFilter("type", "==", "pickup"))
        .where(filter=FieldFilter("status", "in", ["unassigned", "assigned"]))
        .count()
        .get()
    )
    pending_pickups = pickups_res[0][0].value

    # Stage counts
    stages_counts = []
    for st in ["RECEIVED", "WASHING", "IRONING", "PACKING", "OUT_FOR_DELIVERY"]:
        cnt_res = db.collection("orders").where(filter=FieldFilter("status", "==", st)).count().get()
        stages_counts.append({"status": st, "count": cnt_res[0][0].value})

    # Top services
    combined_services: Dict[str, int] = {}
    for s in daily_stats:
        for s_name, count in s.get("service_counts", {}).items():
            combined_services[s_name] = combined_services.get(s_name, 0) + count
    top_services = [{"service": s_name, "count": cnt} for s_name, cnt in sorted(combined_services.items(), key=lambda x: x[1], reverse=True)[:5]]

    # Staff load
    staff_users = user_repo.list_staff()
    staff_load = [{"name": su["name"], "active_orders": su.get("active_orders", 0)} for su in staff_users]

    # Agents online
    all_agents = user_repo.list_agents()
    online_agents = sum(1 for a in all_agents if a.get("is_online"))

    return {
        "kpis": {
            "orders_total": total_orders,
            "revenue_paise": total_rev,
            "active_customers": active_cust_count,
            "pending_pickups": pending_pickups,
        },
        "orders_by_day": orders_by_day,
        "revenue_by_day": revenue_by_day,
        "stages": stages_counts,
        "top_services": top_services,
        "staff_load": staff_load,
        "agents": {
            "online": online_agents,
            "total": len(all_agents),
        },
    }
