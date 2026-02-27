from ..services.mock_banking import MockGeorgeBanking, MockIBH

george_service = MockGeorgeBanking()
ibh_service = MockIBH()


def get_financial_context(client_id: str, invoice_amount: float, currency: str) -> dict:
    """
    Retrieves financial context from Core Banking and checks limits.

    Args:
        client_id: The client identifier (e.g., "demo_client_001").
        invoice_amount: The gross invoice amount.
        currency: The invoice currency code (e.g., "EUR", "RON").

    Returns:
        A dictionary with client_id, currency, approved_limit, current_exposure,
        remaining_limit, invoice_amount_converted, conversion_rate, is_within_limit.
    """
    # TODO(workshop): Implement the financial context retrieval.
    #
    # Steps:
    # 1. Get client exposure data: george_service.get_client_exposure(client_id)
    # 2. Get exchange rate: ibh_service.get_rate(currency, exposure_data["currency"])
    # 3. Convert the invoice amount: invoice_amount * rate
    # 4. Calculate remaining limit: approved_limit - current_exposure
    # 5. Check if within limit: remaining_limit >= converted_amount
    # 6. Return a dict with all the financial context fields
    #
    # Hint:
    #   exposure_data = george_service.get_client_exposure(client_id)
    #   rate = ibh_service.get_rate(currency, exposure_data["currency"])
    #   converted_amount = invoice_amount * rate
    #   approved = exposure_data["approved_limit"]
    #   current = exposure_data["current_exposure"]
    #   remaining = approved - current
    #   is_within = remaining >= converted_amount
    #   return {"client_id": client_id, "currency": exposure_data["currency"], ...}

    pass  # Replace with your implementation
