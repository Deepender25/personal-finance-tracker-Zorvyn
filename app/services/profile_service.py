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

    @staticmethod
    def get_my_api_keys(user_id: str):
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT id, label, key_prefix, permissions, is_active, last_used_at, created_at
                FROM api_keys WHERE user_id = %s
                ORDER BY created_at DESC
            """, (user_id,))
            data = []
            for row in cursor.fetchall():
                r = dict(row)
                r['id'] = str(r['id'])
                if r.get('last_used_at'):
                    r['last_used_at'] = r['last_used_at'].isoformat()
                if r.get('created_at'):
                    r['created_at'] = r['created_at'].isoformat()
                data.append(r)
        return data

    @staticmethod
    def create_api_key(user_id: str, label: str, permissions: list = None):
        import secrets
        import hashlib
        raw_key = secrets.token_hex(32)
        prefix = raw_key[:8]
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        perms = permissions or ['read']

        with get_db_cursor(commit=True) as cursor:
            cursor.execute("""
                INSERT INTO api_keys (user_id, label, key_hash, key_prefix, permissions)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, label, key_prefix, permissions, created_at
            """, (user_id, label, key_hash, prefix, __import__('json').dumps(perms)))
            row = dict(cursor.fetchone())
            row['id'] = str(row['id'])
            if row.get('created_at'):
                row['created_at'] = row['created_at'].isoformat()

        return {**row, 'key': raw_key}  # key shown only once

    @staticmethod
    def revoke_api_key(key_id: str, user_id: str):
        with get_db_cursor(commit=True) as cursor:
            cursor.execute(
                "UPDATE api_keys SET is_active = false WHERE id = %s AND user_id = %s RETURNING id",
                (key_id, user_id)
            )
            return cursor.fetchone() is not None
