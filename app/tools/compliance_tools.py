from typing import List, Dict, Any
from app.models.data_models import ComplianceCheckResult

# Mock Prohibited Goods Database (as fallback for RAG)
PROHIBITED_KEYWORDS = [
    "Weapon", "Luxury", "Gambling", "Cigarette", "Tobacco", "Alcohol"
]

SANCTIONS_LIST = [
    "BadActor Corp", "Evil Industries", "Sanctioned Entity 101"
]

def prohibited_goods_rag(line_items: List[Dict[str, Any]]) -> ComplianceCheckResult:
    """
    Returns the list of prohibited goods.
    """
    return PROHIBITED_KEYWORDS

def check_sanctions(vendor_name: str) -> ComplianceCheckResult:
    """
    Checks if the vendor is on a sanctions list.
    """
    flags = []
    if vendor_name in SANCTIONS_LIST:
        flags.append(f"Vendor '{vendor_name}' is on the Sanctions List.")

    status = "FAIL" if flags else "PASS"
    reason = "Sanctions match found." if flags else "Vendor not found in sanctions list."

    return ComplianceCheckResult(
        check_name="Sanctions Check",
        status=status,
        flags=flags,
        reason=reason
    ).dict()
