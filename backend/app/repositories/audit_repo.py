from typing import Optional, Dict, Any
from datetime import datetime, timezone
from app.core.firebase import get_db


def log_audit(
    actor_id: str,
    action: str,
    entity: str,
    entity_id: str,
    before: Optional[Any] = None,
    after: Optional[Any] = None,
    ip: Optional[str] = None,
) -> None:
    db = get_db()
    ref = db.collection("audit_logs").document()
    ref.set({
        "actor_id": actor_id,
        "action": action,
        "entity": entity,
        "entity_id": entity_id,
        "before": before,
        "after": after,
        "ip": ip,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
