from app.models import get_db_cursor
from flask import request
import threading

def log_action(
    action: str,
    entity_type: str = None,
    entity_id: str = None,
    old_value: dict = None,
    new_value: dict = None,
    user_id: str = None,
    user_email: str = None
):
    """Log an audit action. Safe to call from any route — runs in background thread."""
    try:
        # Try to get user info from request context if not explicitly provided
        if user_id is None:
            try:
                user_id = getattr(request, 'current_user', {}).get('user_id')
            except RuntimeError:
                pass
        if user_email is None:
            try:
                user_email = getattr(request, 'current_user', {}).get('email')
            except RuntimeError:
                pass

        try:
            ip_address = request.remote_addr if request else None
            user_agent = request.headers.get('User-Agent', '')[:500] if request else None
        except RuntimeError:
            ip_address = None
            user_agent = None

        def _write():
            try:
                with get_db_cursor(commit=True) as cursor:
                    cursor.execute("""
                        INSERT INTO audit_logs 
                            (user_id, user_email, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        user_id, user_email, action,
                        entity_type, entity_id,
                        __import__('json').dumps(old_value) if old_value else None,
                        __import__('json').dumps(new_value) if new_value else None,
                        ip_address, user_agent
                    ))
            except Exception as e:
                print(f"[Audit] Failed to write log: {e}")

        # Run in background so it never blocks the main request
        t = threading.Thread(target=_write, daemon=True)
        t.start()

    except Exception as e:
        print(f"[Audit] Error: {e}")


class AuditService:

    @staticmethod
    def get_logs(user_id_filter=None, action_filter=None, entity_type_filter=None,
                 date_from=None, date_to=None, page=1, per_page=50):
        offset = (page - 1) * per_page

        query = """
            SELECT id, user_id, user_email, action, entity_type, entity_id,
                   old_value, new_value, ip_address, created_at
            FROM audit_logs WHERE 1=1
        """
        params = []

        if user_id_filter:
            query += " AND user_id = %s"
            params.append(user_id_filter)
        if action_filter:
            query += " AND action ILIKE %s"
            params.append(f"%{action_filter}%")
        if entity_type_filter:
            query += " AND entity_type = %s"
            params.append(entity_type_filter)
        if date_from:
            query += " AND created_at >= %s"
            params.append(date_from)
        if date_to:
            query += " AND created_at <= %s"
            params.append(date_to)

        count_query = f"SELECT COUNT(*) FROM ({query}) AS c"

        with get_db_cursor() as cursor:
            cursor.execute(count_query, params)
            total = cursor.fetchone()[0]

            query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
            params.extend([per_page, offset])

            cursor.execute(query, params)
            data = []
            for row in cursor.fetchall():
                r = dict(row)
                r['id'] = str(r['id'])
                if r.get('user_id'):
                    r['user_id'] = str(r['user_id'])
                if r.get('entity_id'):
                    r['entity_id'] = str(r['entity_id'])
                if r.get('created_at'):
                    r['created_at'] = r['created_at'].isoformat()
                data.append(r)

        return {
            "data": data,
            "meta": {
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": (total + per_page - 1) // per_page
            }
        }
