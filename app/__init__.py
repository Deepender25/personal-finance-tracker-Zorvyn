import os
from flask import Flask
from app.config import Config
from app.extensions import limiter

def create_app():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    app = Flask(
        __name__,
        static_folder=os.path.join(base_dir, 'static'),
        template_folder=os.path.join(base_dir, 'app', 'templates')
    )
    app.config.from_object(Config)
    app.config['MAX_CONTENT_LENGTH'] = Config.MAX_CONTENT_LENGTH

    limiter.init_app(app)

    # ── Original blueprints ──────────────────────────────────────
    from app.routes.auth import auth_bp
    from app.routes.transactions import transactions_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.users import users_bp
    from app.routes.categories import categories_bp

    app.register_blueprint(auth_bp,          url_prefix='/api/auth')
    app.register_blueprint(transactions_bp,  url_prefix='/api/transactions')
    app.register_blueprint(dashboard_bp,     url_prefix='/api/dashboard')
    app.register_blueprint(users_bp,         url_prefix='/api/users')
    app.register_blueprint(categories_bp,    url_prefix='/api/categories')

    # ── New feature blueprints ────────────────────────────────────
    from app.routes.analytics     import analytics_bp
    from app.routes.audit         import audit_bp
    from app.routes.budgets       import budgets_bp
    from app.routes.tags          import tags_bp
    from app.routes.profile       import profile_bp
    from app.routes.import_export import import_export_bp

    app.register_blueprint(analytics_bp,     url_prefix='/api/analytics')
    app.register_blueprint(audit_bp,         url_prefix='/api/audit')
    app.register_blueprint(budgets_bp,       url_prefix='/api/budgets')
    app.register_blueprint(tags_bp,          url_prefix='/api/tags')
    app.register_blueprint(profile_bp,       url_prefix='/api/me')
    app.register_blueprint(import_export_bp, url_prefix='/api/data')

    # ── Frontend views ────────────────────────────────────────────
    from app.routes.views import views_bp
    app.register_blueprint(views_bp)

    return app
