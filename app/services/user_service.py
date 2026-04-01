import bcrypt
from app.models import get_db_cursor
from app.utils.validators import is_valid_email, is_strong_password

class UserService:
    
    @staticmethod
    def get_users(search=None, role=None, status=None, page=1, per_page=20):
        offset = (page - 1) * per_page
        
        query = """
            SELECT id, name, email, role, status, is_email_verified, created_at, last_login 
            FROM users WHERE 1=1
        """
        params = []
        
        if search:
            query += " AND (name ILIKE %s OR email ILIKE %s)"
            params.extend([f"%{search}%", f"%{search}%"])
            
        if role:
            query += " AND role = %s"
            params.append(role)
            
        if status:
            query += " AND status = %s"
            params.append(status)
            
        count_query = f"SELECT COUNT(*) FROM ({query}) AS count_tbl"
        
        with get_db_cursor() as cursor:
            cursor.execute(count_query, params)
            total = cursor.fetchone()[0]
            
            query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
            params.extend([per_page, offset])
            
            cursor.execute(query, params)
            data = [dict(row) for row in cursor.fetchall()]
            
        return {
            "data": data,
            "meta": {
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": (total + per_page - 1) // per_page
            }
        }

    @staticmethod
    def create_user(name, email, password, role):
        if not is_valid_email(email):
            return {"error": "Invalid email format."}, 400
        if not is_strong_password(password):
            return {"error": "Weak password."}, 400
            
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(12)).decode('utf-8')
        
        with get_db_cursor(commit=True) as cursor:
            cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cursor.fetchone():
                return {"error": "Email already exists."}, 400
                
            cursor.execute("""
                INSERT INTO users (name, email, password_hash, role, is_email_verified)
                VALUES (%s, %s, %s, %s, true)
                RETURNING id, name, email, role, status, created_at
            """, (name, email, password_hash, role))
            record = dict(cursor.fetchone())
            
        return record, 201

    @staticmethod
    def update_user(user_id, name=None, role=None, status=None, current_admin_id=None):
        if str(user_id) == str(current_admin_id) and role:
             return {"error": "You cannot change your own role."}, 403
             
        updates = []
        params = []
        
        if name:
            updates.append("name = %s")
            params.append(name)
        if role:
            updates.append("role = %s")
            params.append(role)
        if status:
            updates.append("status = %s")
            params.append(status)
            
        if not updates:
            return None, 400
            
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s RETURNING id, name, email, role, status"
        params.append(user_id)
        
        with get_db_cursor(commit=True) as cursor:
            cursor.execute(query, params)
            record = cursor.fetchone()
            
        return dict(record) if record else None, 200

    @staticmethod
    def deactivate_user(user_id, current_admin_id=None):
        if str(user_id) == str(current_admin_id):
            return {"error": "Cannot deactivate yourself."}, 403
            
        with get_db_cursor(commit=True) as cursor:
            cursor.execute("UPDATE users SET status = 'inactive' WHERE id = %s RETURNING id", (user_id,))
            record = cursor.fetchone()
            
        if record:
            return {"message": "User deactivated."}, 200
        return {"error": "User not found."}, 404
