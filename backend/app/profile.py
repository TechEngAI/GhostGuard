from typing import Any

OPTIONAL_PROFILE_FIELDS = [
    "middle_name",
    "date_of_birth",
    "home_address",
    "state_of_origin",
    "next_of_kin_name",
    "next_of_kin_phone",
    "emergency_contact_name",
    "emergency_contact_phone",
    "nin",
    "has_company_device",
]


def calculate_completeness(worker: dict[str, Any]) -> float:
    """Calculate worker profile completeness across the configured optional fields."""

    filled = 0
    for field in OPTIONAL_PROFILE_FIELDS:
        value = worker.get(field)
        if isinstance(value, bool):
            filled += int(value)
        elif value not in (None, ""):
            filled += 1
    return round(filled / len(OPTIONAL_PROFILE_FIELDS), 2)


def missing_profile_fields(worker: dict[str, Any]) -> list[str]:
    """Return optional profile fields that have not been filled."""

    missing: list[str] = []
    for field in OPTIONAL_PROFILE_FIELDS:
        value = worker.get(field)
        if isinstance(value, bool):
            if not value:
                missing.append(field)
        elif value in (None, ""):
            missing.append(field)
    return missing

