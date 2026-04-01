from flask import Blueprint, request
from app.models import get_db_cursor
from app.middleware.rbac import roles_required
from app.utils.response import success, error
from app.utils.validators import is_valid_uuid

categories_bp = Blueprint('categories', __name__)

@categories_bp.route('', methods=['GET'])
@roles_required('viewer', 'analyst', 'admin')
def get_categories():
    with get_db_cursor() as cursor:
        cursor.execute("SELECT id, name FROM categories ORDER BY name ASC")
        data = [dict(row) for row in cursor.fetchall()]
    return success(data=data)

@categories_bp.route('', methods=['POST'])
@roles_required('admin')
def create_category():
    data = request.get_json()
    if not data or not data.get('name'):
        return error("Category name is required.", 400)
        
    with get_db_cursor(commit=True) as cursor:
        # Check if exists
        cursor.execute("SELECT id FROM categories WHERE name = %s", (data['name'],))
        if cursor.fetchone():
             return error("Category already exists.", 400)
             
        cursor.execute("""
            INSERT INTO categories (name, created_by) VALUES (%s, %s) RETURNING id, name
        """, (data['name'], request.current_user['user_id']))
        record = dict(cursor.fetchone())
        
    return success(data=record, status=201)

@categories_bp.route('/<cat_id>', methods=['DELETE'])
@roles_required('admin')
def delete_category(cat_id):
    if not is_valid_uuid(cat_id):
        return error("Invalid category ID", 400)
        
    with get_db_cursor(commit=True) as cursor:
        cursor.execute("SELECT id FROM transactions WHERE category_id = %s LIMIT 1", (cat_id,))
        if cursor.fetchone():
            return error("Cannot delete category. It is referenced by existing transactions.", 409)
            
        cursor.execute("DELETE FROM categories WHERE id = %s RETURNING id", (cat_id,))
        deleted = cursor.fetchone()
        
    if not deleted:
         return error("Category not found.", 404)
         
    return success(message="Category deleted.")
