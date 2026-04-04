import bcrypt
from app.models import get_db_cursor
from app.utils.validators import is_strong_password


class ProfileService:

    @staticmethod
    def get_profile(user_id: str):
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT id, name, email, role, status, is_email_verified, created_at, last_login
                FROM users WHERE id = %s
            """, (user_id,))
            row = cursor.fetchone()
        if not row:
            return None
        r = dict(row)
        r['id'] = str(r['id'])
        if r.get('created_at'):
            r['created_at'] = r['created_at'].isoformat()
        if r.get('last_login'):
            r['last_login'] = r['last_login'].isoformat()
        del r['is_email_verified']  # don't expose
        return r

    @staticmethod
    def update_profile(user_id: str, name: str = None, current_password: str = None, new_password: str = None):
        updates = []
        params = []

        if name and name.strip():
            updates.append("name = %s")
            params.append(name.strip())

        if new_password:
            if not current_password:
                return {'error': 'Current password is required to change password.'}, 400
            if not is_strong_password(new_password):
                return {'error': 'New password must be at least 8 chars with 1 uppercase, 1 lowercase, 1 number.'}, 400

            with get_db_cursor() as cursor:
                cursor.execute("SELECT password_hash FROM users WHERE id = %s", (user_id,))
                row = cursor.fetchone()
            if not row:
                return {'error': 'User not found.'}, 404
            if not bcrypt.checkpw(current_password.encode('utf-8'), row['password_hash'].encode('utf-8')):
                return {'error': 'Current password is incorrect.'}, 403

            new_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt(12)).decode('utf-8')
            updates.append("password_hash = %s")
            params.append(new_hash)

        if not updates:
            return {'error': 'No fields to update.'}, 400

        params.append(user_id)
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s RETURNING id, name, email, role, status"
        with get_db_cursor(commit=True) as cursor:
            cursor.execute(query, params)
            row = cursor.fetchone()
        if not row:
            return {'error': 'User not found.'}, 404

        result = dict(row)
        result['id'] = str(result['id'])
        return result, 200

    @staticmethod
    def get_my_activity(user_id: str, limit=20):
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT id, action, entity_type, entity_id, ip_address, created_at
                FROM audit_logs
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT %s
            """, (user_id, limit))
            data = []
            for row in cursor.fetchall():
                r = dict(row)
                r['id'] = str(r['id'])
                if r.get('entity_id'):
                    r['entity_id'] = str(r['entity_id'])
                if r.get('created_at'):
                    r['created_at'] = r['created_at'].isoformat()
                data.append(r)
        return data


