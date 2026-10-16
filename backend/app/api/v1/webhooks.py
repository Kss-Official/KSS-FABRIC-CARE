import json
from fastapi import APIRouter, Request, Header, HTTPException, status
from app.services import payment_service


router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/payment")
async def payment_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None, alias="X-Razorpay-Signature"),
):
    body_bytes = await request.body()
    try:
        payload = json.loads(body_bytes.decode())
    except Exception:
        payload = {}

    sig = x_razorpay_signature or request.headers.get("x-signature") or "mock_signature"
    result = payment_service.process_payment_webhook(
        body_bytes=body_bytes,
        signature=sig,
        payload=payload,
    )
    return result
