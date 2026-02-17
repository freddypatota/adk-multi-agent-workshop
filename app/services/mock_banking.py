from typing import Dict, Any
# TODO: Analyze what George and IBH are actually doing at the customers
class MockGeorgeBanking:
    """
    Mock service for 'George' Core Banking System.
    Simulates retrieving client exposure and limits.
    """
    
    def get_client_exposure(self, client_id: str) -> Dict[str, Any]:
        """
        Returns hardcoded exposure data for demo purposes.
        In a real scenario, this would call the Core Banking API.
        """
        # Default demo client
        if client_id == "demo_client_001":
            return {
                "client_id": client_id,
                "approved_limit": 4600000.00,  # 4.6M RON as per PRD
                "current_exposure": 1200000.00,
                "currency": "RON"
            }
        # Client nearing limit
        elif client_id == "high_risk_client":
            return {
                "client_id": client_id,
                "approved_limit": 4600000.00,
                "current_exposure": 4500000.00, # Only 100k remaining
                "currency": "RON"
            }
        else:
            # Default fallback
            return {
                "client_id": client_id,
                "approved_limit": 1000000.00,
                "current_exposure": 0.00,
                "currency": "RON"
            }

class MockIBH:
    """
    Mock service for 'International Bank House' (IBH) Rates.
    Simulates currency conversion rates.
    """
    
    def get_rate(self, from_currency: str, to_currency: str) -> float:
        """
        Returns exchange rates.
        PRD Mention: Use 'Official Bank Rates'.
        """
        key = f"{from_currency.upper()}-{to_currency.upper()}"
        
        rates = {
            "EUR-RON": 4.97,
            "USD-RON": 4.60,
            "RON-EUR": 1 / 4.97,
            "RON-USD": 1 / 4.60,
            "RON-RON": 1.0,
            "EUR-EUR": 1.0,
            "USD-USD": 1.0
        }
        
        return rates.get(key, 1.0) # Default to 1.0 if unknown (risk, but acceptable for mock)
