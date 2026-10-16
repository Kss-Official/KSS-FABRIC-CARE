import hmac
from typing import Callable, Dict, Any, List
from fastapi import Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.firebase import get_auth, get_db
from app.core.config import settings
from app.core.errors import UnauthorizedError, ForbiddenError

security_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_bearer)
) -> Dict[str, Any]:
    if not credentials or not credentials.credentials:
        raise UnauthorizedError("Missing or invalid authorization token")

    token = credentials.credentials
    auth_client = get_auth()

    try:
        # Verify the Firebase ID token
        decoded_token = auth_client.verify_id_token(token, check_revoked=True)
    except Exception as e:
        raise UnauthorizedError(f"Invalid or expired token: {str(e)}")

    uid = decoded_token.get("uid")
    if not uid:
        raise UnauthorizedError("Token does not contain a valid user ID")

    # Read the user document from Firestore to verify active status and role
    db = get_db()
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()

    if not user_doc.exists:
        raise UnauthorizedError("User profile does not exist")

    user_data = user_doc.to_dict() or {}
    user_data["id"] = uid
    user_data["uid"] = uid

    if not user_data.get("is_active", True):
        raise UnauthorizedError("User account is disabled")

    # Claim role takes precedence, fall back to firestore role
    claim_role = decoded_token.get("role")
    doc_role = user_data.get("role", "customer")
    
    # If custom claim exists, ensure consistency
    user_data["role"] = claim_role or doc_role

    return user_data


def require_role(*allowed_roles: str) -> Callable:
    def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = current_user.get("role")
        if user_role not in allowed_roles:
            raise ForbiddenError(f"Role '{user_role}' is not authorized for this resource")
        return current_user

    return role_checker


async def verify_internal_key(
    x_internal_key: str = Header(..., alias="X-Internal-Key")
) -> bool:
    if not x_internal_key or not hmac.compare_digest(x_internal_key, settings.INTERNAL_JOB_KEY):
        raise UnauthorizedError("Invalid or missing X-Internal-Key header")
    return True
