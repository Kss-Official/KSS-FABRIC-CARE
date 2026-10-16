from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    next_cursor: Optional[str] = None
    total: int

    model_config = ConfigDict(extra="ignore")


class ErrorDetail(BaseModel):
    code: str
    message: str
    fields: Optional[dict] = {}


class ErrorResponse(BaseModel):
    error: ErrorDetail
