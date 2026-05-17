import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / '.env'

if ENV_FILE.exists():
    load_dotenv(dotenv_path=ENV_FILE)


class Config:
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DB_PATH = os.environ.get('TASKMGR_DB_PATH', str(BASE_DIR / 'database.db'))
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{DB_PATH}"

    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
    SECRET_KEY = os.environ.get('SECRET_KEY')
    TESTING = False

    @classmethod
    def validate(cls):
        missing = []
        if not cls.SECRET_KEY:
            missing.append('SECRET_KEY')
        if not cls.GOOGLE_CLIENT_ID:
            missing.append('GOOGLE_CLIENT_ID')
        if not cls.GOOGLE_CLIENT_SECRET:
            missing.append('GOOGLE_CLIENT_SECRET')
        if missing:
            raise ValueError(
                f"Missing required environment variables: {', '.join(missing)}\n"
                "Please set them in your .env file or environment."
            )


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
