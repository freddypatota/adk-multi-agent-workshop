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
    line_items: list[LineItem] = Field(
        ..., description="List of line items in the invoice"
    )
    is_signed: bool = Field(
        False, description="Whether the invoice appears to be signed"
    )


class ComplianceCheckResult(BaseModel):
    check_name: Literal["Sanctions", "Prohibited Goods"] = Field(
        ..., description="Name of the check (e.g., 'Sanctions', 'Prohibited Goods')"
    )
    status: Literal["PASS", "FAIL", "FLAGGED"] = Field(
        ..., description="Whether the check passed, failed, or is inconclusive"
    )
    flags: list[str] = Field(
        default_factory=list, description="List of specific flags or findings"
    )
    reason: str = Field(..., description="Explanation for the status")


class FinancialContext(BaseModel):
    client_id: str
    currency: str = Field("RON", description="Currency of the credit limit")
    approved_limit: float
    current_exposure: float
    remaining_limit: float
    invoice_amount_converted: float
    conversion_rate: float
    is_within_limit: bool


class CheckSummary(BaseModel):
    check_name: Literal["Sanctions", "Prohibited Goods", "Credit Ceiling"] = Field(
        ...,
        description="Name of the check (one among 'Sanctions', 'Prohibited Goods', 'Credit Ceiling')",
    )
    status: Literal["PASS", "FAIL", "FLAGGED"] = Field(
        ..., description="Whether the check passed, failed, or is inconclusive"
    )
    reason: str = Field(
        ..., description="Why the check passed, failed, or has been flagged"
    )


class ValidationReport(BaseModel):
    decision: Literal["APPROVED", "REJECTED", "TO BE REVIEWED"] = Field(
        ...,
        description="Whether the loan drawdown request is approved, rejected, or needs review based on the checks",
    )
    checks: list[CheckSummary] = Field(
        ..., description="One entry per check reviewed by the decision agent"
    )
    conclusion: str = Field(
        ..., description="One-sentence summary of the final reasoning"
    )


# --- Batch wrappers for multi-invoice processing ---


class InvoiceBatch(BaseModel):
    invoices: list[InvoiceData] = Field(
        ..., description="List of extracted invoices, one per uploaded file"
    )


class ComplianceBatchResult(BaseModel):
    results: list[ComplianceCheckResult] = Field(
        ..., description="One compliance result per invoice, in the same order"
    )


class FinancialBatchContext(BaseModel):
    results: list[FinancialContext] = Field(
        ..., description="One financial context per invoice, in the same order"
    )


class BatchValidationReport(BaseModel):
    reports: list[ValidationReport] = Field(
        ..., description="One validation report per invoice, in the same order"
    )
