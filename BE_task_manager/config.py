from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent


class Config:
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DB_PATH = os.environ.get('TASKMGR_DB_PATH', str(BASE_DIR / 'database.db'))
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{DB_PATH}"


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False
