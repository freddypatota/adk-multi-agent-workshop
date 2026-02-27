SANCTIONS_LIST = [name.lower() for name in ["BadActor Corp", "Evil Industries", "Sanctioned Entity 101"]]


def check_sanctions(vendor_name: str) -> dict:
    """Checks if the vendor is on a sanctions list."""
    flags = []
    if vendor_name.strip().lower() in SANCTIONS_LIST:
        flags.append(f"Vendor '{vendor_name}' is on the Sanctions List.")

    status = "FAIL" if flags else "PASS"
    reason = "Sanctions match found." if flags else "Vendor not found in sanctions list."

    return {"check_name": "Sanctions", "status": status, "flags": flags, "reason": reason}
