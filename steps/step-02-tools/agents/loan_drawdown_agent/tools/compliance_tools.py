# Mock sanctions list for demo purposes
SANCTIONS_LIST = [name.lower() for name in ["BadActor Corp", "Evil Industries", "Sanctioned Entity 101"]]


def check_sanctions(vendor_name: str) -> dict:
    """
    Checks if the vendor is on a sanctions list.

    Args:
        vendor_name: The name of the vendor to check.

    Returns:
        A dictionary with check_name, status, flags, and reason.
    """
    # TODO(workshop): Implement the sanctions check logic.
    #
    # Steps:
    # 1. Normalize the vendor_name (strip whitespace, lowercase) for comparison
    # 2. Check if the normalized name is in SANCTIONS_LIST
    # 3. If found, set status to "FAIL" and add a flag message
    # 4. If not found, set status to "PASS"
    # 5. Return a dict with: check_name, status, flags, reason

    pass  # Replace with your implementation
