"""
DarManager Backend API
A FastAPI application for Lebanese guesthouse management.
"""

from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import os
from datetime import datetime, timedelta, date
from typing import List

from database import get_db, init_database
from models import User, Property, Room, Guest, Booking, Tenant, UserRole
from schemas import (
    UserCreate, UserLogin, Token, User as UserSchema,
    Tenant as TenantSchema, TenantCreate, TenantUpdate,
    Property as PropertySchema, PropertyCreate,
    Room as RoomSchema, RoomCreate, RoomUpdate, RoomWithStatus,
    Guest as GuestSchema, GuestCreate, GuestUpdate,
    Booking as BookingSchema, BookingCreate, BookingUpdate,
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

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database and check for super admin user."""
    try:
        init_database()
        
        # Check if super admin exists (created by database init script)
        db = next(get_db())
        super_admin_exists = db.query(User).filter(User.role == UserRole.SUPER_ADMIN).first()
        
        if super_admin_exists:
            print(f"✅ Super admin found: {super_admin_exists.email}")
        else:
            print("⚠️  No super admin user found - should be created by database init script")
        
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
                        detail=f"Please access your account at: https://{user_tenant.subdomain}.darmanager.com",
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
    """Get all properties for the current user's tenant."""
    from tenant import get_user_tenant_id
    
    tenant_id = get_user_tenant_id(current_user)
    
    # Super admin can see all properties (for now)
    if current_user.role == UserRole.SUPER_ADMIN:
        properties = db.query(Property).all()
    else:
        if not tenant_id:
            return []  # User has no tenant, return empty list
        properties = db.query(Property).filter(Property.tenant_id == tenant_id).all()
    
    return properties

@app.get("/api/properties/{property_id}", response_model=PropertySchema)
async def get_property(
    property_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single property by ID with tenant validation."""
    from tenant import get_user_tenant_id, validate_tenant_access
    
    db_property = db.query(Property).filter(Property.id == property_id).first()
    if not db_property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    # Validate tenant access
    if not validate_tenant_access(current_user, str(db_property.tenant_id)):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"  # Don't reveal that it exists but is forbidden
        )
    
    return db_property

@app.post("/api/properties", response_model=PropertySchema)
async def create_property(
    property_create: PropertyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new property."""
    from tenant import get_user_tenant_id
    
    # Get tenant_id for the current user
    tenant_id = get_user_tenant_id(current_user)
    
    # Super admin must specify which tenant (for now, we'll handle this later)
    if current_user.role == UserRole.SUPER_ADMIN and not tenant_id:
        # For now, super admin can't create properties without specifying tenant
        # This will be handled by super admin endpoints later
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Super admin must use tenant-specific endpoints to create properties"
        )
    
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must be associated with a tenant to create properties"
        )
    
    # Create property with tenant_id
    property_data = property_create.dict()
    property_data['tenant_id'] = tenant_id
    
    db_property = Property(**property_data)
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
    """Update a property with tenant validation."""
    from tenant import validate_tenant_access
    
    db_property = db.query(Property).filter(Property.id == property_id).first()
    if not db_property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    # Validate tenant access
    if not validate_tenant_access(current_user, str(db_property.tenant_id)):
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
    """Delete a property with tenant validation."""
    from tenant import validate_tenant_access
    
    db_property = db.query(Property).filter(Property.id == property_id).first()
    if not db_property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    # Validate tenant access
    if not validate_tenant_access(current_user, str(db_property.tenant_id)):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    db.delete(db_property)
    db.commit()
    
    return {"message": "Property deleted successfully"}

# Room endpoints
@app.get("/api/rooms", response_model=List[RoomWithStatus])
async def get_rooms(
    property_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all rooms with calculated dynamic status."""
    query = db.query(Room)
    if property_id:
        query = query.filter(Room.property_id == property_id)
    
    rooms = query.order_by(Room.created_at.desc()).all()
    
    # Calculate dynamic status for each room
    rooms_with_status = []
    for room in rooms:
        calculated_status = calculate_room_status(room, db)
        room_dict = {
            'id': room.id,
            'property_id': room.property_id,
            'name': room.name,
            'description': room.description,
            'capacity': room.capacity,
            'price_per_night': room.price_per_night,
            'status': calculated_status,  # Use calculated status
            'keybox_code': room.keybox_code,
            'created_at': room.created_at,
            'updated_at': room.updated_at
        }
        rooms_with_status.append(RoomWithStatus(**room_dict))
    
    return rooms_with_status

@app.get("/api/rooms/{room_id}", response_model=RoomWithStatus)
async def get_room(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single room by ID with calculated dynamic status."""
    db_room = db.query(Room).filter(Room.id == room_id).first()
    if not db_room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    # Calculate dynamic status
    calculated_status = calculate_room_status(db_room, db)
    room_dict = {
        'id': db_room.id,
        'property_id': db_room.property_id,
        'name': db_room.name,
        'description': db_room.description,
        'capacity': db_room.capacity,
        'price_per_night': db_room.price_per_night,
        'status': calculated_status,  # Use calculated status
        'keybox_code': db_room.keybox_code,
        'created_at': db_room.created_at,
        'updated_at': db_room.updated_at
    }
    return RoomWithStatus(**room_dict)

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
    """Get all guests for the current user's tenant."""
    from tenant import get_user_tenant_id
    
    tenant_id = get_user_tenant_id(current_user)
    
    # Super admin can see all guests (for now)
    if current_user.role == UserRole.SUPER_ADMIN:
        guests = db.query(Guest).order_by(Guest.created_at.desc()).all()
    else:
        if not tenant_id:
            return []  # User has no tenant, return empty list
        guests = db.query(Guest).filter(Guest.tenant_id == tenant_id).order_by(Guest.created_at.desc()).all()
    
    return guests

@app.get("/api/guests/{guest_id}", response_model=GuestSchema)
async def get_guest(
    guest_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific guest with tenant validation."""
    from tenant import validate_tenant_access
    
    guest = db.query(Guest).filter(Guest.id == guest_id).first()
    if not guest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guest not found"
        )
    
    # Validate tenant access
    if not validate_tenant_access(current_user, str(guest.tenant_id)):
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
    """Create a new guest with tenant isolation."""
    from tenant import get_user_tenant_id
    
    # Get tenant_id for the current user
    tenant_id = get_user_tenant_id(current_user)
    
    # Super admin must specify which tenant (for now, we'll handle this later)
    if current_user.role == UserRole.SUPER_ADMIN and not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Super admin must use tenant-specific endpoints to create guests"
        )
    
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must be associated with a tenant to create guests"
        )
    
    # Create guest with tenant_id
    guest_data = guest_create.dict()
    guest_data['tenant_id'] = tenant_id
    
    db_guest = Guest(**guest_data)
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
    """Update a guest with tenant validation."""
    from tenant import validate_tenant_access
    
    db_guest = db.query(Guest).filter(Guest.id == guest_id).first()
    if not db_guest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guest not found"
        )
    
    # Validate tenant access
    if not validate_tenant_access(current_user, str(db_guest.tenant_id)):
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
    """Delete a guest with tenant validation."""
    from tenant import validate_tenant_access
    
    db_guest = db.query(Guest).filter(Guest.id == guest_id).first()
    if not db_guest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guest not found"
        )
    
    # Validate tenant access
    if not validate_tenant_access(current_user, str(db_guest.tenant_id)):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guest not found"
        )
    
    db.delete(db_guest)
    db.commit()
    
    return {"message": "Guest deleted successfully"}

# Booking endpoints
@app.get("/api/bookings", response_model=List[BookingSchema])
async def get_bookings(
    guest_id: str = None,
    property_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all bookings for the current user's tenant."""
    from tenant import get_user_tenant_id
    
    tenant_id = get_user_tenant_id(current_user)
    
    # Start with base query
    query = db.query(Booking)
    
    # Filter out bookings with null property_id or guest_id to prevent validation errors
    query = query.filter(Booking.property_id.isnot(None), Booking.guest_id.isnot(None))
    
    # Add tenant filtering (bookings inherit tenant from property)
    if current_user.role == UserRole.SUPER_ADMIN:
        # Super admin can see all bookings (for now)
        pass
    else:
        if not tenant_id:
            return []  # User has no tenant, return empty list
        # Join with properties to filter by tenant
        query = query.join(Property).filter(Property.tenant_id == tenant_id)
    
    # Apply additional filters
    if guest_id:
        query = query.filter(Booking.guest_id == guest_id)
    if property_id:
        query = query.filter(Booking.property_id == property_id)
    
    bookings = query.order_by(Booking.created_at.desc()).all()
    return bookings

@app.get("/api/bookings/{booking_id}", response_model=BookingSchema)
async def get_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific booking with tenant validation."""
    from tenant import get_user_tenant_id
    
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Validate tenant access (booking inherits tenant from property)
    if current_user.role != UserRole.SUPER_ADMIN:
        tenant_id = get_user_tenant_id(current_user)
        if not tenant_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        # Check if booking's property belongs to user's tenant
        property_obj = db.query(Property).filter(Property.id == booking.property_id).first()
        if not property_obj or str(property_obj.tenant_id) != tenant_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
    
    return booking

@app.post("/api/bookings", response_model=BookingSchema)
async def create_booking(
    booking_create: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new booking with tenant validation."""
    from tenant import get_user_tenant_id, validate_tenant_access
    
    # Validate that property exists and user has access
    property_exists = db.query(Property).filter(Property.id == booking_create.property_id).first()
    if not property_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    # Validate tenant access to property
    if not validate_tenant_access(current_user, str(property_exists.tenant_id)):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    # Validate that guest exists and belongs to same tenant
    guest_exists = db.query(Guest).filter(Guest.id == booking_create.guest_id).first()
    if not guest_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guest not found"
        )
    
    # Validate tenant access to guest
    if not validate_tenant_access(current_user, str(guest_exists.tenant_id)):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guest not found"
        )
    
    # Validate dates
    if booking_create.check_in_date >= booking_create.check_out_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Check-out date must be after check-in date"
        )
    
    # Check for overlapping bookings (Lebanese model: whole property booking)
    overlapping_bookings = db.query(Booking).filter(
        Booking.property_id == booking_create.property_id,
        Booking.status.in_(["pending", "confirmed", "checked_in"]),  # Include pending bookings
        # Date overlap logic: new booking overlaps if:
        # (new_start < existing_end) AND (new_end > existing_start)
        Booking.check_out_date > booking_create.check_in_date,
        Booking.check_in_date < booking_create.check_out_date
    ).first()
    
    if overlapping_bookings:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Property is already booked from {overlapping_bookings.check_in_date} to {overlapping_bookings.check_out_date}"
        )
    
    db_booking = Booking(**booking_create.dict())
    db.add(db_booking)
    
    # Note: Room status is now calculated dynamically based on current date vs booking dates
    # No need to manually update room status here
    
    db.commit()
    db.refresh(db_booking)
    return db_booking

@app.put("/api/bookings/{booking_id}", response_model=BookingSchema)
async def update_booking(
    booking_id: str,
    booking_update: BookingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a booking."""
    db_booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not db_booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Update fields
    update_data = booking_update.dict(exclude_unset=True)
    
    # Validate dates if they're being updated
    if 'check_in_date' in update_data or 'check_out_date' in update_data:
        check_in = update_data.get('check_in_date', db_booking.check_in_date)
        check_out = update_data.get('check_out_date', db_booking.check_out_date)
        if check_in >= check_out:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Check-out date must be after check-in date"
            )
        
        # Check for overlapping bookings when dates are changed
        overlapping_bookings = db.query(Booking).filter(
            Booking.property_id == db_booking.property_id,
            Booking.id != booking_id,  # Exclude current booking
            Booking.status.in_(["pending", "confirmed", "checked_in"]),  # Include pending bookings
            # Date overlap logic
            Booking.check_out_date > check_in,
            Booking.check_in_date < check_out
        ).first()
        
        if overlapping_bookings:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Property is already booked from {overlapping_bookings.check_in_date} to {overlapping_bookings.check_out_date}"
            )
    
    # Store old status for comparison
    old_status = db_booking.status
    
    for field, value in update_data.items():
        setattr(db_booking, field, value)
    
    # Note: Room status is now calculated dynamically based on current date vs booking dates
    # No need to manually update room status here
    
    db.commit()
    db.refresh(db_booking)
    return db_booking

@app.delete("/api/bookings/{booking_id}")
async def delete_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a booking."""
    db_booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not db_booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Note: Room status is now calculated dynamically based on current date vs booking dates
    # No need to manually update room status here
    
    db.delete(db_booking)
    db.commit()
    
    return {"message": "Booking deleted successfully"}

# Super Admin Endpoints (Tenant Management)
def require_super_admin(current_user: User = Depends(get_current_user)):
    """Dependency to ensure only super admins can access these endpoints."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    return current_user

@app.get("/api/admin/tenants", response_model=List[TenantSchema])
async def get_all_tenants(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Get all tenants (Super admin only)."""
    tenants = db.query(Tenant).order_by(Tenant.created_at.desc()).all()
    return tenants

@app.get("/api/admin/tenants/{tenant_id}", response_model=TenantSchema)
async def get_tenant(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Get a specific tenant (Super admin only)."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    return tenant

@app.post("/api/admin/tenants", response_model=TenantSchema)
async def create_tenant(
    tenant_create: TenantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Create a new tenant (Super admin only)."""
    # Check if subdomain already exists
    existing_tenant = db.query(Tenant).filter(Tenant.subdomain == tenant_create.subdomain).first()
    if existing_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subdomain already exists"
        )
    
    # Check if domain already exists (if provided)
    if tenant_create.domain:
        existing_domain = db.query(Tenant).filter(Tenant.domain == tenant_create.domain).first()
        if existing_domain:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Domain already exists"
            )
    
    # Create tenant
    db_tenant = Tenant(**tenant_create.dict())
    db.add(db_tenant)
    db.commit()
    db.refresh(db_tenant)
    return db_tenant

@app.put("/api/admin/tenants/{tenant_id}", response_model=TenantSchema)
async def update_tenant(
    tenant_id: str,
    tenant_update: TenantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Update a tenant (Super admin only)."""
    db_tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not db_tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Update fields
    update_data = tenant_update.dict(exclude_unset=True)
    
    # Check subdomain uniqueness if being updated
    if "subdomain" in update_data:
        existing_tenant = db.query(Tenant).filter(
            Tenant.subdomain == update_data["subdomain"],
            Tenant.id != tenant_id
        ).first()
        if existing_tenant:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subdomain already exists"
            )
    
    # Check domain uniqueness if being updated
    if "domain" in update_data and update_data["domain"]:
        existing_domain = db.query(Tenant).filter(
            Tenant.domain == update_data["domain"],
            Tenant.id != tenant_id
        ).first()
        if existing_domain:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Domain already exists"
            )
    
    for field, value in update_data.items():
        setattr(db_tenant, field, value)
    
    db.commit()
    db.refresh(db_tenant)
    return db_tenant

@app.delete("/api/admin/tenants/{tenant_id}")
async def delete_tenant(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Delete a tenant (Super admin only). WARNING: This will delete all tenant data!"""
    db_tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not db_tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Get count of related data that will be deleted
    user_count = db.query(User).filter(User.tenant_id == tenant_id).count()
    property_count = db.query(Property).filter(Property.tenant_id == tenant_id).count()
    guest_count = db.query(Guest).filter(Guest.tenant_id == tenant_id).count()
    
    db.delete(db_tenant)
    db.commit()
    
    return {
        "message": "Tenant deleted successfully",
        "deleted_data": {
            "users": user_count,
            "properties": property_count,
            "guests": guest_count
        }
    }

@app.post("/api/admin/tenants/{tenant_id}/admin-user", response_model=UserSchema)
async def create_tenant_admin(
    tenant_id: str,
    user_create: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Create an admin user for a specific tenant (Super admin only)."""
    # Verify tenant exists
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_create.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user with tenant_id and ADMIN role
    hashed_password = AuthService.get_password_hash(user_create.password)
    db_user = User(
        email=user_create.email,
        username=user_create.username,
        hashed_password=hashed_password,
        first_name=user_create.first_name,
        last_name=user_create.last_name,
        role=UserRole.ADMIN,  # Force admin role for tenant admin users
        tenant_id=tenant_id
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Tenant endpoint for frontend detection
@app.get("/api/tenant/current", response_model=TenantSchema)
async def get_current_tenant_info(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get current tenant information (no auth required for tenant detection)."""
    from tenant import get_tenant_from_subdomain
    
    tenant = await get_tenant_from_subdomain(request, db)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    return tenant

# Dashboard endpoint
@app.get("/api/dashboard", response_model=DashboardStats)
async def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard statistics for current user's tenant."""
    try:
        from sqlalchemy import func
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
        
        # Get monthly revenue (handle case where Payment table doesn't exist or is empty)
        current_month = datetime.now().replace(day=1)
        try:
            if current_user.role == UserRole.SUPER_ADMIN:
                # Super admin sees all revenue
                monthly_revenue = db.query(func.sum(Payment.amount)).filter(
                    Payment.payment_date >= current_month,
                    Payment.payment_status == 'completed'
                ).scalar() or 0
            else:
                # Regular users see only their tenant's revenue (via bookings)
                monthly_revenue = db.query(func.sum(Payment.amount)).join(Booking).join(Property).filter(
                    Property.tenant_id == tenant_id,
                    Payment.payment_date >= current_month,
                    Payment.payment_status == 'completed'
                ).scalar() or 0
        except Exception:
            monthly_revenue = 0
        
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

# Public dashboard endpoint (no auth required)
@app.get("/api/dashboard/public")
async def get_public_dashboard(db: Session = Depends(get_db)):
    """Get public dashboard data - basic stats only."""
    try:
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
    except Exception as e:
        return {
            "message": "DarManager API is running",
            "data": {
                "total_properties": 0,
                "active_bookings": 0,
                "monthly_revenue": 0,
                "error": str(e)
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
