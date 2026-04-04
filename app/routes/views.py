# Rewrite views.js entirely using `views.py`! Oh wait, `views.py` doesn't need to change. 
# Double checking `app/routes/views.py`: 
from flask import Blueprint, render_template, redirect, request
import jwt
from app.config import Config

views_bp = Blueprint('views', __name__)

def get_current_user():
    token = request.cookies.get('token')
    if not token:
        return None
    try:
        data = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
        return data
    except Exception:
        return None

@views_bp.route('/')
def index():
    user = get_current_user()
    if user:
        return redirect(f"/dashboard/{user['role']}")
    return redirect('/login')

@views_bp.route('/login')
def login():
    return render_template('auth/login.html')

@views_bp.route('/register')
def register():
    return render_template('auth/register.html')

@views_bp.route('/verify-otp')
def verify_otp():
    return render_template('auth/verify_otp.html')

@views_bp.route('/forgot-password')
def forgot_password():
    return render_template('auth/reset_password.html')

@views_bp.route('/dashboard/viewer')
def viewer_dashboard():
    user = get_current_user()
    if not user or user['role'] != 'viewer':
        return redirect('/login')
    return render_template('viewer/dashboard.html', user=user)

@views_bp.route('/dashboard/analyst')
def analyst_dashboard():
    user = get_current_user()
    if not user or user['role'] not in ['analyst', 'admin']:
        return redirect('/login')
    return render_template('analyst/dashboard.html', user=user)

@views_bp.route('/dashboard/admin')
def admin_dashboard():
    user = get_current_user()
    error_msg = None
    if not user or user['role'] != 'admin':
        return redirect('/login')
    return render_template('admin/dashboard.html', user=user)
