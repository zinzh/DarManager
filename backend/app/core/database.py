"""
Database configuration and connection management for DarManager.
"""

import os
import time
import logging
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.exc import OperationalError

logger = logging.getLogger(__name__)

# Database URL from environment variable
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://darmanager_user:darmanager_password_2024@localhost:5432/darmanager"
)

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,  # Recycle connections every hour
    pool_size=5,
    max_overflow=10,
    echo=True if os.getenv("ENVIRONMENT") == "development" else False
)

# Create sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create declarative base
Base = declarative_base()

# Metadata for table reflection
metadata = MetaData()

def get_db():
    """
    Dependency to get database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def wait_for_database(max_retries: int = 30, retry_interval: int = 2):
    """
    Wait for database to be ready with retry logic.
    """
    retries = 0
    while retries < max_retries:
        try:
            # Try to connect to database
            connection = engine.connect()
            connection.close()
            logger.info("✅ Database connection successful")
            return True
        except OperationalError as e:
            retries += 1
            logger.warning(f"⏳ Database not ready (attempt {retries}/{max_retries}): {str(e)}")
            if retries >= max_retries:
                logger.error("❌ Database connection failed after all retries")
                raise
            time.sleep(retry_interval)
    return False

def init_database():
    """
    Initialize database tables (if needed).
    """
    # Wait for database to be ready first
    wait_for_database()
    
    # Import models to register them
    import app.models
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables initialized.")
