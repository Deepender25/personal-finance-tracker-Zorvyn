from app.models import get_db_cursor
from datetime import datetime


class AnalyticsService:

    @staticmethod
    def get_top_categories(tx_type='expense', limit=10, date_from=None, date_to=None):
        query = """
            SELECT 
                COALESCE(c.name, 'Uncategorized') AS category,
                SUM(t.amount) AS total,
                COUNT(t.id) AS count,
                ROUND(100.0 * SUM(t.amount) / NULLIF(SUM(SUM(t.amount)) OVER (), 0), 2) AS percentage
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.is_deleted = false AND t.type = %s
        """
        params = [tx_type]

        if date_from:
            query += " AND t.date >= %s"
            params.append(date_from)
        if date_to:
            query += " AND t.date <= %s"
            params.append(date_to)

        query += " GROUP BY c.name ORDER BY total DESC LIMIT %s"
        params.append(limit)

        with get_db_cursor() as cursor:
            cursor.execute(query, params)
            data = []
            for row in cursor.fetchall():
                r = dict(row)
                r['total'] = float(r['total'])
                r['percentage'] = float(r['percentage'] or 0)
                data.append(r)
        return data

    @staticmethod
    def get_daily_trend(month: str):
        """month format: YYYY-MM"""
        try:
            year, mon = map(int, month.split('-'))
        except (ValueError, AttributeError):
            year, mon = datetime.now().year, datetime.now().month

        query = """
            SELECT
                date::text AS day,
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
            FROM transactions
            WHERE is_deleted = false
              AND EXTRACT(YEAR FROM date) = %s
              AND EXTRACT(MONTH FROM date) = %s
            GROUP BY date
            ORDER BY date ASC
        """
        with get_db_cursor() as cursor:
            cursor.execute(query, (year, mon))
            data = []
            for row in cursor.fetchall():
                r = dict(row)
                r['income'] = float(r['income'])
                r['expense'] = float(r['expense'])
                r['net'] = r['income'] - r['expense']
                data.append(r)
        return data

    @staticmethod
    def get_yoy_comparison(year: int):
        """Year-over-year: compare `year` vs `year-1`."""
        prev_year = year - 1
        query = """
            SELECT
                EXTRACT(YEAR FROM date)::int AS year,
                TO_CHAR(date, 'Month') AS month_name,
                EXTRACT(MONTH FROM date)::int AS month_num,
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
            FROM transactions
            WHERE is_deleted = false
              AND EXTRACT(YEAR FROM date) IN (%s, %s)
            GROUP BY EXTRACT(YEAR FROM date), TO_CHAR(date, 'Month'), EXTRACT(MONTH FROM date)
            ORDER BY year, month_num
        """
        with get_db_cursor() as cursor:
            cursor.execute(query, (year, prev_year))
            rows = [dict(r) for r in cursor.fetchall()]

        # Structure as {month_num: {year: {income, expense}}}
        result = {m: {year: {'income': 0, 'expense': 0}, prev_year: {'income': 0, 'expense': 0}} for m in range(1, 13)}
        months_labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

        for row in rows:
            mn = int(row['month_num'])
            yr = int(row['year'])
            result[mn][yr]['income'] = float(row['income'])
            result[mn][yr]['expense'] = float(row['expense'])

        output = []
        for mn in range(1, 13):
            output.append({
                'month': months_labels[mn - 1],
                'month_num': mn,
                f'income_{year}': result[mn][year]['income'],
                f'expense_{year}': result[mn][year]['expense'],
                f'income_{prev_year}': result[mn][prev_year]['income'],
                f'expense_{prev_year}': result[mn][prev_year]['expense'],
            })
        return {'data': output, 'year': year, 'prev_year': prev_year}

    @staticmethod
    def get_savings_rate(date_from=None, date_to=None):
        query = """
            SELECT
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
            FROM transactions
            WHERE is_deleted = false
        """
        params = []
        if date_from:
            query += " AND date >= %s"
            params.append(date_from)
        if date_to:
            query += " AND date <= %s"
            params.append(date_to)

        with get_db_cursor() as cursor:
            cursor.execute(query, params)
            row = dict(cursor.fetchone())

        income = float(row['total_income'])
        expense = float(row['total_expense'])
        net = income - expense
        rate = round((net / income * 100), 2) if income > 0 else 0.0
        return {
            'total_income': income,
            'total_expense': expense,
            'net_savings': net,
            'savings_rate_pct': rate
        }

    @staticmethod
    def get_expense_heatmap(year: int):
        """Returns daily expense totals for the year — useful for heatmap charts."""
        query = """
            SELECT date::text AS day, SUM(amount) AS total
            FROM transactions
            WHERE is_deleted = false AND type = 'expense'
              AND EXTRACT(YEAR FROM date) = %s
            GROUP BY date
            ORDER BY date
        """
        with get_db_cursor() as cursor:
            cursor.execute(query, (year,))
            return [{'day': r['day'], 'total': float(r['total'])} for r in cursor.fetchall()]
