from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from firebase_admin import auth as fb_auth
from app.core.firebase import get_db
from app.core.errors import ConflictError, ValidationError
from app.schemas.auth import RegisterRequest, UserItemResponse
from app.repositories import user_repo


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest):
    # Check phone uniqueness in phone_index
    if user_repo.get_user_by_phone(request.phone):
        raise ConflictError(f"Phone number {request.phone} is already registered")

    # Create Firebase Auth user
    try:
        user_record = fb_auth.create_user(
            email=request.email,
            phone_number=request.phone if request.phone.startswith("+") else f"+91{request.phone}",
            password=request.password,
            display_name=request.name,
        )
    except fb_auth.EmailAlreadyExistsError:
        raise ConflictError("An account with this email already exists")
    except Exception as e:
        # If phone format error, retry without phone in Auth or return validation error
        try:
            user_record = fb_auth.create_user(
                email=request.email,
                password=request.password,
                display_name=request.name,
            )
        except Exception as inner_e:
            raise ValidationError(f"Failed to create user account: {str(inner_e)}")

    uid = user_record.uid

    # Set custom claim role=customer
    fb_auth.set_custom_user_claims(uid, {"role": "customer"})

    now_iso = datetime.now(timezone.utc).isoformat()
    user_data = {
        "id": uid,
        "name": request.name,
        "name_lower": request.name.lower(),
        "email": request.email.lower(),
        "phone": request.phone,
        "role": "customer",
        "avatar_url": None,
        "is_active": True,
        "last_login_at": None,
        "created_at": now_iso,
        "updated_at": now_iso,
    }

    # Store in users/{uid} and phone_index/{phone} via transaction
    db = get_db()
    tx = db.transaction()
    user_repo.create_user_transaction(tx, uid, user_data, request.phone)

    return {"user": user_data}
