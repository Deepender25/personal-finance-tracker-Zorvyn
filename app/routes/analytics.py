from flask import Blueprint, request
from app.services.analytics_service import AnalyticsService
from app.middleware.rbac import roles_required
from app.utils.response import success, error
from datetime import datetime

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/top-categories', methods=['GET'])
@roles_required('analyst', 'admin')
def top_categories():
    tx_type  = request.args.get('type', 'expense')
    limit    = min(request.args.get('limit', 10, type=int), 50)
    date_from = request.args.get('date_from')
    date_to   = request.args.get('date_to')
    if tx_type not in ('income', 'expense'):
        return error("Type must be 'income' or 'expense'.", 400)
    data = AnalyticsService.get_top_categories(tx_type, limit, date_from, date_to)
    return success(data=data)


@analytics_bp.route('/daily-trend', methods=['GET'])
@roles_required('analyst', 'admin')
def daily_trend():
    month = request.args.get('month', datetime.now().strftime('%Y-%m'))
    data  = AnalyticsService.get_daily_trend(month)
    return success(data=data)


@analytics_bp.route('/yoy-comparison', methods=['GET'])
@roles_required('analyst', 'admin')
def yoy_comparison():
    year = request.args.get('year', datetime.now().year, type=int)
    data = AnalyticsService.get_yoy_comparison(year)
    return success(data=data)


@analytics_bp.route('/savings-rate', methods=['GET'])
@roles_required('analyst', 'admin')
def savings_rate():
    date_from = request.args.get('date_from')
    date_to   = request.args.get('date_to')
    data      = AnalyticsService.get_savings_rate(date_from, date_to)
    return success(data=data)


@analytics_bp.route('/heatmap', methods=['GET'])
@roles_required('analyst', 'admin')
def expense_heatmap():
    year = request.args.get('year', datetime.now().year, type=int)
    data = AnalyticsService.get_expense_heatmap(year)
    return success(data=data)
