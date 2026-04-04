import pytest
import json

def test_health_check(client):
    """Verify the app starts and base routes work."""
    response = client.get('/login')
    assert response.status_code == 200
    assert b"FinanceDash" in response.data

def test_api_unauthorized(client):
    """Verify protected APIs return 401 without token."""
    response = client.get('/api/transactions')
    assert response.status_code == 401
    assert b"Authentication required" in response.data

def test_invalid_login(client):
    """Verify login fails with wrong credentials."""
    data = {
        "email": "nonexistent@test.com",
        "password": "wrongpassword123"
    }
    response = client.post('/api/auth/login', 
                           data=json.dumps(data),
                           content_type='application/json')
    assert response.status_code == 400
    assert b"Invalid email or password" in response.data
