"""
DarManager Backend API - Production Grade Structure
Main application entry point with modular architecture.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.exceptions import (
    AppException,
    app_exception_handler,
    validation_exception_handler,
    database_exception_handler,
    general_exception_handler
)
from app.api.v1.api import api_router
from app.core.database import init_database


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    
    # Create FastAPI app
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Modern Property Management System API",
        docs_url=settings.DOCS_URL,
        redoc_url=settings.REDOC_URL,
        openapi_url=f"{settings.API_V1_PREFIX}/openapi.json"
    )
    
    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=settings.CORS_ORIGIN_REGEX,
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=settings.CORS_ALLOW_METHODS,
        allow_headers=settings.CORS_ALLOW_HEADERS,
    )
    
    # Register exception handlers
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(SQLAlchemyError, database_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)
    
    # Include API router
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)
    
    # Add root endpoints
    @app.get("/")
    async def root():
        """Root endpoint."""
        return {
            "message": f"Welcome to {settings.APP_NAME}",
            "version": settings.APP_VERSION,
            "docs": settings.DOCS_URL,
            "health": "/health"
        }
    
    @app.get("/health")
    async def health_check():
        """Health check endpoint for container monitoring."""
        from datetime import datetime
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT
        }
    
    @app.get("/api/status")
    async def api_status():
        """API status endpoint."""
        return {
            "status": "healthy",
            "message": f"{settings.APP_NAME} is running",
            "version": settings.APP_VERSION
        }
    
    return app


# Create app instance
app = create_application()


@app.on_event("startup")
async def startup_event():
    """Initialize database and perform startup tasks."""
    try:
        init_database()
        
        # Check if super admin exists
        from app.core.database import get_db
        from app.models import User, UserRole
        
        db = next(get_db())
        super_admin_exists = db.query(User).filter(User.role == UserRole.SUPER_ADMIN).first()
        
        if super_admin_exists:
            print(f"✅ Super admin found: {super_admin_exists.email}")
        else:
            print("⚠️  No super admin user found - should be created by database init script")
        
        db.close()
        
        print(f"✅ {settings.APP_NAME} v{settings.APP_VERSION} started successfully")
        print(f"📚 API Documentation: {settings.DOCS_URL}")
        print(f"🌍 Environment: {settings.ENVIRONMENT}")
        
    except Exception as e:
        print(f"❌ Startup error: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Perform cleanup tasks on shutdown."""
    print(f"👋 {settings.APP_NAME} shutting down...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )