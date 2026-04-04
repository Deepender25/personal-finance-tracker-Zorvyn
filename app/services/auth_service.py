import bcrypt
import jwt
import uuid
from datetime import datetime, timedelta, timezone
from app.config import Config
from app.models import get_db_cursor
from app.utils.validators import is_valid_email, is_strong_password
from app.utils.otp import generate_otp
from app.services.email_service import send_otp_email

class AuthService:
    
    @staticmethod
    def register_user(name, email, password):
        if not is_valid_email(email):
            return {"error": "Invalid email format."}, 400
        if not is_strong_password(password):
            return {"error": "Password must be at least 8 characters, with 1 uppercase, 1 lowercase, and 1 number."}, 400

        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(12)).decode('utf-8')
        
        with get_db_cursor(commit=True) as cursor:
            cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cursor.fetchone():
                return {"error": "Email already exists."}, 400
            
            cursor.execute("""
                INSERT INTO users (name, email, password_hash, is_email_verified)
                VALUES (%s, %s, %s, false) RETURNING id
            """, (name, email, password_hash))
            
            otp = generate_otp()
            expiry = datetime.now(timezone.utc) + timedelta(minutes=Config.OTP_EXPIRY_MINUTES)
            
            cursor.execute("""
                INSERT INTO otps (email, otp_code, purpose, expires_at)
                VALUES (%s, %s, 'verify_email', %s)
            """, (email, otp, expiry))
            
        send_otp_email(email, otp, 'verify_email')
        return {"message": "OTP sent to email.", "data": {"email": email}}, 200

    @staticmethod
    def verify_email(email, otp):
        with get_db_cursor(commit=True) as cursor:
            cursor.execute("""
                SELECT id FROM otps 
                WHERE email = %s AND otp_code = %s AND purpose = 'verify_email' 
                AND is_used = false AND expires_at > NOW()
            """, (email, otp))
            
            otp_record = cursor.fetchone()
            if not otp_record:
                return {"error": "Invalid or expired OTP."}, 400
            
            cursor.execute("UPDATE otps SET is_used = true WHERE id = %s", (otp_record['id'],))
            cursor.execute("UPDATE users SET is_email_verified = true WHERE email = %s", (email,))
            
        return {"message": "Email verified. You can now log in."}, 200

    @staticmethod
    def login(email, password):
        with get_db_cursor(commit=True) as cursor:
            cursor.execute("SELECT id, name, email, role, password_hash, status, is_email_verified FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()
            
            if not user:
                return {"error": "Invalid email or password."}, 400
            
            if user['status'] == 'inactive':
                return {"error": "Account is deactivated. Contact admin."}, 403
            
            if not user['is_email_verified']:
                return {"error": "Please verify your email first.", "requires_verification": True, "email": email}, 403
            
            if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
                return {"error": "Invalid email or password."}, 400
            
            cursor.execute("UPDATE users SET last_login = NOW() WHERE id = %s", (user['id'],))
            
            # Generate Token with jti for blacklist support
            jti = str(uuid.uuid4())
            expiry_time = datetime.now(timezone.utc) + timedelta(hours=Config.JWT_EXPIRY_HOURS)
            payload = {
                'user_id': str(user['id']),
                'name': user['name'],
                'role': user['role'],
                'email': user['email'],
                'jti': jti,
                'exp': expiry_time,
                'iat': datetime.now(timezone.utc)
            }
            token = jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm='HS256')
            
            user_data = {
                "id": str(user['id']),
                "name": user['name'],
                "email": user['email'],
                "role": user['role']
            }
            
        # Audit log login (fire and forget)
        try:
            from app.services.audit_service import log_action
            log_action('auth.login', 'user', str(user['id']),
                      user_id=str(user['id']), user_email=email)
        except Exception:
            pass
            
        return {"message": "Login successful", "data": {"token": token, "user": user_data}}, 200

    @staticmethod
    def forgot_password(email):
        with get_db_cursor(commit=True) as cursor:
            otp = generate_otp()
            expiry = datetime.now(timezone.utc) + timedelta(minutes=Config.OTP_EXPIRY_MINUTES)
            cursor.execute("""
                INSERT INTO otps (email, otp_code, purpose, expires_at)
                VALUES (%s, %s, 'reset_password', %s)
            """, (email, otp, expiry))
            
        send_otp_email(email, otp, 'reset_password')
        return {"message": "If the email exists, OTP has been sent."}, 200

    @staticmethod
    def reset_password(email, otp, new_password):
        if not is_strong_password(new_password):
            return {"error": "Password must be at least 8 characters, with 1 uppercase, 1 lowercase, and 1 number."}, 400
            
        with get_db_cursor(commit=True) as cursor:
            cursor.execute("""
                SELECT id FROM otps 
                WHERE email = %s AND otp_code = %s AND purpose = 'reset_password' 
                AND is_used = false AND expires_at > NOW()
            """, (email, otp))
            
            otp_record = cursor.fetchone()
            if not otp_record:
                return {"error": "Invalid or expired OTP."}, 400
            
            password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt(12)).decode('utf-8')
            cursor.execute("UPDATE users SET password_hash = %s WHERE email = %s", (password_hash, email))
            cursor.execute("UPDATE otps SET is_used = true WHERE id = %s", (otp_record['id'],))
            
        return {"message": "Password reset successful."}, 200

    @staticmethod
    def logout(token: str):
        """Blacklist the JWT so it can't be used again."""
        try:
            data = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
            jti = data.get('jti')
            exp = datetime.fromtimestamp(data['exp'], tz=timezone.utc)
            user_id = data.get('user_id')
            
            if jti:
                with get_db_cursor(commit=True) as cursor:
                    cursor.execute("""
                        INSERT INTO token_blacklist (jti, user_id, expires_at)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (jti) DO NOTHING
                    """, (jti, user_id, exp))
                    
            # Audit
            try:
                from app.services.audit_service import log_action
                log_action('auth.logout', 'user', user_id, user_id=user_id)
            except Exception:
                pass
        except Exception:
            pass  # Token already invalid — fine
