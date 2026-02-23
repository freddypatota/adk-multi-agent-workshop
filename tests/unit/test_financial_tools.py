"""Unit tests for financial tools (credit ceiling, currency conversion)."""

from app.agents.loan_drawdown_agent.tools.financial_tools import get_financial_context


def test_get_financial_context_within_limit() -> None:
    """Demo client with a small invoice is within the approved limit."""
    result = get_financial_context("demo_client_001", 50000.0, "RON")
    assert result["is_within_limit"] is True
    assert result["approved_limit"] == 4_600_000.0
    assert result["current_exposure"] == 1_200_000.0
    assert result["remaining_limit"] == 3_400_000.0
    assert result["conversion_rate"] == 1.0  # RON -> RON


def test_get_financial_context_exceeds_limit() -> None:
    """High-risk client with only 100k remaining exceeds limit on large invoice."""
    result = get_financial_context("high_risk_client", 200000.0, "RON")
    assert result["is_within_limit"] is False
    assert result["remaining_limit"] == 100_000.0


def test_get_financial_context_currency_conversion() -> None:
    """EUR invoice is converted to RON using the EUR-RON rate (4.97)."""
    result = get_financial_context("demo_client_001", 10000.0, "EUR")
    assert result["conversion_rate"] == 4.97
    assert result["invoice_amount_converted"] == 10000.0 * 4.97
    assert result["is_within_limit"] is True
