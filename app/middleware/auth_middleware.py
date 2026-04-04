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





def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
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
