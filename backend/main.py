"""
DarManager Backend API
A FastAPI application for Lebanese guesthouse management.
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import os
from datetime import datetime, timedelta
from typing import List

from database import get_db, init_database
from models import User, Property, Room, Guest, UserRole
from schemas import (
    UserCreate, UserLogin, Token, User as UserSchema,
    Property as PropertySchema, PropertyCreate,
    Room as RoomSchema, RoomCreate, RoomUpdate,
    Guest as GuestSchema, GuestCreate, GuestUpdate,
    DashboardStats, MessageResponse
)
from auth import AuthService, get_current_user, get_current_admin

# Create FastAPI app
app = FastAPI(
    title="DarManager API",
    description="Guesthouse Management System for Lebanon",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database and create default admin user."""
    try:
        init_database()
        
        # Create default admin user if none exists
        db = next(get_db())
        admin_exists = db.query(User).filter(User.role == UserRole.ADMIN).first()
        
        if not admin_exists:
            admin_user = User(
                email="admin@darmanager.com",
                username="admin",
                first_name="Admin",
                last_name="User",
                hashed_password=AuthService.get_password_hash("admin123"),
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("Default admin user created: admin@darmanager.com / admin123")
        
        db.close()
    except Exception as e:
        print(f"Startup error: {e}")

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
async def login(user_login: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return JWT tokens."""
    user = AuthService.authenticate_user(db, user_login.email, user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
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

# Property endpoints
@app.get("/api/properties", response_model=List[PropertySchema])
async def get_properties(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all properties."""
    properties = db.query(Property).all()
    return properties

@app.get("/api/properties/{property_id}", response_model=PropertySchema)
async def get_property(
    property_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single property by ID."""
    db_property = db.query(Property).filter(Property.id == property_id).first()
    if not db_property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    return db_property

@app.post("/api/properties", response_model=PropertySchema)
async def create_property(
    property_create: PropertyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new property."""
    db_property = Property(**property_create.dict())
    db.add(db_property)
    db.commit()
    db.refresh(db_property)
    return db_property

@app.put("/api/properties/{property_id}", response_model=PropertySchema)
async def update_property(
    property_id: str,
    property_update: PropertyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a property."""
    db_property = db.query(Property).filter(Property.id == property_id).first()
    if not db_property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    # Update fields
    update_data = property_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_property, field, value)
    
    db.commit()
    db.refresh(db_property)
    return db_property

@app.delete("/api/properties/{property_id}")
async def delete_property(
    property_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a property."""
    db_property = db.query(Property).filter(Property.id == property_id).first()
    if not db_property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    db.delete(db_property)
    db.commit()
    
    return {"message": "Property deleted successfully"}

# Room endpoints
@app.get("/api/rooms", response_model=List[RoomSchema])
async def get_rooms(
    property_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all rooms, optionally filtered by property."""
    query = db.query(Room)
    if property_id:
        query = query.filter(Room.property_id == property_id)
    rooms = query.all()
    return rooms

@app.get("/api/rooms/{room_id}", response_model=RoomSchema)
async def get_room(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single room by ID."""
    db_room = db.query(Room).filter(Room.id == room_id).first()
    if not db_room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    return db_room

@app.post("/api/rooms", response_model=RoomSchema)
async def create_room(
    room_create: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new room."""
    db_room = Room(**room_create.dict())
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

@app.put("/api/rooms/{room_id}", response_model=RoomSchema)
async def update_room(
    room_id: str,
    room_update: RoomUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a room."""
    db_room = db.query(Room).filter(Room.id == room_id).first()
    if not db_room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    # Update fields
    update_data = room_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_room, field, value)
    
    db.commit()
    db.refresh(db_room)
    return db_room

@app.delete("/api/rooms/{room_id}")
async def delete_room(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a room."""
    db_room = db.query(Room).filter(Room.id == room_id).first()
    if not db_room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    db.delete(db_room)
    db.commit()
    
    return {"message": "Room deleted successfully"}

# Guest endpoints
@app.get("/api/guests", response_model=List[GuestSchema])
async def get_guests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all guests."""
    guests = db.query(Guest).order_by(Guest.created_at.desc()).all()
    return guests

@app.get("/api/guests/{guest_id}", response_model=GuestSchema)
async def get_guest(
    guest_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific guest."""
    guest = db.query(Guest).filter(Guest.id == guest_id).first()
    if not guest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guest not found"
        )
    return guest

@app.post("/api/guests", response_model=GuestSchema)
async def create_guest(
    guest_create: GuestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new guest."""
    db_guest = Guest(**guest_create.dict())
    db.add(db_guest)
    db.commit()
    db.refresh(db_guest)
    return db_guest

@app.put("/api/guests/{guest_id}", response_model=GuestSchema)
async def update_guest(
    guest_id: str,
    guest_update: GuestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a guest."""
    db_guest = db.query(Guest).filter(Guest.id == guest_id).first()
    if not db_guest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guest not found"
        )
    
    # Update fields
    update_data = guest_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_guest, field, value)
    
    db.commit()
    db.refresh(db_guest)
    return db_guest

@app.delete("/api/guests/{guest_id}")
async def delete_guest(
    guest_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a guest."""
    db_guest = db.query(Guest).filter(Guest.id == guest_id).first()
    if not db_guest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guest not found"
        )
    
    db.delete(db_guest)
    db.commit()
    
    return {"message": "Guest deleted successfully"}

# Dashboard endpoint
@app.get("/api/dashboard", response_model=DashboardStats)
async def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard statistics."""
    from sqlalchemy import func
    from models import Booking, Payment
    
    # Get counts
    total_properties = db.query(Property).count()
    total_rooms = db.query(Room).count()
    total_guests = db.query(Guest).count()
    active_bookings = db.query(Booking).filter(
        Booking.status.in_(['confirmed', 'checked_in'])
    ).count()
    
    # Get monthly revenue
    current_month = datetime.now().replace(day=1)
    monthly_revenue = db.query(func.sum(Payment.amount)).filter(
        Payment.payment_date >= current_month,
        Payment.payment_status == 'completed'
    ).scalar() or 0
    
    # Calculate occupancy rate (simplified)
    total_rooms_count = total_rooms or 1
    occupancy_rate = (active_bookings / total_rooms_count) * 100 if total_rooms_count > 0 else 0
    
    # Get recent bookings
    recent_bookings = db.query(Booking).order_by(Booking.created_at.desc()).limit(5).all()
    
    return DashboardStats(
        total_properties=total_properties,
        total_rooms=total_rooms,
        total_guests=total_guests,
        active_bookings=active_bookings,
        monthly_revenue=monthly_revenue,
        occupancy_rate=occupancy_rate,
        recent_bookings=recent_bookings
    )

# Public dashboard endpoint (no auth required)
@app.get("/api/dashboard/public")
async def get_public_dashboard(db: Session = Depends(get_db)):
    """Get public dashboard data - basic stats only."""
    from models import Booking
    
    total_properties = db.query(Property).count()
    active_bookings = db.query(Booking).filter(
        Booking.status.in_(['confirmed', 'checked_in'])
    ).count()
    
    return {
        "message": "DarManager API is running",
        "data": {
            "total_properties": total_properties,
            "active_bookings": active_bookings,
            "monthly_revenue": 0  # Hidden in public view
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
