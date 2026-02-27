from typing import Literal, Optional

from pydantic import BaseModel, Field


class LineItem(BaseModel):
    description: str = Field(..., description="Description of the item or service")
    quantity: float = Field(..., description="Quantity of items")
    unit_price: float = Field(..., description="Unit price per item")
    total_amount: float = Field(..., description="Total amount for this line item")


class InvoiceData(BaseModel):
    invoice_number: str = Field(..., description="Invoice number")
    vendor_name: str = Field(..., description="Name of the vendor/supplier")
    vendor_iban: Optional[str] = Field(None, description="IBAN of the vendor")
    invoice_date: str = Field(..., description="Date of the invoice (YYYY-MM-DD)")
    currency: str = Field(..., description="Currency code (e.g., EUR, RON)")
    total_amount_net: float = Field(..., description="Total net amount")
    total_amount_gross: float = Field(..., description="Total gross amount")
    line_items: list[LineItem] = Field(..., description="List of line items")
    is_signed: bool = Field(False, description="Whether the invoice is signed")


class ComplianceCheckResult(BaseModel):
    check_name: Literal["Sanctions", "Prohibited Goods"] = Field(...)
    status: Literal["PASS", "FAIL", "FLAGGED"] = Field(...)
    flags: list[str] = Field(default_factory=list)
    reason: str = Field(...)


class FinancialContext(BaseModel):
    client_id: str
    currency: str = Field("RON")
    approved_limit: float
    current_exposure: float
    remaining_limit: float
    invoice_amount_converted: float
    conversion_rate: float
    is_within_limit: bool


class CheckSummary(BaseModel):
    check_name: Literal["Sanctions", "Prohibited Goods", "Credit Ceiling"] = Field(...)
    status: Literal["PASS", "FAIL", "FLAGGED"] = Field(...)
    reason: str = Field(...)


class ValidationReport(BaseModel):
    decision: Literal["APPROVED", "REJECTED", "TO BE REVIEWED"] = Field(...)
    checks: list[CheckSummary] = Field(...)
    conclusion: str = Field(...)
