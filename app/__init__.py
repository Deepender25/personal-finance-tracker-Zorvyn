import os
from flask import Flask
from app.config import Config
from app.extensions import limiter

def create_app():
    # Point static_folder to project root /static and template_folder to app/templates
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    app = Flask(
        __name__,
        static_folder=os.path.join(base_dir, 'static'),
        template_folder=os.path.join(base_dir, 'app', 'templates')
    )
    app.config.from_object(Config)

    limiter.init_app(app)

    # Register API blueprints
    from app.routes.auth import auth_bp
    from app.routes.transactions import transactions_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.users import users_bp
    from app.routes.categories import categories_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(categories_bp, url_prefix='/api/categories')

    # Register frontend views blueprint
    from app.routes.views import views_bp
    app.register_blueprint(views_bp)

    return app
