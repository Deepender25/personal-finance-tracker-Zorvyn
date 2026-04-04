import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    FLASK_ENV = os.environ.get('FLASK_ENV', 'development')
    SECRET_KEY = os.environ.get('FLASK_SECRET_KEY', 'default-secret-key-for-dev')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'default-jwt-secret')
    JWT_EXPIRY_HOURS = int(os.environ.get('JWT_EXPIRY_HOURS', 24))
    
    DATABASE_URL = os.environ.get('DATABASE_URL')
    
    GMAIL_ADDRESS = os.environ.get('GMAIL_ADDRESS')
    GMAIL_APP_PASSWORD = os.environ.get('GMAIL_APP_PASSWORD')
    
    OTP_EXPIRY_MINUTES = int(os.environ.get('OTP_EXPIRY_MINUTES', 10))
    RATELIMIT_DEFAULT = os.environ.get('RATELIMIT_DEFAULT', '100 per hour')
    
    # Token blacklist cleanup: tokens older than this are safe to ignore
    TOKEN_BLACKLIST_CLEANUP_DAYS = int(os.environ.get('TOKEN_BLACKLIST_CLEANUP_DAYS', 7))
    
    # Maximum CSV import rows
    MAX_IMPORT_ROWS = int(os.environ.get('MAX_IMPORT_ROWS', 5000))
    
    # Maximum file upload size (16MB)
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))
