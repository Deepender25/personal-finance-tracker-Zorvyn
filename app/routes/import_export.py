from flask import Blueprint, request
from app.services.import_service import ImportService
from app.services.export_service import ExportService
from app.services.recurring_service import RecurringService
from app.middleware.rbac import roles_required
from app.utils.response import success, error
from app.utils.validators import validate_date, is_valid_uuid
from app.services.audit_service import log_action

import_export_bp = Blueprint('import_export', __name__)

# ─────────────────────────────────────────────────────────────
# EXPORT
# ─────────────────────────────────────────────────────────────

@import_export_bp.route('/export/csv', methods=['GET'])
@roles_required('analyst', 'admin')
def export_csv():
    type_filter  = request.args.get('type')
    category_id  = request.args.get('category_id')
    date_from    = request.args.get('date_from')
    date_to      = request.args.get('date_to')
    search       = request.args.get('search')

    if type_filter and type_filter not in ('income', 'expense'):
        return error("Type must be 'income' or 'expense'.", 400)
    if category_id and not is_valid_uuid(category_id):
        return error("Invalid category_id.", 400)

    log_action('transactions.export_csv', 'transaction')
    return ExportService.export_transactions_csv(type_filter, category_id, date_from, date_to, search)


# ─────────────────────────────────────────────────────────────
# IMPORT
# ─────────────────────────────────────────────────────────────

@import_export_bp.route('/import/csv', methods=['POST'])
@roles_required('admin')
def import_csv():
    if 'file' not in request.files:
        return error("No file provided. Use multipart/form-data with field name 'file'.", 400)

    f = request.files['file']
    if not f.filename or not f.filename.lower().endswith('.csv'):
        return error("Only CSV files (.csv) are supported.", 400)

    result = ImportService.import_csv(f.stream, request.current_user['user_id'])
    log_action('transactions.import_csv', 'transaction',
               new_value={'success': result['success'], 'failed': result['failed']})
    status = 200 if result['success'] > 0 else 422
    return success(data=result, status=status)


# ─────────────────────────────────────────────────────────────
# RECURRING TRANSACTIONS
# ─────────────────────────────────────────────────────────────

@import_export_bp.route('/recurring', methods=['GET'])
@roles_required('analyst', 'admin')
def get_recurring():
    page     = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    data = RecurringService.get_recurring_templates(page, per_page)
    return success(data=data)


@import_export_bp.route('/recurring', methods=['POST'])
@roles_required('admin')
def create_recurring():
    data = request.get_json()
    if not data:
        return error("Missing request body.", 400)

    amount      = data.get('amount')
    tx_type     = data.get('type')
    start_date  = data.get('start_date')
    interval    = data.get('interval')
    notes       = data.get('notes')
    category_id = data.get('category_id')

    if not amount or not tx_type or not start_date or not interval:
        return error("amount, type, start_date, and interval are required.", 400)

    try:
        amount = float(amount)
        if amount <= 0:
            raise ValueError()
    except (ValueError, TypeError):
        return error("Amount must be a positive number.", 400)

    if tx_type not in ('income', 'expense'):
        return error("Type must be 'income' or 'expense'.", 400)

    if not validate_date(start_date):
        return error("Invalid start_date. Use YYYY-MM-DD.", 400)

    if interval not in ('daily', 'weekly', 'monthly', 'yearly'):
        return error("Interval must be daily, weekly, monthly, or yearly.", 400)

    if category_id and not is_valid_uuid(category_id):
        return error("Invalid category_id.", 400)

    result = RecurringService.create_recurring(
        amount, tx_type, category_id, start_date, interval, notes,
        request.current_user['user_id']
    )
    log_action('recurring.create', 'transaction', result['id'], new_value=result)
    return success(data=result, status=201)


@import_export_bp.route('/recurring/process', methods=['POST'])
@roles_required('admin')
def process_recurring():
    result = RecurringService.process_due_recurring(request.current_user['user_id'])
    log_action('recurring.process', 'transaction', new_value={'processed': result['processed']})
    return success(data=result)


@import_export_bp.route('/recurring/<tx_id>', methods=['DELETE'])
@roles_required('admin')
def delete_recurring(tx_id):
    if not is_valid_uuid(tx_id):
        return error("Invalid transaction ID.", 400)
    deleted = RecurringService.delete_recurring(tx_id)
    if not deleted:
        return error("Recurring template not found.", 404)
    log_action('recurring.delete', 'transaction', tx_id)
    return success(message="Recurring template deleted.")
