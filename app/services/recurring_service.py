from app.models import get_db_cursor
from datetime import date, timedelta


class RecurringService:

    @staticmethod
    def get_recurring_templates(page=1, per_page=20):
        offset = (page - 1) * per_page
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT t.id, t.amount, t.type, t.recurrence_interval, t.next_due_date, t.notes,
                       c.name AS category_name
                FROM transactions t
                LEFT JOIN categories c ON t.category_id = c.id
                WHERE t.is_recurring = true AND t.is_deleted = false AND t.parent_tx_id IS NULL
                ORDER BY t.next_due_date ASC NULLS LAST
                LIMIT %s OFFSET %s
            """, (per_page, offset))
            data = []
            for row in cursor.fetchall():
                r = dict(row)
                r['id'] = str(r['id'])
                r['amount'] = float(r['amount'])
                if r.get('next_due_date'):
                    r['next_due_date'] = r['next_due_date'].isoformat()
                data.append(r)
        return data

    @staticmethod
    def create_recurring(amount, tx_type, category_id, start_date, interval, notes, user_id):
        """Creates a recurring transaction template."""
        with get_db_cursor(commit=True) as cursor:
            cursor.execute("""
                INSERT INTO transactions 
                    (amount, type, category_id, date, notes, created_by, is_recurring, recurrence_interval, next_due_date)
                VALUES (%s, %s, %s, %s, %s, %s, true, %s, %s)
                RETURNING id, amount, type, date, notes, recurrence_interval, next_due_date
            """, (amount, tx_type, category_id, start_date, notes, user_id, interval, start_date))
            row = dict(cursor.fetchone())
            row['id'] = str(row['id'])
            row['amount'] = float(row['amount'])
            if row.get('date'):
                row['date'] = row['date'].isoformat()
            if row.get('next_due_date'):
                row['next_due_date'] = row['next_due_date'].isoformat()
        return row

    @staticmethod
    def process_due_recurring(user_id: str):
        """Create actual transaction instances for all templates with next_due_date <= today."""
        today = date.today()
        processed = []
        errors = []

        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT id, amount, type, category_id, notes, recurrence_interval, next_due_date
                FROM transactions
                WHERE is_recurring = true AND is_deleted = false
                  AND parent_tx_id IS NULL AND next_due_date <= %s
            """, (today,))
            templates = [dict(r) for r in cursor.fetchall()]

        for tmpl in templates:
            try:
                with get_db_cursor(commit=True) as cursor:
                    # Create actual transaction
                    cursor.execute("""
                        INSERT INTO transactions (amount, type, category_id, date, notes, created_by, parent_tx_id)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        RETURNING id
                    """, (
                        tmpl['amount'], tmpl['type'], tmpl['category_id'],
                        tmpl['next_due_date'], tmpl['notes'], user_id, tmpl['id']
                    ))
                    new_tx = cursor.fetchone()

                    # Advance next_due_date
                    interval = tmpl['recurrence_interval']
                    due = tmpl['next_due_date']
                    if isinstance(due, str):
                        due = date.fromisoformat(due)

                    if interval == 'daily':
                        next_due = due + timedelta(days=1)
                    elif interval == 'weekly':
                        next_due = due + timedelta(weeks=1)
                    elif interval == 'monthly':
                        month = due.month + 1
                        year = due.year + (1 if month > 12 else 0)
                        month = ((month - 1) % 12) + 1
                        next_due = due.replace(year=year, month=month)
                    elif interval == 'yearly':
                        next_due = due.replace(year=due.year + 1)
                    else:
                        next_due = due + timedelta(days=30)

                    cursor.execute(
                        "UPDATE transactions SET next_due_date = %s WHERE id = %s",
                        (next_due, tmpl['id'])
                    )
                    processed.append({'template_id': str(tmpl['id']), 'new_tx_id': str(new_tx['id'])})
            except Exception as e:
                errors.append({'template_id': str(tmpl['id']), 'error': str(e)[:100]})

        return {'processed': len(processed), 'errors': errors, 'details': processed}

    @staticmethod
    def delete_recurring(tx_id: str):
        """Soft-delete a recurring template."""
        with get_db_cursor(commit=True) as cursor:
            cursor.execute("""
                UPDATE transactions SET is_deleted = true, deleted_at = NOW()
                WHERE id = %s AND is_recurring = true AND parent_tx_id IS NULL
                RETURNING id
            """, (tx_id,))
            return cursor.fetchone() is not None
