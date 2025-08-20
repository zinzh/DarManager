"""
Database configuration and connection management for DarManager.
"""

import os
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

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

def init_database():
    """
    Initialize database tables (if needed).
    """
    # Import models to register them
    import models
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized.")
