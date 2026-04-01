import psycopg2
import psycopg2.extras
from contextlib import contextmanager
from app.config import Config

@contextmanager
def get_db_connection():
    conn = None
    try:
        conn = psycopg2.connect(Config.DATABASE_URL)
        yield conn
    finally:
        if conn is not None:
            conn.close()

@contextmanager
def get_db_cursor(commit=False):
    with get_db_connection() as conn:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        try:
            yield cursor
            if commit:
                conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()
