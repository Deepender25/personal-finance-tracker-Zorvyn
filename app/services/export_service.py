import csv
import io
from flask import Response
from app.models import get_db_cursor


class ExportService:

    @staticmethod
    def export_transactions_csv(
        type_filter=None, category_id=None,
        date_from=None, date_to=None, search=None
    ) -> Response:
        """Stream a CSV download of all matching transactions (no pagination)."""

        query = """
            SELECT 
                t.id, t.date, t.type, t.amount, 
                COALESCE(c.name, '') AS category,
                COALESCE(t.notes, '') AS notes,
                t.created_at
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
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
            query += " AND t.notes ILIKE %s"
            params.append(f"%{search}%")

        query += " ORDER BY t.date DESC, t.created_at DESC"

        with get_db_cursor() as cursor:
            cursor.execute(query, params)
            rows = cursor.fetchall()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['ID', 'Date', 'Type', 'Amount', 'Category', 'Notes', 'Created At'])

        for row in rows:
            writer.writerow([
                str(row['id']),
                row['date'].isoformat() if row['date'] else '',
                row['type'],
                float(row['amount']),
                row['category'],
                row['notes'],
                row['created_at'].isoformat() if row['created_at'] else ''
            ])

        output.seek(0)

        return Response(
            output.getvalue(),
            mimetype='text/csv',
            headers={
                'Content-Disposition': 'attachment; filename=transactions_export.csv',
                'Content-Type': 'text/csv; charset=utf-8'
            }
        )
