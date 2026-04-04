from flask import Blueprint, request
from app.services.budget_service import BudgetService
from app.middleware.rbac import roles_required
from app.utils.response import success, error
from app.utils.validators import is_valid_uuid
from app.services.audit_service import log_action

budgets_bp = Blueprint('budgets', __name__)


@budgets_bp.route('', methods=['GET'])
@roles_required('viewer', 'analyst', 'admin')
def get_budgets():
    data = BudgetService.get_budgets()
    return success(data=data)


@budgets_bp.route('/status', methods=['GET'])
@roles_required('viewer', 'analyst', 'admin')
def get_budget_status():
    data = BudgetService.get_budget_status()
    return success(data=data)


@budgets_bp.route('', methods=['POST'])
@roles_required('admin')
def create_budget():
    data = request.get_json()
    if not data:
        return error("Missing request body.", 400)

    category_id  = data.get('category_id')
    amount_limit = data.get('amount_limit')
    period       = data.get('period')

    if not category_id or not amount_limit or not period:
        return error("category_id, amount_limit, and period are required.", 400)

    if not is_valid_uuid(category_id):
        return error("Invalid category_id.", 400)

    try:
        amount_limit = float(amount_limit)
        if amount_limit <= 0:
            raise ValueError()
    except (ValueError, TypeError):
        return error("amount_limit must be a positive number.", 400)

    if period not in ('monthly', 'yearly'):
        return error("Period must be 'monthly' or 'yearly'.", 400)

    budget = BudgetService.create_budget(category_id, amount_limit, period, request.current_user['user_id'])
    log_action('budget.upsert', 'budget', budget['id'], new_value=budget)
    return success(data=budget, status=201)


@budgets_bp.route('/<budget_id>', methods=['DELETE'])
@roles_required('admin')
def delete_budget(budget_id):
    if not is_valid_uuid(budget_id):
        return error("Invalid budget ID.", 400)

    deleted = BudgetService.delete_budget(budget_id)
    if not deleted:
        return error("Budget not found.", 404)

    log_action('budget.delete', 'budget', budget_id)
    return success(message="Budget deleted.")
