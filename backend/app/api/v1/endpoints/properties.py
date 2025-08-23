"""
Property management endpoints.
Handles CRUD operations for properties with tenant isolation.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Property, User, UserRole
from schemas import Property as PropertySchema, PropertyCreate
from app.core.security import get_current_user
from app.core.exceptions import NotFoundError, ForbiddenError
from app.services.property_service import PropertyService
from tenant import get_user_tenant_id, validate_tenant_access

router = APIRouter(prefix="/properties", tags=["Properties"])


@router.get("", response_model=List[PropertySchema])
async def get_properties(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all properties for the current user's tenant."""
    service = PropertyService(db)
    return service.get_properties_for_user(current_user)


@router.get("/{property_id}", response_model=PropertySchema)
async def get_property(
    property_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single property by ID with tenant validation."""
    service = PropertyService(db)
    property = service.get_property_by_id(property_id)
    
    if not property:
        raise NotFoundError("Property", property_id)
    
    # Validate tenant access
    if not validate_tenant_access(current_user, str(property.tenant_id)):
        raise NotFoundError("Property", property_id)  # Don't reveal that it exists
    
    return property


@router.post("", response_model=PropertySchema)
async def create_property(
    property_create: PropertyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new property."""
    service = PropertyService(db)
    return service.create_property(property_create, current_user)


@router.put("/{property_id}", response_model=PropertySchema)
async def update_property(
    property_id: str,
    property_update: PropertyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a property with tenant validation."""
    service = PropertyService(db)
    property = service.get_property_by_id(property_id)
    
    if not property:
        raise NotFoundError("Property", property_id)
    
    # Validate tenant access
    if not validate_tenant_access(current_user, str(property.tenant_id)):
        raise NotFoundError("Property", property_id)
    
    return service.update_property(property_id, property_update)


@router.delete("/{property_id}")
async def delete_property(
    property_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a property with tenant validation."""
    service = PropertyService(db)
    property = service.get_property_by_id(property_id)
    
    if not property:
        raise NotFoundError("Property", property_id)
    
    # Validate tenant access
    if not validate_tenant_access(current_user, str(property.tenant_id)):
        raise NotFoundError("Property", property_id)
    
    service.delete_property(property_id)
    return {"message": "Property deleted successfully"}