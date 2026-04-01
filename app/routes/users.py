from flask import Blueprint, request
from app.services.user_service import UserService
from app.middleware.rbac import roles_required
from app.utils.response import success, error
from app.utils.validators import is_valid_uuid

users_bp = Blueprint('users', __name__)

@users_bp.route('', methods=['GET'])
@roles_required('admin')
def get_users():
    search = request.args.get('search')
    role = request.args.get('role')
    status = request.args.get('status')
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    
    result = UserService.get_users(search, role, status, page, per_page)
    return success(data=result['data'], meta=result['meta'])

@users_bp.route('', methods=['POST'])
@roles_required('admin')
def create_user():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('email') or not data.get('password') or not data.get('role'):
        return error("Name, email, password, and role are required.", 400)
        
    if data['role'] not in ['viewer', 'analyst', 'admin']:
         return error("Role must be 'viewer', 'analyst', or 'admin'.", 400)
         
    res, status = UserService.create_user(data['name'], data['email'], data['password'], data['role'])
    if status != 201:
        return error(res['error'], status)
        
    return success(data=res, status=status)

@users_bp.route('/<user_id>', methods=['PUT'])
@roles_required('admin')
def update_user(user_id):
    if not is_valid_uuid(user_id):
        return error("Invalid user ID", 400)
        
    data = request.get_json()
    if not data:
        return error("Missing JSON body", 400)
        
    if data.get('role') and data['role'] not in ['viewer', 'analyst', 'admin']:
         return error("Role must be 'viewer', 'analyst', or 'admin'.", 400)
         
    if data.get('status') and data['status'] not in ['active', 'inactive']:
         return error("Status must be 'active' or 'inactive'.", 400)

    res, status = UserService.update_user(
        user_id, 
        name=data.get('name'), 
        role=data.get('role'), 
        status=data.get('status'), 
        current_admin_id=request.current_user['user_id']
    )
    
    if status != 200:
        return error(res.get('error', 'Update Failed'), status)
        
    return success(data=res)

@users_bp.route('/<user_id>', methods=['DELETE'])
@roles_required('admin')
def delete_user(user_id):
    if not is_valid_uuid(user_id):
        return error("Invalid user ID", 400)
        
    res, status = UserService.deactivate_user(user_id, request.current_user['user_id'])
    
    if status != 200:
        return error(res['error'], status)
        
    return success(message=res['message'])
