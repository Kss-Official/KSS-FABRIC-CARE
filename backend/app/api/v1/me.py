import os
import uuid
from typing import Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, Response, status
from app.core.deps import get_current_user
from app.core.errors import ValidationError, NotFoundError
from app.core.firebase import get_bucket
from app.schemas.auth import MeResponse, MeUpdateRequest
from app.repositories import user_repo


router = APIRouter(prefix="/me", tags=["me"])


def get_user_initials(name: str) -> str:
    if not name:
        return "U"
    parts = name.strip().split()
    if len(parts) >= 2:
        return f"{parts[0][0]}{parts[1][0]}".upper()
    return name[:2].upper()


@router.get("", response_model=MeResponse)
def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "name": current_user.get("name", ""),
        "email": current_user.get("email", ""),
        "phone": current_user.get("phone", ""),
        "role": current_user.get("role", "customer"),
        "avatar_url": current_user.get("avatar_url"),
        "initials": get_user_initials(current_user.get("name", "")),
    }


@router.patch("", response_model=MeResponse)
def update_me(
    request: MeUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    updates = {}
    if request.name is not None:
        updates["name"] = request.name
    if request.phone is not None:
        updates["phone"] = request.phone

    if updates:
        updated = user_repo.update_user(current_user["id"], updates)
    else:
        updated = current_user

    return {
        "id": updated["id"],
        "name": updated.get("name", ""),
        "email": updated.get("email", ""),
        "phone": updated.get("phone", ""),
        "role": updated.get("role", "customer"),
        "avatar_url": updated.get("avatar_url"),
        "initials": get_user_initials(updated.get("name", "")),
    }


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    # Max 2MB check
    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        raise ValidationError("File size exceeds 2 MB limit")

    # Check magic bytes for real file type
    # PNG: 89 50 4E 47 0D 0A 1A 0A
    # JPEG: FF D8 FF
    # WEBP: RIFF....WEBP
    ext = None
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        ext = "png"
    elif content.startswith(b"\xff\xd8\xff"):
        ext = "jpg"
    elif content.startswith(b"RIFF") and len(content) > 12 and content[8:12] == b"WEBP":
        ext = "webp"
    else:
        raise ValidationError("Invalid file type. Allowed formats: JPG, PNG, WEBP")

    uid = current_user["id"]
    filename = f"avatars/{uid}/avatar_{uuid.uuid4().hex[:8]}.{ext}"

    avatar_url = None
    bucket = get_bucket()
    if bucket:
        try:
            blob = bucket.blob(filename)
            blob.upload_from_string(content, content_type=f"image/{ext}")
            blob.make_public()
            avatar_url = blob.public_url
        except Exception:
            pass

    # If storage public url isn't available, generate a data URL or simulated asset URL for local dev
    if not avatar_url:
        import base64
        b64 = base64.b64encode(content).decode()
        avatar_url = f"data:image/{ext};base64,{b64}"

    user_repo.update_user(uid, {"avatar_url": avatar_url})
    return {"avatar_url": avatar_url}


@router.delete("/avatar", status_code=status.HTTP_204_NO_CONTENT)
def delete_avatar(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_repo.update_user(current_user["id"], {"avatar_url": None})
    return Response(status_code=status.HTTP_204_NO_CONTENT)
