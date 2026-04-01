from flask import Blueprint, request
from app.services.dashboard_service import DashboardService
from app.middleware.rbac import roles_required
from app.utils.response import success

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/summary', methods=['GET'])
@roles_required('viewer', 'analyst', 'admin')
def get_summary():
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    summary = DashboardService.get_summary(date_from, date_to)
    return success(data=summary)

@dashboard_bp.route('/by-category', methods=['GET'])
@roles_required('analyst', 'admin')
def get_by_category():
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    tx_type = request.args.get('type')
    data = DashboardService.get_by_category(date_from, date_to, tx_type)
    return success(data=data)

@dashboard_bp.route('/monthly-trend', methods=['GET'])
@roles_required('analyst', 'admin')
def get_monthly_trend():
    year = request.args.get('year', type=int)
    data = DashboardService.get_monthly_trend(year)
    return success(data=data)

@dashboard_bp.route('/recent', methods=['GET'])
@roles_required('viewer', 'analyst', 'admin')
def get_recent():
    data = DashboardService.get_recent()
    return success(data=data)
