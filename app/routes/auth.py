from flask import Blueprint, request, make_response
from app.services.auth_service import AuthService
from app.utils.response import success, error
from app.extensions import limiter
from app.middleware.auth_middleware import token_required

auth_bp = Blueprint('auth', __name__)

def get_json_data():
    """Parse JSON from request body, works regardless of Content-Type header."""
    return request.get_json(force=True, silent=True)

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("5 per hour")
def register():
    data = get_json_data()
    if not data or not data.get('name') or not data.get('email') or not data.get('password'):
        return error("Name, email, and password are required.", 400)
    
    resp, status = AuthService.register_user(data['name'], data['email'], data['password'])
    if status != 200:
        return error(resp['error'], status)
    return success(message=resp['message'], data=resp.get('data'), status=status)

@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    data = get_json_data()
    if not data or not data.get('email') or not data.get('otp'):
        return error("Email and OTP are required.", 400)
        
    resp, status = AuthService.verify_email(data['email'], data['otp'])
    if status != 200:
        return error(resp['error'], status)
    return success(message=resp['message'], status=status)

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("10 per 15 minutes")
def login():
    data = get_json_data()
    if not data or not data.get('email') or not data.get('password'):
        return error("Email and password are required.", 400)
        
    resp, status = AuthService.login(data['email'], data['password'])
    if status != 200:
        return error(resp['error'], status)
        
    response = make_response(success(message=resp['message'], data=resp.get('data'), status=status))
    response.set_cookie(
        'token', 
        resp['data']['token'], 
        httponly=True, 
        secure=False,
        samesite='Lax',
        max_age=24*3600
    )
    return response

@auth_bp.route('/forgot-password', methods=['POST'])
@limiter.limit("3 per hour")
def forgot_password():
    data = get_json_data()
    if not data or not data.get('email'):
        return error("Email is required.", 400)
        
    resp, status = AuthService.forgot_password(data['email'])
    return success(message=resp['message'], status=status)

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = get_json_data()
    if not data or not data.get('email') or not data.get('otp') or not data.get('new_password'):
        return error("Email, OTP, and new password are required.", 400)
        
    resp, status = AuthService.reset_password(data['email'], data['otp'], data['new_password'])
    if status != 200:
        return error(resp['error'], status)
    return success(message=resp['message'], status=status)

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout():
    # Blacklist the token
    token = request.cookies.get('token') or request.headers.get('Authorization', '').replace('Bearer ', '')
    AuthService.logout(token)
    
    response = make_response(success(message="Logged out successfully."))
    response.set_cookie('token', '', expires=0, httponly=True, secure=False, samesite='Lax')
    return response
