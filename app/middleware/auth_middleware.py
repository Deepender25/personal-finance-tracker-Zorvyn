from functools import wraps
from flask import request, jsonify
import jwt
import hashlib
from app.config import Config


def _is_token_blacklisted(jti: str) -> bool:
    try:
        from app.models import get_db_cursor
        with get_db_cursor() as cursor:
            cursor.execute(
                "SELECT id FROM token_blacklist WHERE jti = %s AND expires_at > NOW()",
                (jti,)
            )
            return cursor.fetchone() is not None
    except Exception:
        return False  # Fail open to avoid blocking all requests on DB issue


def _verify_api_key(raw_key: str) -> dict | None:
    """Returns user payload dict if API key is valid, else None."""
    try:
        from app.models import get_db_cursor
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        with get_db_cursor(commit=True) as cursor:
            cursor.execute("""
                SELECT ak.user_id, ak.permissions, u.role, u.email, u.status
                FROM api_keys ak
                JOIN users u ON u.id = ak.user_id
                WHERE ak.key_hash = %s AND ak.is_active = true AND u.status = 'active'
            """, (key_hash,))
            row = cursor.fetchone()
            if not row:
                return None
            # Update last_used_at
            cursor.execute("UPDATE api_keys SET last_used_at = NOW() WHERE key_hash = %s", (key_hash,))
            return {
                'user_id': str(row['user_id']),
                'role': row['role'],
                'email': row['email'],
                'auth_method': 'api_key'
            }
    except Exception:
        return None


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # 1. Try API key first (X-API-Key header)
        api_key = request.headers.get('X-API-Key')
        if api_key:
            user_data = _verify_api_key(api_key)
            if user_data:
                request.current_user = user_data
                return f(*args, **kwargs)
            return jsonify({'error': 'Invalid or revoked API key'}), 401

        # 2. Try JWT (cookie or Authorization header)
        token = request.cookies.get('token') or request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Authentication required'}), 401

        try:
            data = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])

            # 3. Check token blacklist (for logged-out tokens)
            jti = data.get('jti')
            if jti and _is_token_blacklisted(jti):
                return jsonify({'error': 'Token has been invalidated. Please log in again.'}), 401

            request.current_user = data
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401

        return f(*args, **kwargs)
    return decorated
