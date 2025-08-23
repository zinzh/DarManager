"""
Property service layer.
Handles business logic for property management.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from models import Property, User, UserRole, Room, Booking
from schemas import PropertyCreate
from tenant import get_user_tenant_id
from app.core.exceptions import DependencyConflictError


class PropertyService:
    """Service class for property-related operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_properties_for_user(self, user: User) -> List[Property]:
        """Get all properties accessible to the user based on their role and tenant."""
        tenant_id = get_user_tenant_id(user)
        
        # Super admin can see all properties
        if user.role == UserRole.SUPER_ADMIN:
            return self.db.query(Property).all()
        
        # Regular users see only their tenant's properties
        if not tenant_id:
            return []
        
        return self.db.query(Property).filter(Property.tenant_id == tenant_id).all()
    
    def get_property_by_id(self, property_id: str) -> Optional[Property]:
        """Get a property by its ID."""
        return self.db.query(Property).filter(Property.id == property_id).first()
    
    def create_property(self, property_data: PropertyCreate, user: User) -> Property:
        """Create a new property with tenant association."""
        tenant_id = get_user_tenant_id(user)
        
        # Super admin must specify which tenant
        if user.role == UserRole.SUPER_ADMIN and not tenant_id:
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
        property_dict = property_data.dict()
        property_dict['tenant_id'] = tenant_id
        
        db_property = Property(**property_dict)
        self.db.add(db_property)
        self.db.commit()
        self.db.refresh(db_property)
        
        return db_property
    
    def update_property(self, property_id: str, property_data: PropertyCreate) -> Property:
        """Update an existing property."""
        db_property = self.get_property_by_id(property_id)
        if not db_property:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found"
            )
        
        # Update fields
        update_data = property_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_property, field, value)
        
        self.db.commit()
        self.db.refresh(db_property)
        
        return db_property
    
    def delete_property(self, property_id: str) -> bool:
        """Delete a property with dependency checking."""
        db_property = self.get_property_by_id(property_id)
        if not db_property:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found"
            )
        
        # Check for dependencies
        dependencies = []
        
        # Check for rooms
        room_count = self.db.query(Room).filter(Room.property_id == property_id).count()
        if room_count > 0:
            dependencies.append(f"{room_count} room(s)")
        
        # Check for bookings
        booking_count = self.db.query(Booking).filter(Booking.property_id == property_id).count()
        if booking_count > 0:
            dependencies.append(f"{booking_count} booking(s)")
        
        if dependencies:
            raise DependencyConflictError(
                resource=f"property '{db_property.name}'",
                dependencies=" and ".join(dependencies)
            )
        
        self.db.delete(db_property)
        self.db.commit()
        
        return True