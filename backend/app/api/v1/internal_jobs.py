import hmac
from fastapi import APIRouter, Header, HTTPException, status
from app.core.config import settings
from app.core.errors import ForbiddenError
from app.jobs import run_expire_unpaid_jobs, run_express_late_jobs


router = APIRouter(prefix="/internal/jobs", tags=["internal_jobs"])


def verify_internal_key(x_internal_key: str = Header(None, alias="X-Internal-Key")):
    if not x_internal_key or not settings.INTERNAL_JOB_KEY:
        raise ForbiddenError("Invalid internal job key")
    if not hmac.compare_digest(x_internal_key.strip(), settings.INTERNAL_JOB_KEY.strip()):
        raise ForbiddenError("Invalid internal job key")


@router.post("/expire-unpaid")
def expire_unpaid(x_internal_key: str = Header(None, alias="X-Internal-Key")):
    verify_internal_key(x_internal_key)
    cancelled = run_expire_unpaid_jobs()
    return {"status": "ok", "cancelled_count": cancelled}


@router.post("/express-late")
def express_late(x_internal_key: str = Header(None, alias="X-Internal-Key")):
    verify_internal_key(x_internal_key)
    notified = run_express_late_jobs()
    return {"status": "ok", "notified_count": notified}
