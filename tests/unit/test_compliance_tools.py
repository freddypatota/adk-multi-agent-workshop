"""Unit tests for compliance tools (sanctions checking, prohibited goods)."""

from app.agents.loan_drawdown_agent.tools.compliance_tools import (
    PROHIBITED_KEYWORDS,
    check_sanctions,
    prohibited_goods_rag,
)


def test_check_sanctions_pass() -> None:
    """Vendor not on sanctions list returns PASS with no flags."""
    result = check_sanctions("Acme Supplies SRL")
    assert result["status"] == "PASS"
    assert result["flags"] == []
    assert result["check_name"] == "Sanctions"


def test_check_sanctions_fail() -> None:
    """Vendor on sanctions list returns FAIL with a flag."""
    result = check_sanctions("BadActor Corp")
    assert result["status"] == "FAIL"
    assert len(result["flags"]) == 1
    assert "BadActor Corp" in result["flags"][0]


def test_prohibited_goods_rag() -> None:
    """prohibited_goods_rag returns the expected keyword list."""
    keywords = prohibited_goods_rag()
    assert keywords == PROHIBITED_KEYWORDS
    assert "Weapon" in keywords
    assert "Luxury" in keywords
    assert "Gambling" in keywords
