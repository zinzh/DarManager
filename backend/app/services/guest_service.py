"""
Guest service layer.
Handles business logic for guest management.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from models import Guest, User, UserRole, Booking
from schemas import GuestCreate, GuestUpdate
from tenant import get_user_tenant_id, validate_tenant_access
from app.core.exceptions import DependencyConflictError


class GuestService:
    """Service class for guest-related operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_guests_for_user(self, user: User) -> List[Guest]:
        """Get all guests accessible to the user based on their role and tenant."""
        tenant_id = get_user_tenant_id(user)
        
        # Super admin can see all guests
        if user.role == UserRole.SUPER_ADMIN:
            return self.db.query(Guest).order_by(Guest.created_at.desc()).all()
        
        # Regular users see only their tenant's guests
        if not tenant_id:
            return []
        
        return self.db.query(Guest).filter(
            Guest.tenant_id == tenant_id
        ).order_by(Guest.created_at.desc()).all()
    
    def get_guest_with_validation(self, guest_id: str, user: User) -> Optional[Guest]:
        """Get a guest with tenant validation."""
        guest = self.db.query(Guest).filter(Guest.id == guest_id).first()
        
        if not guest:
            return None
        
        # Validate tenant access
        if not validate_tenant_access(user, str(guest.tenant_id)):
            return None
        
        return guest
    
    def create_guest(self, guest_data: GuestCreate, user: User) -> Guest:
        """Create a new guest with tenant association."""
        tenant_id = get_user_tenant_id(user)
        
        # Super admin must specify which tenant
        if user.role == UserRole.SUPER_ADMIN and not tenant_id:
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
        guest_dict = guest_data.dict()
        guest_dict['tenant_id'] = tenant_id
        
        db_guest = Guest(**guest_dict)
        self.db.add(db_guest)
        self.db.commit()
        self.db.refresh(db_guest)
        
        return db_guest
    
    def update_guest(self, guest_id: str, guest_data: GuestUpdate, user: User) -> Optional[Guest]:
        """Update an existing guest with validation."""
        guest = self.get_guest_with_validation(guest_id, user)
        if not guest:
            return None
        
        # Update fields
        update_data = guest_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(guest, field, value)
        
        self.db.commit()
        self.db.refresh(guest)
        
        return guest
    
    def delete_guest(self, guest_id: str, user: User) -> bool:
        """Delete a guest with validation and dependency checking."""
        guest = self.get_guest_with_validation(guest_id, user)
        if not guest:
            return False
        
        # Check for dependencies (bookings)
        booking_count = self.db.query(Booking).filter(Booking.guest_id == guest_id).count()
        if booking_count > 0:
            raise DependencyConflictError(
                resource=f"guest '{guest.first_name} {guest.last_name}'",
                dependencies=f"{booking_count} booking(s)"
            )
        
        self.db.delete(guest)
        self.db.commit()
        
        return True