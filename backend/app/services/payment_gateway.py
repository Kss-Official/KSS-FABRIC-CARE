import hmac
import hashlib
import uuid
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from app.core.config import settings


class PaymentGateway(ABC):
    @abstractmethod
    def create_order(self, amount_paise: int, receipt: str) -> Dict[str, Any]:
        """Create a gateway order and return gateway order info"""
        pass

    @abstractmethod
    def verify_payment(self, payload: Dict[str, Any]) -> bool:
        """Verify payment signature from client payload"""
        pass

    @abstractmethod
    def verify_webhook(self, body_bytes: bytes, signature: str) -> bool:
        """Verify webhook signature"""
        pass

    @abstractmethod
    def refund(self, payment_id: str, amount_paise: int) -> Dict[str, Any]:
        """Refund a payment"""
        pass


class MockGateway(PaymentGateway):
    def create_order(self, amount_paise: int, receipt: str) -> Dict[str, Any]:
        return {
            "gateway_order_id": f"mock_order_{uuid.uuid4().hex[:12]}",
            "amount_paise": amount_paise,
            "currency": "INR",
            "gateway_key": "mock_key_fabricare",
        }

    def verify_payment(self, payload: Dict[str, Any]) -> bool:
        # Mock payment always succeeds
        return True

    def verify_webhook(self, body_bytes: bytes, signature: str) -> bool:
        # If secret is set, verify hmac sha256, or allow in mock if signature matches or is 'mock_signature'
        if not settings.PAYMENT_WEBHOOK_SECRET:
            return True
        computed = hmac.new(
            settings.PAYMENT_WEBHOOK_SECRET.encode(),
            body_bytes,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(computed, signature) or signature == "mock_signature"

    def refund(self, payment_id: str, amount_paise: int) -> Dict[str, Any]:
        return {
            "refund_id": f"mock_rfnd_{uuid.uuid4().hex[:12]}",
            "amount_paise": amount_paise,
            "status": "processed",
        }


class RazorpayGateway(PaymentGateway):
    def __init__(self):
        self.key_id = settings.PAYMENT_KEY_ID
        self.key_secret = settings.PAYMENT_KEY_SECRET

    def create_order(self, amount_paise: int, receipt: str) -> Dict[str, Any]:
        import requests
        resp = requests.post(
            "https://api.razorpay.com/v1/orders",
            auth=(self.key_id, self.key_secret),
            json={
                "amount": amount_paise,
                "currency": "INR",
                "receipt": receipt,
            },
            timeout=10,
        )
        if resp.status_code != 200:
            raise Exception(f"Razorpay order creation failed: {resp.text}")
        data = resp.json()
        return {
            "gateway_order_id": data["id"],
            "amount_paise": data["amount"],
            "currency": data["currency"],
            "gateway_key": self.key_id,
        }

    def verify_payment(self, payload: Dict[str, Any]) -> bool:
        # razorpay_order_id|razorpay_payment_id
        razorpay_order_id = payload.get("razorpay_order_id", "")
        razorpay_payment_id = payload.get("razorpay_payment_id", "")
        signature = payload.get("razorpay_signature", "")
        msg = f"{razorpay_order_id}|{razorpay_payment_id}".encode()
        expected = hmac.new(self.key_secret.encode(), msg, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)

    def verify_webhook(self, body_bytes: bytes, signature: str) -> bool:
        secret = settings.PAYMENT_WEBHOOK_SECRET or self.key_secret
        expected = hmac.new(secret.encode(), body_bytes, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)

    def refund(self, payment_id: str, amount_paise: int) -> Dict[str, Any]:
        import requests
        resp = requests.post(
            f"https://api.razorpay.com/v1/payments/{payment_id}/refund",
            auth=(self.key_id, self.key_secret),
            json={"amount": amount_paise},
            timeout=10,
        )
        if resp.status_code != 200:
            raise Exception(f"Razorpay refund failed: {resp.text}")
        return resp.json()


def get_payment_gateway() -> PaymentGateway:
    if settings.PAYMENT_GATEWAY.lower() == "razorpay":
        return RazorpayGateway()
    return MockGateway()
