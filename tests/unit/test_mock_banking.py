"""Unit tests for mock banking services (George, IBH)."""

from app.agents.loan_drawdown_agent.services.mock_banking import (
    MockGeorgeBanking,
    MockIBH,
)


class TestMockGeorgeBanking:
    """Tests for MockGeorgeBanking.get_client_exposure."""

    def setup_method(self) -> None:
        self.service = MockGeorgeBanking()

    def test_demo_client_exposure(self) -> None:
        """demo_client_001 returns the hardcoded 4.6M limit with 1.2M exposure."""
        data = self.service.get_client_exposure("demo_client_001")
        assert data["client_id"] == "demo_client_001"
        assert data["approved_limit"] == 4_600_000.0
        assert data["current_exposure"] == 1_200_000.0
        assert data["currency"] == "RON"

    def test_high_risk_client_exposure(self) -> None:
        """high_risk_client has 4.5M exposure against a 4.6M limit."""
        data = self.service.get_client_exposure("high_risk_client")
        assert data["approved_limit"] == 4_600_000.0
        assert data["current_exposure"] == 4_500_000.0

    def test_unknown_client_fallback(self) -> None:
        """Unknown client gets the default 1M limit with zero exposure."""
        data = self.service.get_client_exposure("unknown_xyz")
        assert data["client_id"] == "unknown_xyz"
        assert data["approved_limit"] == 1_000_000.0
        assert data["current_exposure"] == 0.0


class TestMockIBH:
    """Tests for MockIBH.get_rate."""

    def setup_method(self) -> None:
        self.service = MockIBH()

    def test_known_exchange_rates(self) -> None:
        """EUR-RON and USD-RON return the configured rates."""
        assert self.service.get_rate("EUR", "RON") == 4.97
        assert self.service.get_rate("USD", "RON") == 4.60

    def test_unknown_exchange_rate_fallback(self) -> None:
        """Unknown currency pair falls back to 1.0."""
        assert self.service.get_rate("GBP", "RON") == 1.0

    def test_same_currency_rate(self) -> None:
        """Same-currency conversions return 1.0."""
        assert self.service.get_rate("RON", "RON") == 1.0
        assert self.service.get_rate("EUR", "EUR") == 1.0
