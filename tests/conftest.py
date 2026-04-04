import pytest
from app import create_app
from app.models import get_db_cursor
import os

@pytest.fixture
def app():
    os.environ['DATABASE_URL'] = os.environ.get('TEST_DATABASE_URL', os.environ.get('DATABASE_URL'))
    app = create_app()
    app.config.update({
        "TESTING": True,
    })
    yield app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def runner(app):
    return app.test_cli_runner()
