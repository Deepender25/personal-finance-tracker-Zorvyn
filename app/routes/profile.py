from flask import Blueprint, request
from app.services.profile_service import ProfileService
from app.middleware.auth_middleware import token_required
from app.utils.response import success, error
from app.utils.validators import is_valid_uuid
from app.services.audit_service import log_action

profile_bp = Blueprint('profile', __name__)


@profile_bp.route('', methods=['GET'])
@token_required
def get_profile():
    profile = ProfileService.get_profile(request.current_user['user_id'])
    if not profile:
        return error("User not found.", 404)
    return success(data=profile)


@profile_bp.route('', methods=['PUT'])
@token_required
def update_profile():
    data = request.get_json()
    if not data:
        return error("Missing request body.", 400)

    old_profile = ProfileService.get_profile(request.current_user['user_id'])
    result, status = ProfileService.update_profile(
        user_id=request.current_user['user_id'],
        name=data.get('name'),
        current_password=data.get('current_password'),
        new_password=data.get('new_password')
    )

    if status != 200:
        return error(result.get('error', 'Update failed.'), status)

    log_action('profile.update', 'user', request.current_user['user_id'],
               old_value={'name': old_profile.get('name') if old_profile else None},
               new_value={'name': result.get('name')})
    return success(data=result)


@profile_bp.route('/activity', methods=['GET'])
@token_required
def my_activity():
    limit = min(request.args.get('limit', 20, type=int), 100)
    data = ProfileService.get_my_activity(request.current_user['user_id'], limit)
    return success(data=data)


@profile_bp.route('/api-keys', methods=['GET'])
@token_required
def list_api_keys():
    data = ProfileService.get_my_api_keys(request.current_user['user_id'])
    return success(data=data)


@profile_bp.route('/api-keys', methods=['POST'])
@token_required
def create_api_key():
    data = request.get_json()
    if not data or not data.get('label'):
        return error("API key label is required.", 400)
    label = data['label'].strip()
    if len(label) < 1 or len(label) > 100:
        return error("Label must be 1–100 characters.", 400)
    permissions = data.get('permissions', ['read'])
    if not isinstance(permissions, list):
        return error("Permissions must be a list.", 400)

    key_data = ProfileService.create_api_key(request.current_user['user_id'], label, permissions)
    log_action('api_key.create', 'api_key', key_data['id'])
    return success(data=key_data, status=201)


@profile_bp.route('/api-keys/<key_id>', methods=['DELETE'])
@token_required
def revoke_api_key(key_id):
    if not is_valid_uuid(key_id):
        return error("Invalid key ID.", 400)
    revoked = ProfileService.revoke_api_key(key_id, request.current_user['user_id'])
    if not revoked:
        return error("API key not found or not yours.", 404)
    log_action('api_key.revoke', 'api_key', key_id)
    return success(message="API key revoked.")
