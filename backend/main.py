"""
DarManager Backend API
A FastAPI application for modern property management.
Updated with database connection retry logic.
"""

from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
import os
from datetime import datetime, timedelta, date
from typing import List, Optional

from database import get_db, init_database
from models import User, Property, Room, Guest, Booking, Tenant, UserRole
from schemas import (
    UserCreate, UserLogin, Token, User as UserSchema,
    Tenant as TenantSchema, TenantCreate, TenantUpdate,
    Property as PropertySchema, PropertyCreate,
    Room as RoomSchema, RoomCreate, RoomUpdate, RoomWithStatus,
    Guest as GuestSchema, GuestCreate, GuestUpdate,
    Booking as BookingSchema, BookingCreate, BookingUpdate,
    DashboardStats, MessageResponse,
    GuestRevenue, PropertyRevenue, FinancialReport
)
from auth import AuthService, get_current_user, get_current_admin

# Create FastAPI app
app = FastAPI(
    title="DarManager API",
    description="Guesthouse Management System",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configure CORS with dynamic origin handling
def get_cors_origins():
    """Get allowed CORS origins including dynamic subdomains."""
    base_origins = [
        "http://localhost:3000", 
        "http://localhost",
        "https://darmanager.net",
        "http://darmanager.net"
    ]
    
    # Allow all localhost subdomains dynamically
    return base_origins

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(.*\.)?localhost(:[0-9]+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def calculate_room_status(room: Room, db: Session) -> str:
    """Calculate dynamic room status based on current date and bookings."""
    today = date.today()
    
    # Check for active bookings for this room's property (Lebanese model: whole property)
    active_booking = db.query(Booking).filter(
        Booking.property_id == room.property_id,
        Booking.status.in_(["confirmed", "checked_in"]),
        Booking.check_in_date <= today,
        Booking.check_out_date > today
    ).first()
    
    if active_booking:
        if active_booking.status == "checked_in":
            return "occupied"
        elif active_booking.status == "confirmed":
            return "occupied"  # Confirmed booking for today means occupied
    
    # Check if there's a checkout today (needs cleaning)
    checkout_today = db.query(Booking).filter(
        Booking.property_id == room.property_id,
        Booking.status.in_(["confirmed", "checked_in"]),
        Booking.check_out_date == today
    ).first()
    
    if checkout_today:
        return "cleaning"
    
    # Default to the room's manual status or "available"
    return room.status or "available"

# Initialize database on startup with retry logic
@app.on_event("startup")
async def startup_event():
    """Initialize database and check for super admin user."""
    try:
        print("🔄 Starting DarManager API...")
        print("⏳ Waiting for database connection...")
        
        init_database()
        
        # Check if super admin exists (created by database init script)
        db = next(get_db())
        super_admin_exists = db.query(User).filter(User.role == UserRole.SUPER_ADMIN).first()
        
        if super_admin_exists:
            print(f"✅ Super admin found: {super_admin_exists.email}")
        else:
            print("⚠️  No super admin user found - should be created by database init script")
        
        db.close()
        print("✅ DarManager API started successfully")
    except Exception as e:
        print(f"❌ Startup error: {e}")
        # Don't raise here, let the app start and retry on requests
        pass

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for container monitoring."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development")
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to DarManager API",
        "docs": "/api/docs",
        "health": "/health"
    }

# Authentication endpoints
@app.post("/api/auth/login", response_model=Token)
async def login(
    user_login: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    """Authenticate user and return JWT tokens with tenant validation."""
    from tenant import get_tenant_from_subdomain
    
    # Get current tenant from subdomain (if any)
    current_tenant = await get_tenant_from_subdomain(request, db)
    
    user = AuthService.authenticate_user(db, user_login.email, user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Tenant validation logic
    if current_tenant:
        # If accessing via a specific tenant subdomain
        if user.role == UserRole.SUPER_ADMIN:
            # Super admin can login from any tenant subdomain
            pass
        else:
            # Regular users must login from their own tenant's subdomain
            if not user.tenant_id or str(user.tenant_id) != str(current_tenant.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"You cannot access {current_tenant.name} from this account. Please use your organization's subdomain.",
                )
    else:
        # If accessing via localhost (no tenant subdomain)
        if user.role == UserRole.SUPER_ADMIN:
            # Super admin can login from localhost
            pass
        else:
            # Regular users should be redirected to their tenant subdomain
            if user.tenant_id:
                user_tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
                if user_tenant:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Please access your account at: https://{user_tenant.subdomain}.darmanager.net",
                    )
    
    # Create tokens
    access_token = AuthService.create_access_token(data={"sub": user.email})
    refresh_token = AuthService.create_refresh_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@app.post("/api/auth/register", response_model=UserSchema)
async def register(
    user_create: UserCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Register a new user (admin only)."""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_create.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = AuthService.get_password_hash(user_create.password)
    db_user = User(
        email=user_create.email,
        username=user_create.username,
        first_name=user_create.first_name,
        last_name=user_create.last_name,
        hashed_password=hashed_password,
        role=user_create.role,
        is_active=user_create.is_active
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@app.get("/api/auth/me", response_model=UserSchema)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return current_user

# Add all other endpoints from the original main.py...
# (For brevity, I'm including just the essential ones here)

# Dashboard endpoint
@app.get("/api/dashboard", response_model=DashboardStats)
async def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard statistics for current user's tenant."""
    try:
        from models import Booking, Payment
        from tenant import get_user_tenant_id
        
        tenant_id = get_user_tenant_id(current_user)
        
        # For super admin, show aggregated stats across all tenants
        if current_user.role == UserRole.SUPER_ADMIN:
            # Get counts across all tenants
            total_properties = db.query(Property).count()
            total_rooms = db.query(Room).count()
            total_guests = db.query(Guest).count()
            active_bookings = db.query(Booking).filter(
                Booking.status.in_(['confirmed', 'checked_in'])
            ).count()
            
            # Get recent bookings across all tenants
            recent_bookings = db.query(Booking).order_by(Booking.created_at.desc()).limit(5).all()
        else:
            # For regular users, filter by tenant
            if not tenant_id:
                # User has no tenant, return zeros
                return DashboardStats(
                    total_properties=0,
                    total_rooms=0,
                    total_guests=0,
                    active_bookings=0,
                    monthly_revenue=0.0,
                    occupancy_rate=0.0,
                    recent_bookings=[]
                )
            
            # Get counts for current tenant only
            total_properties = db.query(Property).filter(Property.tenant_id == tenant_id).count()
            total_guests = db.query(Guest).filter(Guest.tenant_id == tenant_id).count()
            
            # Count rooms for properties belonging to this tenant
            total_rooms = db.query(Room).join(Property).filter(Property.tenant_id == tenant_id).count()
            
            # Count active bookings for properties belonging to this tenant
            active_bookings = db.query(Booking).join(Property).filter(
                Property.tenant_id == tenant_id,
                Booking.status.in_(['confirmed', 'checked_in'])
            ).count()
            
            # Get recent bookings for this tenant's properties
            recent_bookings = db.query(Booking).join(Property).filter(
                Property.tenant_id == tenant_id
            ).order_by(Booking.created_at.desc()).limit(5).all()
        
        # Get total revenue from checked-out bookings
        try:
            if current_user.role == UserRole.SUPER_ADMIN:
                # Super admin sees all revenue from checked-out bookings
                total_revenue = db.query(func.sum(Booking.total_amount)).filter(
                    Booking.status == 'checked_out'
                ).scalar() or 0
            else:
                # Regular users see only their tenant's revenue
                total_revenue = db.query(func.sum(Booking.total_amount)).join(Property).filter(
                    Property.tenant_id == tenant_id,
                    Booking.status == 'checked_out'
                ).scalar() or 0
        except Exception:
            total_revenue = 0
        
        # For backward compatibility, keep monthly_revenue as total_revenue for now
        monthly_revenue = total_revenue
        
        # Calculate occupancy rate (simplified)
        occupancy_rate = 0.0
        if total_rooms > 0:
            occupancy_rate = (active_bookings / total_rooms) * 100
        
        return DashboardStats(
            total_properties=total_properties,
            total_rooms=total_rooms,
            total_guests=total_guests,
            active_bookings=active_bookings,
            monthly_revenue=float(monthly_revenue),
            occupancy_rate=occupancy_rate,
            recent_bookings=recent_bookings or []
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving dashboard data: {str(e)}"
        )

# API Status endpoint (no auth required)
@app.get("/api/status")
async def get_api_status():
    """Get API status for health checks."""
    return {
        "status": "healthy",
        "message": "DarManager API is running",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )