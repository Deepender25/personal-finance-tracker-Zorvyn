from flask import Blueprint, request
from app.services.recurring_service import RecurringService
from app.middleware.rbac import roles_required
from app.utils.response import success, error
from app.utils.validators import is_valid_uuid, validate_date

recurring_bp = Blueprint('recurring', __name__)


@recurring_bp.route('', methods=['GET'])
@roles_required('viewer', 'analyst', 'admin')
def get_recurring():
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    data = RecurringService.get_recurring_templates(page=page, per_page=per_page)
    return success(data=data)


@recurring_bp.route('', methods=['POST'])
@roles_required('admin')
def create_recurring():
    data = request.get_json()
    if not data:
        return error("Missing request body.", 400)

    amount = data.get('amount')
    tx_type = data.get('type')
    start_date = data.get('start_date')
    interval = data.get('interval')

    if not amount or not tx_type or not start_date or not interval:
        return error("amount, type, start_date, and interval are required.", 400)

    try:
        amount = float(amount)
        if amount <= 0:
            raise ValueError()
    except (ValueError, TypeError):
        return error("amount must be a positive number.", 400)

    if tx_type not in ('income', 'expense'):
        return error("type must be 'income' or 'expense'.", 400)

    if not validate_date(start_date):
        return error("Invalid start_date format. Use YYYY-MM-DD.", 400)

    if interval not in ('daily', 'weekly', 'monthly', 'yearly'):
        return error("interval must be daily, weekly, monthly, or yearly.", 400)

    category_id = data.get('category_id')
    if category_id and not is_valid_uuid(category_id):
        return error("Invalid category_id.", 400)

    record = RecurringService.create_recurring(
        amount, tx_type, category_id, start_date,
        interval, data.get('notes'), request.current_user['user_id']
    )
    return success(data=record, status=201)


@recurring_bp.route('/<tx_id>', methods=['DELETE'])
@roles_required('admin')
def delete_recurring(tx_id):
    if not is_valid_uuid(tx_id):
        return error("Invalid ID.", 400)
    deleted = RecurringService.delete_recurring(tx_id)
    if not deleted:
        return error("Recurring transaction not found.", 404)
    return success(message="Recurring transaction deleted.")
