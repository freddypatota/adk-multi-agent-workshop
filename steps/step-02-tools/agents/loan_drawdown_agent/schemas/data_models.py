from typing import Literal

from pydantic import BaseModel, Field


# TODO(workshop): Define the ComplianceCheckResult model.
# This model represents the result of a compliance check (sanctions or prohibited goods).
#
# Fields:
#   - check_name: Literal["Sanctions", "Prohibited Goods"] — name of the check
#   - status: Literal["PASS", "FAIL", "FLAGGED"] — result of the check
#   - flags: list[str] — list of specific findings (default empty list)
#   - reason: str — explanation for the status
#
# Hint: Use Field(..., description="...") for each field.
#       Use default_factory=list for the flags field.

# class ComplianceCheckResult(BaseModel):
#     ...


# TODO(workshop): Define the FinancialContext model.
# This model represents the financial context for a credit ceiling check.
#
# Fields:
#   - client_id: str
#   - currency: str (default "RON")
#   - approved_limit: float
#   - current_exposure: float
#   - remaining_limit: float
#   - invoice_amount_converted: float
#   - conversion_rate: float
#   - is_within_limit: bool

# class FinancialContext(BaseModel):
#     ...
