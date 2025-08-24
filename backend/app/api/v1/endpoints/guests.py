"""
Guest management endpoints.
Handles CRUD operations for guests with tenant isolation.
"""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import User, Guest
from app.schemas import Guest as GuestSchema, GuestCreate, GuestUpdate
from app.core.security import get_current_user
from app.core.exceptions import NotFoundError
from app.services.guest_service import GuestService

router = APIRouter(prefix="/guests", tags=["Guests"])


@router.get("", response_model=List[GuestSchema])
async def get_guests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all guests for the current user's tenant."""
    service = GuestService(db)
    return service.get_guests_for_user(current_user)


@router.get("/{guest_id}", response_model=GuestSchema)
async def get_guest(
    guest_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific guest with tenant validation."""
    service = GuestService(db)
    guest = service.get_guest_with_validation(guest_id, current_user)
    
    if not guest:
        raise NotFoundError("Guest", guest_id)
    
    return guest


@router.post("", response_model=GuestSchema)
async def create_guest(
    guest_create: GuestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new guest with tenant isolation."""
    service = GuestService(db)
    return service.create_guest(guest_create, current_user)


@router.put("/{guest_id}", response_model=GuestSchema)
async def update_guest(
    guest_id: str,
    guest_update: GuestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a guest with tenant validation."""
    service = GuestService(db)
    guest = service.update_guest(guest_id, guest_update, current_user)
    
    if not guest:
        raise NotFoundError("Guest", guest_id)
    
    return guest


@router.delete("/{guest_id}")
async def delete_guest(
    guest_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a guest with tenant validation."""
    service = GuestService(db)
    
    if not service.delete_guest(guest_id, current_user):
        raise NotFoundError("Guest", guest_id)
    
    return {"message": "Guest deleted successfully"}