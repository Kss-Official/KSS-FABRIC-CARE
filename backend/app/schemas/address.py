from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class AddressCreate(BaseModel):
    label: str = Field(..., min_length=1, max_length=50)
    line1: str = Field(..., min_length=3, max_length=200)
    city: str = Field(..., min_length=2, max_length=100)
    pincode: str = Field(..., min_length=4, max_length=10)
    lat: Optional[float] = None
    lng: Optional[float] = None
    is_default: Optional[bool] = False

    model_config = ConfigDict(extra="forbid")


class AddressUpdate(BaseModel):
    label: Optional[str] = Field(None, min_length=1, max_length=50)
    line1: Optional[str] = Field(None, min_length=3, max_length=200)
    city: Optional[str] = Field(None, min_length=2, max_length=100)
    pincode: Optional[str] = Field(None, min_length=4, max_length=10)
    lat: Optional[float] = None
    lng: Optional[float] = None
    is_default: Optional[bool] = None

    model_config = ConfigDict(extra="forbid")


class AddressResponse(BaseModel):
    id: str
    label: str
    line1: str
    city: str
    pincode: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    is_default: bool = False

    model_config = ConfigDict(extra="ignore")
