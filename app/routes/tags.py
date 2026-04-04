from flask import Blueprint, request
from app.services.tag_service import TagService
from app.middleware.rbac import roles_required
from app.utils.response import success, error
from app.utils.validators import is_valid_uuid
from app.services.audit_service import log_action

tags_bp = Blueprint('tags', __name__)


@tags_bp.route('', methods=['GET'])
@roles_required('viewer', 'analyst', 'admin')
def get_tags():
    data = TagService.get_all_tags()
    return success(data=data)


@tags_bp.route('', methods=['POST'])
@roles_required('admin')
def create_tag():
    data = request.get_json()
    if not data or not data.get('name'):
        return error("Tag name is required.", 400)
    name = data['name'].strip()
    if len(name) < 1 or len(name) > 50:
        return error("Tag name must be 1–50 characters.", 400)

    tag, created = TagService.create_tag(name, request.current_user['user_id'])
    status = 201 if created else 200
    log_action('tag.create', 'tag', tag['id'])
    return success(data=tag, status=status)


@tags_bp.route('/<tag_id>', methods=['DELETE'])
@roles_required('admin')
def delete_tag(tag_id):
    if not is_valid_uuid(tag_id):
        return error("Invalid tag ID.", 400)
    deleted = TagService.delete_tag(tag_id)
    if not deleted:
        return error("Tag not found.", 404)
    log_action('tag.delete', 'tag', tag_id)
    return success(message="Tag deleted.")


@tags_bp.route('/by-name/<tag_name>', methods=['GET'])
@roles_required('viewer', 'analyst', 'admin')
def get_by_tag(tag_name):
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    data = TagService.get_transactions_by_tag(tag_name, page, per_page)
    return success(data=data)
