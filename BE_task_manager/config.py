from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent


class Config:
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DB_PATH = os.environ.get('TASKMGR_DB_PATH', str(BASE_DIR / 'database.db'))
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{DB_PATH}"

    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
    SECRET_KEY = os.environ.get(
        'SECRET_KEY', '4fc10d5230d08595a20c385017cb82655dae63afff035a7d87152a6dee5eb883')


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False
