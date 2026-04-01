from flask import Blueprint, request, jsonify
from app.services.transaction_service import TransactionService
from app.middleware.rbac import token_required, roles_required
from app.utils.response import success, error
from app.utils.validators import validate_date, is_valid_uuid

transactions_bp = Blueprint('transactions', __name__)

@transactions_bp.route('', methods=['GET'])
@roles_required('viewer', 'analyst', 'admin')
def get_transactions():
    type_filter = request.args.get('type')
    category_id = request.args.get('category_id')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    search = request.args.get('search')
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)

    result = TransactionService.get_transactions(
        type_filter, category_id, date_from, date_to, search, page, per_page
    )
    return success(data=result['data'], meta=result['meta'])

@transactions_bp.route('/<tx_id>', methods=['GET'])
@roles_required('viewer', 'analyst', 'admin')
def get_transaction(tx_id):
    if not is_valid_uuid(tx_id):
        return error("Invalid transaction ID", 400)
        
    tx = TransactionService.get_transaction(tx_id)
    if not tx:
        return error("Transaction not found", 404)
        
    return success(data=tx)

@transactions_bp.route('', methods=['POST'])
@roles_required('admin')
def create_transaction():
    data = request.get_json()
    if not data or not data.get('amount') or not data.get('type') or not data.get('date'):
        return error("Amount, type, and date are required.", 400)
    
    amount = float(data['amount'])
    if amount <= 0:
        return error("Amount must be positive.", 400)
        
    if data['type'] not in ['income', 'expense']:
        return error("Type must be 'income' or 'expense'.", 400)
        
    if not validate_date(data['date']):
        return error("Invalid date format. Use YYYY-MM-DD.", 400)
        
    if data.get('category_id') and not is_valid_uuid(data['category_id']):
         return error("Invalid category ID format", 400)

    tx = TransactionService.create_transaction(
        amount, data['type'], data.get('category_id'), data['date'], 
        data.get('notes'), request.current_user['user_id']
    )
    return success(data=tx, status=201)

@transactions_bp.route('/<tx_id>', methods=['PUT'])
@roles_required('admin')
def update_transaction(tx_id):
    if not is_valid_uuid(tx_id):
        return error("Invalid transaction ID", 400)
        
    data = request.get_json()
    
    # Needs validation for existing TX logic checking
    valid_tx = TransactionService.get_transaction(tx_id)
    if not valid_tx:
        return error("Transaction not found", 404)
        
    amount = data.get('amount', valid_tx['amount'])
    tx_type = data.get('type', valid_tx['type'])
    category_id = data.get('category_id', valid_tx['category_id'])
    date = data.get('date', valid_tx['date'])
    notes = data.get('notes', valid_tx['notes'])
    
    if data.get('amount') and float(data.get('amount')) <= 0:
         return error("Amount must be positive.", 400)
         
    if data.get('type') and data.get('type') not in ['income', 'expense']:
         return error("Type must be 'income' or 'expense'.", 400)

    tx = TransactionService.update_transaction(tx_id, amount, tx_type, category_id, date, notes)
    if not tx:
         return error("Transaction not found during update", 400)
         
    return success(data=tx)

@transactions_bp.route('/<tx_id>', methods=['DELETE'])
@roles_required('admin')
def delete_transaction(tx_id):
    if not is_valid_uuid(tx_id):
        return error("Invalid transaction ID", 400)
        
    deleted = TransactionService.delete_transaction(tx_id)
    if not deleted:
         return error("Transaction not found or already deleted.", 404)
         
    return success(message="Transaction deleted.")
