from typing import Literal

from pydantic import BaseModel, Field


class ComplianceCheckResult(BaseModel):
    check_name: Literal["Sanctions", "Prohibited Goods"] = Field(
        ..., description="Name of the check"
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
