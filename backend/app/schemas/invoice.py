from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict


class InvoiceItemResponse(BaseModel):
    id: str
    invoice_no: str
    order_code: str
    amount_paise: int
    status: str
    issued_at: str

    model_config = ConfigDict(extra="ignore")


class InvoiceDetailResponse(BaseModel):
    id: str
    invoice_no: str
    order_id: str
    order_code: str
    customer_id: str
    amount_paise: int
    status: str
    issued_at: str
    pdf_url: Optional[str] = None
    line_items: List[Dict[str, Any]]

    model_config = ConfigDict(extra="ignore")
