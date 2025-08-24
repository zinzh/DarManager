"""
Booking management endpoints.
Handles CRUD operations for bookings with validation and tenant isolation.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import User, Booking
from app.schemas import Booking as BookingSchema, BookingCreate, BookingUpdate
from app.core.security import get_current_user
from app.core.exceptions import NotFoundError
from app.services.booking_service import BookingService

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.get("", response_model=List[BookingSchema])
async def get_bookings(
    guest_id: Optional[str] = Query(None),
    property_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all bookings for the current user's tenant."""
    service = BookingService(db)
    return service.get_bookings_for_user(current_user, guest_id, property_id)


@router.get("/{booking_id}", response_model=BookingSchema)
async def get_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific booking with tenant validation."""
    service = BookingService(db)
    booking = service.get_booking_with_validation(booking_id, current_user)
    
    if not booking:
        raise NotFoundError("Booking", booking_id)
    
    return booking


@router.post("", response_model=BookingSchema)
async def create_booking(
    booking_create: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new booking with validation."""
    service = BookingService(db)
    return service.create_booking(booking_create, current_user)


@router.put("/{booking_id}", response_model=BookingSchema)
async def update_booking(
    booking_id: str,
    booking_update: BookingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a booking."""
    service = BookingService(db)
    booking = service.update_booking(booking_id, booking_update, current_user)
    
    if not booking:
        raise NotFoundError("Booking", booking_id)
    
    return booking


@router.delete("/{booking_id}")
async def delete_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a booking."""
    service = BookingService(db)
    
    if not service.delete_booking(booking_id, current_user):
        raise NotFoundError("Booking", booking_id)
    
    return {"message": "Booking deleted successfully"}