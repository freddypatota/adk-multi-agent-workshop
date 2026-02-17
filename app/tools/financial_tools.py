from app.services.mock_banking import MockGeorgeBanking, MockIBH
from app.models.data_models import FinancialContext

george_service = MockGeorgeBanking()
ibh_service = MockIBH()

def get_financial_context(client_id: str, invoice_amount: float, currency: str) -> dict:
    """
    Retrieves financial context from Core Banking and checks limits.
    """
    exposure_data = george_service.get_client_exposure(client_id)
    
    # Calculate conversion if needed
    rate = ibh_service.get_rate(currency, exposure_data["currency"])
    converted_amount = invoice_amount * rate
    
    approved = exposure_data["approved_limit"]
    current = exposure_data["current_exposure"]
    remaining = approved - current
    
    is_within = remaining >= converted_amount
    
    return FinancialContext(
        client_id=client_id,
        approved_limit=approved,
        current_exposure=current,
        remaining_limit=remaining,
        invoice_amount_converted=converted_amount,
        conversion_rate=rate,
        is_within_limit=is_within
    ).dict()
