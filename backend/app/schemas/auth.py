from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=6)

    model_config = ConfigDict(extra="forbid")


class MeResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    role: str
    avatar_url: Optional[str] = None
    initials: str

    model_config = ConfigDict(extra="ignore")


class MeUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, min_length=10, max_length=15)

    model_config = ConfigDict(extra="forbid")


class AdminUserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=25)
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    phone: str = Field(..., min_length=10, max_length=15)
    role: str = Field(..., pattern="^(customer|agent|staff|admin)$")
    password: str = Field(..., min_length=6)

    model_config = ConfigDict(extra="forbid")


class AdminUserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=25)
    phone: Optional[str] = Field(None, min_length=10, max_length=15)
    role: Optional[str] = Field(None, pattern="^(customer|agent|staff|admin)$")

    model_config = ConfigDict(extra="forbid")


class AdminUserStatusUpdate(BaseModel):
    is_active: bool

    model_config = ConfigDict(extra="forbid")


class AdminUserResetPassword(BaseModel):
    new_password: str = Field(..., min_length=6)

    model_config = ConfigDict(extra="forbid")


class UserItemResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    role: str
    is_active: bool
    created_at: str

    model_config = ConfigDict(extra="ignore")
