from app.models import get_db_cursor
from datetime import datetime

class DashboardService:
    
    @staticmethod
    def get_summary(date_from=None, date_to=None):
        query = """
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
                COUNT(*) as transaction_count,
                SUM(CASE WHEN type = 'income' THEN 1 ELSE 0 END) as income_count,
                SUM(CASE WHEN type = 'expense' THEN 1 ELSE 0 END) as expense_count
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
            res = dict(cursor.fetchone())
            
        res['netBalance'] = float(res['total_income'] - res['total_expense'])
        res['totalIncome'] = float(res['total_income'])
        res['totalExpenses'] = float(res['total_expense'])
        res['savingsRate'] = round((res['netBalance'] / res['totalIncome'] * 100) if res['totalIncome'] > 0 else 0, 1)
        return res

    @staticmethod
    def get_by_category(date_from=None, date_to=None, tx_type=None):
        query = """
            SELECT c.name as category, SUM(t.amount) as total, COUNT(t.id) as count
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.is_deleted = false
        """
        params = []
        if date_from:
            query += " AND t.date >= %s"
            params.append(date_from)
        if date_to:
            query += " AND t.date <= %s"
            params.append(date_to)
        if tx_type:
            query += " AND t.type = %s"
            params.append(tx_type)
            
        query += " GROUP BY c.name ORDER BY total DESC"
        
        with get_db_cursor() as cursor:
            cursor.execute(query, params)
            data = [dict(row) for row in cursor.fetchall()]
            
        for d in data:
            d['total'] = float(d['total'])
        return data

    @staticmethod
    def get_monthly_trend(year=None):
        if not year:
            year = datetime.now().year
            
        query = """
            SELECT 
                TO_CHAR(date, 'YYYY-MM') as month,
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
            FROM transactions
            WHERE EXTRACT(YEAR FROM date) = %s AND is_deleted = false
            GROUP BY TO_CHAR(date, 'YYYY-MM')
            ORDER BY month ASC
        """
        
        with get_db_cursor() as cursor:
            cursor.execute(query, (year,))
            data = [dict(row) for row in cursor.fetchall()]
            
        res_data = []
        months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        for d in data:
            net_balance = float(d['income'] - d['expense'])
            month_int = int(d['month'].split('-')[1])
            res_data.append({
                'name': months[month_int],
                'value': net_balance
            })
        return res_data

    @staticmethod
    def get_recent():
        query = """
            SELECT t.id, t.amount, t.type, t.date, t.notes, c.name as category_name
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.is_deleted = false
            ORDER BY t.date DESC, t.created_at DESC
            LIMIT 10
        """
        with get_db_cursor() as cursor:
            cursor.execute(query)
            data = [dict(row) for row in cursor.fetchall()]
            
        res_data = []
        for d in data:
            date_str = d['date'].strftime('%b %d, %Y') if d['date'] else ''
            amount_str = f"${float(d['amount']):,.2f}"
            
            res_data.append({
                'id': f"TXN-{d['id']}",
                'description': d['notes'] or d['category_name'] or 'Transaction',
                'date': date_str,
                'amount': amount_str,
                'type': d['type'].capitalize(),
                'status': 'Completed'
            })
        return res_data
