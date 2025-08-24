"""
Booking service layer.
Handles business logic for booking management.
"""

from typing import List, Optional
from datetime import date
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from models import Booking, User, UserRole, Property, Guest
from schemas import BookingCreate, BookingUpdate
from tenant import get_user_tenant_id, validate_tenant_access
from app.core.exceptions import NotFoundError, ConflictError, ValidationError, DependencyConflictError


class BookingService:
    """Service class for booking-related operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_bookings_for_user(
        self, 
        user: User, 
        guest_id: Optional[str] = None,
        property_id: Optional[str] = None
    ) -> List[Booking]:
        """Get bookings accessible to the user with optional filters."""
        tenant_id = get_user_tenant_id(user)
        
        # Start with base query
        query = self.db.query(Booking)
        
        # Filter out bookings with null property_id or guest_id
        query = query.filter(Booking.property_id.isnot(None), Booking.guest_id.isnot(None))
        
        # Add tenant filtering
        if user.role == UserRole.SUPER_ADMIN:
            # Super admin can see all bookings
            pass
        else:
            if not tenant_id:
                return []
            # Join with properties to filter by tenant
            query = query.join(Property).filter(Property.tenant_id == tenant_id)
        
        # Apply additional filters
        if guest_id:
            query = query.filter(Booking.guest_id == guest_id)
        if property_id:
            query = query.filter(Booking.property_id == property_id)
        
        return query.order_by(Booking.created_at.desc()).all()
    
    def get_booking_with_validation(self, booking_id: str, user: User) -> Optional[Booking]:
        """Get a booking with tenant validation."""
        booking = self.db.query(Booking).filter(Booking.id == booking_id).first()
        
        if not booking:
            return None
        
        # Validate tenant access (booking inherits tenant from property)
        if user.role != UserRole.SUPER_ADMIN:
            tenant_id = get_user_tenant_id(user)
            if not tenant_id:
                return None
            
            # Check if booking's property belongs to user's tenant
            property_obj = self.db.query(Property).filter(Property.id == booking.property_id).first()
            if not property_obj or str(property_obj.tenant_id) != tenant_id:
                return None
        
        return booking
    
    def create_booking(self, booking_data: BookingCreate, user: User) -> Booking:
        """Create a new booking with comprehensive validation."""
        # Validate property exists and user has access
        property_exists = self.db.query(Property).filter(Property.id == booking_data.property_id).first()
        if not property_exists:
            raise NotFoundError("Property", booking_data.property_id)
        
        # Validate tenant access to property
        if not validate_tenant_access(user, str(property_exists.tenant_id)):
            raise NotFoundError("Property", booking_data.property_id)
        
        # Validate guest exists and belongs to same tenant
        guest_exists = self.db.query(Guest).filter(Guest.id == booking_data.guest_id).first()
        if not guest_exists:
            raise NotFoundError("Guest", booking_data.guest_id)
        
        # Validate tenant access to guest
        if not validate_tenant_access(user, str(guest_exists.tenant_id)):
            raise NotFoundError("Guest", booking_data.guest_id)
        
        # Validate dates
        if booking_data.check_in_date >= booking_data.check_out_date:
            raise ValidationError("Check-out date must be after check-in date")
        
        # Check for overlapping bookings
        overlapping_bookings = self.db.query(Booking).filter(
            Booking.property_id == booking_data.property_id,
            Booking.status.in_(["pending", "confirmed", "checked_in"]),
            Booking.check_out_date > booking_data.check_in_date,
            Booking.check_in_date < booking_data.check_out_date
        ).first()
        
        if overlapping_bookings:
            raise ConflictError(
                f"Property is already booked from {overlapping_bookings.check_in_date} to {overlapping_bookings.check_out_date}"
            )
        
        # Create booking
        db_booking = Booking(**booking_data.dict())
        self.db.add(db_booking)
        self.db.commit()
        self.db.refresh(db_booking)
        
        return db_booking
    
    def update_booking(self, booking_id: str, booking_data: BookingUpdate, user: User) -> Optional[Booking]:
        """Update an existing booking with validation."""
        booking = self.get_booking_with_validation(booking_id, user)
        if not booking:
            return None
        
        # Update fields
        update_data = booking_data.dict(exclude_unset=True)
        
        # Validate dates if they're being updated
        if 'check_in_date' in update_data or 'check_out_date' in update_data:
            check_in = update_data.get('check_in_date', booking.check_in_date)
            check_out = update_data.get('check_out_date', booking.check_out_date)
            
            if check_in >= check_out:
                raise ValidationError("Check-out date must be after check-in date")
            
            # Check for overlapping bookings when dates are changed
            overlapping_bookings = self.db.query(Booking).filter(
                Booking.property_id == booking.property_id,
                Booking.id != booking_id,
                Booking.status.in_(["pending", "confirmed", "checked_in"]),
                Booking.check_out_date > check_in,
                Booking.check_in_date < check_out
            ).first()
            
            if overlapping_bookings:
                raise ConflictError(
                    f"Property is already booked from {overlapping_bookings.check_in_date} to {overlapping_bookings.check_out_date}"
                )
        
        for field, value in update_data.items():
            setattr(booking, field, value)
        
        self.db.commit()
        self.db.refresh(booking)
        
        return booking
    
    def delete_booking(self, booking_id: str, user: User) -> bool:
        """Delete a booking with validation."""
        booking = self.get_booking_with_validation(booking_id, user)
        if not booking:
            return False
        
        self.db.delete(booking)
        self.db.commit()
        
        return True