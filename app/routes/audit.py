from flask import Blueprint, request
from app.services.audit_service import AuditService
from app.middleware.rbac import roles_required
from app.utils.response import success

audit_bp = Blueprint('audit', __name__)


@audit_bp.route('', methods=['GET'])
@roles_required('admin')
def get_audit_logs():
    user_id_filter    = request.args.get('user_id')
    action_filter     = request.args.get('action')
    entity_type_filter = request.args.get('entity_type')
    date_from = request.args.get('date_from')
    date_to   = request.args.get('date_to')
    page      = request.args.get('page', 1, type=int)
    per_page  = min(request.args.get('per_page', 50, type=int), 200)

    result = AuditService.get_logs(
        user_id_filter, action_filter, entity_type_filter,
        date_from, date_to, page, per_page
    )
    return success(data=result['data'], meta=result['meta'])
