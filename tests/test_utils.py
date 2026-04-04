import pytest
import json

def test_validators():
    from app.utils.validators import is_valid_email, is_strong_password, validate_date
    
    # Email
    assert is_valid_email("test@example.com") is True
    assert is_valid_email("invalid-email") is False
    
    # Password
    assert is_strong_password("Pass1234") is True
    assert is_strong_password("weak") is False
    
    # Date
    assert validate_date("2024-12-31") is True
    assert validate_date("31-12-2024") is False
