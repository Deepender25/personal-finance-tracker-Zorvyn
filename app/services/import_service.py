import csv
import io
from app.models import get_db_cursor


class ImportService:

    @staticmethod
    def import_csv(file_stream, user_id: str) -> dict:
        """Parse a CSV file and bulk insert transactions. Returns import summary."""
        content = file_stream.read().decode('utf-8-sig')  # handle BOM
        reader = csv.DictReader(io.StringIO(content))

        required_cols = {'amount', 'type', 'date'}
        if not reader.fieldnames or not required_cols.issubset({c.strip().lower() for c in reader.fieldnames}):
            return {
                'success': 0, 'failed': 0,
                'errors': ['CSV must have columns: amount, type, date (optional: notes, category)'],
                'total': 0
            }

        # Normalize headers
        fieldnames_map = {c.strip().lower(): c for c in reader.fieldnames}

        success_rows = []
        errors = []
        row_num = 1

        for raw_row in reader:
            row_num += 1
            row = {k.strip().lower(): v.strip() for k, v in raw_row.items()}
            row_errors = []

            # Amount
            try:
                amount = float(row.get('amount', ''))
                if amount <= 0:
                    raise ValueError()
            except (ValueError, TypeError):
                row_errors.append(f"Row {row_num}: Invalid amount '{row.get('amount')}'")

            # Type
            tx_type = row.get('type', '').lower()
            if tx_type not in ('income', 'expense'):
                row_errors.append(f"Row {row_num}: Type must be 'income' or 'expense'")

            # Date
            from app.utils.validators import validate_date
            date_val = row.get('date', '')
            if not validate_date(date_val):
                row_errors.append(f"Row {row_num}: Invalid date '{date_val}'. Use YYYY-MM-DD")

            if row_errors:
                errors.extend(row_errors)
                continue

            success_rows.append({
                'amount': amount,
                'type': tx_type,
                'date': date_val,
                'notes': row.get('notes', None),
                'category_name': row.get('category', None)
            })

        if not success_rows:
            return {'success': 0, 'failed': row_num - 1, 'errors': errors, 'total': row_num - 1}

        # Resolve category names
        category_cache = {}
        with get_db_cursor() as cursor:
            cursor.execute("SELECT id, name FROM categories")
            for r in cursor.fetchall():
                category_cache[r['name'].lower()] = str(r['id'])

        inserted = 0
        insert_errors = []

        with get_db_cursor(commit=True) as cursor:
            for i, r in enumerate(success_rows):
                try:
                    cat_id = None
                    if r['category_name']:
                        cat_id = category_cache.get(r['category_name'].lower())

                    cursor.execute("""
                        INSERT INTO transactions (amount, type, category_id, date, notes, created_by)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (r['amount'], r['type'], cat_id, r['date'], r['notes'], user_id))
                    inserted += 1
                except Exception as e:
                    insert_errors.append(f"Row {i+2}: DB error — {str(e)[:80]}")

        all_errors = errors + insert_errors
        total = row_num - 1

        # Log import history
        try:
            with get_db_cursor(commit=True) as cursor:
                cursor.execute("""
                    INSERT INTO import_history (user_id, total_rows, success_rows, failed_rows, errors)
                    VALUES (%s, %s, %s, %s, %s)
                """, (
                    user_id, total, inserted,
                    total - inserted,
                    __import__('json').dumps(all_errors[:50])
                ))
        except Exception:
            pass

        return {
            'success': inserted,
            'failed': total - inserted,
            'total': total,
            'errors': all_errors[:50]
        }
