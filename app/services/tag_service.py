from app.models import get_db_cursor


class TagService:

    @staticmethod
    def get_all_tags():
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT t.id, t.name, COUNT(tt.transaction_id) AS usage_count
                FROM tags t
                LEFT JOIN transaction_tags tt ON tt.tag_id = t.id
                GROUP BY t.id, t.name
                ORDER BY t.name ASC
            """)
            data = []
            for row in cursor.fetchall():
                r = dict(row)
                r['id'] = str(r['id'])
                data.append(r)
        return data

    @staticmethod
    def create_tag(name: str, user_id: str):
        name = name.strip().lower()
        with get_db_cursor(commit=True) as cursor:
            cursor.execute("SELECT id, name FROM tags WHERE name = %s", (name,))
            existing = cursor.fetchone()
            if existing:
                return dict(existing), False  # already exists

            cursor.execute("""
                INSERT INTO tags (name, created_by) VALUES (%s, %s)
                RETURNING id, name
            """, (name, user_id))
            row = dict(cursor.fetchone())
            row['id'] = str(row['id'])
        return row, True

    @staticmethod
    def delete_tag(tag_id: str):
        with get_db_cursor(commit=True) as cursor:
            cursor.execute("DELETE FROM tags WHERE id = %s RETURNING id", (tag_id,))
            return cursor.fetchone() is not None

    @staticmethod
    def get_transaction_tags(tx_id: str):
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT t.id, t.name FROM tags t
                JOIN transaction_tags tt ON tt.tag_id = t.id
                WHERE tt.transaction_id = %s
                ORDER BY t.name
            """, (tx_id,))
            return [{'id': str(r['id']), 'name': r['name']} for r in cursor.fetchall()]

    @staticmethod
    def set_transaction_tags(tx_id: str, tag_names: list, user_id: str):
        """Replace all tags for a transaction with the given list of tag names."""
        with get_db_cursor(commit=True) as cursor:
            # Remove existing
            cursor.execute("DELETE FROM transaction_tags WHERE transaction_id = %s", (tx_id,))

            tag_ids = []
            for name in tag_names:
                name = name.strip().lower()
                if not name:
                    continue
                cursor.execute("SELECT id FROM tags WHERE name = %s", (name,))
                row = cursor.fetchone()
                if row:
                    tag_ids.append(row['id'])
                else:
                    cursor.execute(
                        "INSERT INTO tags (name, created_by) VALUES (%s, %s) RETURNING id",
                        (name, user_id)
                    )
                    tag_ids.append(cursor.fetchone()['id'])

            for tid in tag_ids:
                cursor.execute(
                    "INSERT INTO transaction_tags (transaction_id, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                    (tx_id, tid)
                )
        return TagService.get_transaction_tags(tx_id)

    @staticmethod
    def get_transactions_by_tag(tag_name: str, page=1, per_page=20):
        offset = (page - 1) * per_page
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT t.id, t.amount, t.type, t.date, t.notes, c.name AS category_name
                FROM transactions t
                JOIN transaction_tags tt ON tt.transaction_id = t.id
                JOIN tags tag ON tag.id = tt.tag_id
                LEFT JOIN categories c ON c.id = t.category_id
                WHERE tag.name = %s AND t.is_deleted = false
                ORDER BY t.date DESC
                LIMIT %s OFFSET %s
            """, (tag_name.strip().lower(), per_page, offset))
            data = []
            for row in cursor.fetchall():
                r = dict(row)
                r['id'] = str(r['id'])
                r['amount'] = float(r['amount'])
                if r.get('date'):
                    r['date'] = r['date'].isoformat()
                data.append(r)
        return data
