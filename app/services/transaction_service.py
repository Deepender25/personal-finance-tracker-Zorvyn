from app.models import get_db_cursor
from datetime import datetime

class TransactionService:
    
    @staticmethod
    def get_transactions(type_filter=None, category_id=None, date_from=None, date_to=None, search=None, page=1, per_page=20):
        offset = (page - 1) * per_page
        
        query = """
            SELECT t.id, t.amount, t.type, t.date, t.notes, t.category_id, 
                   c.name as category_name, t.created_at, t.updated_at,
                   ARRAY_REMOVE(ARRAY_AGG(tg.name), NULL) as tags
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN transaction_tags tt ON t.id = tt.transaction_id
            LEFT JOIN tags tg ON tt.tag_id = tg.id
            WHERE t.is_deleted = false
        """
        params = []
        
        if type_filter:
            query += " AND t.type = %s"
            params.append(type_filter)
            
        if category_id:
            query += " AND t.category_id = %s"
            params.append(category_id)
            
        if date_from:
            query += " AND t.date >= %s"
            params.append(date_from)
            
        if date_to:
            query += " AND t.date <= %s"
            params.append(date_to)
            
        if search:
            query += " AND (t.notes ILIKE %s)"
            params.append(f"%{search}%")
            
        query += " GROUP BY t.id, c.name"
        
        # Count total (use subquery for count because of group by)
        count_query = f"SELECT COUNT(*) FROM ({query}) AS count_tbl"
        
        with get_db_cursor() as cursor:
            cursor.execute(count_query, params)
            total = cursor.fetchone()[0]
            
            # Fetch paginated data
            query += " ORDER BY t.date DESC, t.created_at DESC LIMIT %s OFFSET %s"
            params.extend([per_page, offset])
            
            cursor.execute(query, params)
            data = [dict(row) for row in cursor.fetchall()]
            for item in data:
                item['id'] = str(item['id'])
                item['amount'] = float(item['amount'])
            
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
    def get_transaction(tx_id):
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT t.id, t.amount, t.type, t.date, t.notes, t.category_id, c.name as category_name,
                       ARRAY_REMOVE(ARRAY_AGG(tg.name), NULL) as tags
                FROM transactions t
                LEFT JOIN categories c ON t.category_id = c.id
                LEFT JOIN transaction_tags tt ON t.id = tt.transaction_id
                LEFT JOIN tags tg ON tt.tag_id = tg.id
                WHERE t.id = %s AND t.is_deleted = false
                GROUP BY t.id, c.name
            """, (tx_id,))
            record = cursor.fetchone()
            if record:
                res = dict(record)
                res['id'] = str(res['id'])
                res['amount'] = float(res['amount'])
                return res
            return None

    @staticmethod
    def create_transaction(amount, tx_type, category_id, date, notes, user_id, tags=None):
        with get_db_cursor(commit=True) as cursor:
            cursor.execute("""
                INSERT INTO transactions (amount, type, category_id, date, notes, created_by)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, amount, type, date, notes, category_id, created_at, updated_at
            """, (amount, tx_type, category_id, date, notes, user_id))
            record = dict(cursor.fetchone())
            tx_id = record['id']
            record['id'] = str(tx_id)
            record['amount'] = float(record['amount'])

            # Handle tags
            if tags and isinstance(tags, list):
                from app.services.tag_service import TagService
                for tag_name in tags:
                    tag, _ = TagService.create_tag(tag_name, user_id)
                    cursor.execute(
                        "INSERT INTO transaction_tags (transaction_id, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                        (tx_id, tag['id'])
                    )
                record['tags'] = tags
            else:
                record['tags'] = []
            
        return record

    @staticmethod
    def update_transaction(tx_id, amount, tx_type, category_id, date, notes, user_id, tags=None):
        with get_db_cursor(commit=True) as cursor:
            cursor.execute("""
                UPDATE transactions
                SET amount = %s, type = %s, category_id = %s, date = %s, notes = %s, updated_at = NOW()
                WHERE id = %s AND is_deleted = false
                RETURNING id, amount, type, date, notes, category_id, created_at, updated_at
            """, (amount, tx_type, category_id, date, notes, tx_id))
            row = cursor.fetchone()
            if not row:
                return None
            
            record = dict(row)
            record['id'] = str(tx_id)
            record['amount'] = float(record['amount'])

            if tags is not None and isinstance(tags, list):
                # Remove old tags
                cursor.execute("DELETE FROM transaction_tags WHERE transaction_id = %s", (tx_id,))
                # Add new tags
                from app.services.tag_service import TagService
                for tag_name in tags:
                    tag, _ = TagService.create_tag(tag_name, user_id)
                    cursor.execute(
                        "INSERT INTO transaction_tags (transaction_id, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                        (tx_id, tag['id'])
                    )
                record['tags'] = tags
            
        return record

    @staticmethod
    def delete_transaction(tx_id):
        with get_db_cursor(commit=True) as cursor:
            cursor.execute("""
                UPDATE transactions
                SET is_deleted = true, deleted_at = NOW()
                WHERE id = %s AND is_deleted = false
                RETURNING id
            """, (tx_id,))
            deleted = cursor.fetchone()
            
        return deleted is not None
