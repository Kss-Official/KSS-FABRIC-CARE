from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class GarmentTypeItem(BaseModel):
    id: str
    name: str
    is_active: bool = True

    model_config = ConfigDict(extra="ignore")


class GarmentTypeCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

    model_config = ConfigDict(extra="forbid")


class GarmentTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    is_active: Optional[bool] = None

    model_config = ConfigDict(extra="forbid")


class ServiceItem(BaseModel):
    id: str
    name: str
    is_active: bool = True

    model_config = ConfigDict(extra="ignore")


class ServiceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

    model_config = ConfigDict(extra="forbid")


class ServiceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    is_active: Optional[bool] = None

    model_config = ConfigDict(extra="forbid")


class PriceItem(BaseModel):
    garment_id: str
    service_id: str
    price_paise: int = Field(..., ge=0)

    model_config = ConfigDict(extra="ignore")


class CatalogResponse(BaseModel):
    garments: List[GarmentTypeItem]
    services: List[ServiceItem]
    prices: List[PriceItem]

    model_config = ConfigDict(extra="ignore")


class AdminPricesUpdate(BaseModel):
    prices: List[PriceItem]

    model_config = ConfigDict(extra="forbid")
