import random
import hashlib
import hmac


def generate_otp() -> str:
    """Generate a secure 4-digit OTP string."""
    return "".join(random.choices("0123456789", k=4))


def hash_otp(otp: str, salt: str) -> str:
    """Hash the OTP with salt using SHA-256."""
    data = f"{otp}:{salt}".encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def verify_otp(input_otp: str, stored_hash: str, salt: str) -> bool:
    """Constant time OTP hash verification."""
    computed = hash_otp(input_otp, salt)
    return hmac.compare_digest(computed, stored_hash)


def verify_razorpay_signature(order_id: str, payment_id: str, signature: str, secret: str) -> bool:
    """Verifies Razorpay payment signature."""
    payload = f"{order_id}|{payment_id}".encode("utf-8")
    expected = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def verify_webhook_signature(body_bytes: bytes, signature: str, secret: str) -> bool:
    """Verifies payment gateway webhook signature."""
    if not signature or not secret:
        return False
    expected = hmac.new(secret.encode("utf-8"), body_bytes, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)
