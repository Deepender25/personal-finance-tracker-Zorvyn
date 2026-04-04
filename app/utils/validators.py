import re
from datetime import datetime


def is_valid_email(email: str) -> bool:
    pattern = r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def is_strong_password(password: str) -> bool:
    if len(password) < 8:
        return False
    if not re.search(r'[A-Z]', password):
        return False
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'[0-9]', password):
        return False
    return True


def validate_date(date_str: str) -> bool:
    """Validate YYYY-MM-DD format."""
    if not date_str:
        return False
    try:
        datetime.strptime(date_str, '%Y-%m-%d')
        return True
    except ValueError:
        return False


def validate_month(month_str: str) -> bool:
    """Validate YYYY-MM format."""
    if not month_str:
        return False
    try:
        datetime.strptime(month_str, '%Y-%m')
        return True
    except ValueError:
        return False


def is_valid_uuid(value: str) -> bool:
    if not value:
        return False
    pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    return bool(re.match(pattern, str(value).lower()))


def is_valid_period(period: str) -> bool:
    return period in ('monthly', 'yearly')


def is_valid_interval(interval: str) -> bool:
    return interval in ('daily', 'weekly', 'monthly', 'yearly')


def sanitize_string(value: str, max_length: int = 255) -> str:
    """Strip and truncate a string."""
    if not value:
        return ''
    return str(value).strip()[:max_length]
