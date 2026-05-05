from __future__ import with_statement

import logging
from logging.config import fileConfig

from alembic import context
from flask import current_app

# Import your app and db to access metadata directly
from app import app
from models import db

config = context.config
fileConfig(config.config_file_name)
logger = logging.getLogger('alembic.env')

# Use your SQLAlchemy metadata directly
target_metadata = db.metadata


def get_engine():
    try:
        return current_app.extensions['migrate'].db.get_engine()
    except (TypeError, AttributeError):
        return current_app.extensions['migrate'].db.engine


def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    connectable = get_engine()
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
