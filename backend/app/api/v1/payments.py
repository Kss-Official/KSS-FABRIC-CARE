from typing import Dict, Any
from fastapi import APIRouter, Depends
from app.core.deps import require_role
from app.schemas.payment import (
    OrderPayRequest,
    OrderPayResponse,
    PaymentVerifyRequest,
    PaymentVerifyResponse,
)
from app.services import payment_service


router = APIRouter(tags=["payments"])


@router.post("/orders/{id}/pay", response_model=OrderPayResponse)
def pay_order(
    id: str,
    request: OrderPayRequest,
    current_user: Dict[str, Any] = Depends(require_role("customer")),
):
    result = payment_service.initiate_payment(
        order_id=id,
        user_id=current_user["id"],
        method=request.method,
    )
    return result


@router.post("/payments/verify", response_model=PaymentVerifyResponse)
def verify_payment_endpoint(
    request: PaymentVerifyRequest,
    current_user: Dict[str, Any] = Depends(require_role("customer")),
):
    result = payment_service.verify_payment(
        payment_id=request.payment_id,
        payload=request.gateway_payload,
    )
    return result
