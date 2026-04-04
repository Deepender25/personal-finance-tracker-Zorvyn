from app.models import get_db_cursor
from datetime import datetime, timezone


class BudgetService:

    @staticmethod
    def get_budgets():
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT b.id, b.amount_limit, b.period, b.updated_at,
                       c.id AS category_id, c.name AS category_name
                FROM budgets b
                JOIN categories c ON b.category_id = c.id
                ORDER BY c.name ASC
            """)
            data = []
            for row in cursor.fetchall():
                r = dict(row)
                r['id'] = str(r['id'])
                r['category_id'] = str(r['category_id'])
                r['amount_limit'] = float(r['amount_limit'])
                if r.get('updated_at'):
                    r['updated_at'] = r['updated_at'].isoformat()
                data.append(r)
        return data

    @staticmethod
    def get_budget_status():
        """Returns each budget with actual spending and percent used."""
        now = datetime.now(timezone.utc)
        month_start = now.strftime('%Y-%m-01')
        year_start  = now.strftime('%Y-01-01')
        month_end   = now.strftime('%Y-%m-%d')

        query = """
            SELECT 
                b.id, b.amount_limit, b.period,
                c.id AS category_id, c.name AS category_name,
                COALESCE(
                    SUM(t.amount) FILTER (
                        WHERE t.is_deleted = false AND t.type = 'expense'
                        AND (
                            (b.period = 'monthly' AND t.date >= %s AND t.date <= %s) OR
                            (b.period = 'yearly'  AND t.date >= %s AND t.date <= %s)
                        )
                    ), 0
                ) AS actual_spend
            FROM budgets b
            JOIN categories c ON b.category_id = c.id
            LEFT JOIN transactions t ON t.category_id = b.category_id
            GROUP BY b.id, b.amount_limit, b.period, c.id, c.name
            ORDER BY c.name ASC
        """
        with get_db_cursor() as cursor:
            cursor.execute(query, (month_start, month_end, year_start, month_end))
            data = []
            for row in cursor.fetchall():
                r = dict(row)
                r['id'] = str(r['id'])
                r['category_id'] = str(r['category_id'])
                r['amount_limit'] = float(r['amount_limit'])
                r['actual_spend'] = float(r['actual_spend'])
                r['remaining'] = max(0.0, r['amount_limit'] - r['actual_spend'])
                r['pct_used'] = round(min(100.0, r['actual_spend'] / r['amount_limit'] * 100), 1) if r['amount_limit'] > 0 else 0.0
                r['status'] = 'over' if r['actual_spend'] > r['amount_limit'] else ('warning' if r['pct_used'] >= 80 else 'ok')
                data.append(r)
        return data

    @staticmethod
    def create_budget(category_id, amount_limit, period, user_id):
        with get_db_cursor(commit=True) as cursor:
            # Upsert — replace if same category+period already exists
            cursor.execute("""
                INSERT INTO budgets (category_id, amount_limit, period, created_by)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (category_id, period)
                DO UPDATE SET amount_limit = EXCLUDED.amount_limit, updated_at = NOW()
                RETURNING id, category_id, amount_limit, period
            """, (category_id, amount_limit, period, user_id))
            row = dict(cursor.fetchone())
            row['id'] = str(row['id'])
            row['category_id'] = str(row['category_id'])
            row['amount_limit'] = float(row['amount_limit'])
        return row

    @staticmethod
    def delete_budget(budget_id):
        with get_db_cursor(commit=True) as cursor:
            cursor.execute("DELETE FROM budgets WHERE id = %s RETURNING id", (budget_id,))
            return cursor.fetchone() is not None
