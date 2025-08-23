"""
Room management endpoints.
Handles CRUD operations for rooms.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date

from database import get_db
from models import User, Room, Booking
from schemas import Room as RoomSchema, RoomCreate, RoomUpdate, RoomWithStatus
from app.core.security import get_current_user
from app.core.exceptions import NotFoundError, DependencyConflictError

router = APIRouter(prefix="/rooms", tags=["Rooms"])


def calculate_room_status(room: Room, db: Session) -> str:
    """Calculate dynamic room status based on current date and bookings."""
    today = date.today()
    
    # Check for active bookings for this room's property
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
            return "occupied"
    
    # Check if there's a checkout today (needs cleaning)
    checkout_today = db.query(Booking).filter(
        Booking.property_id == room.property_id,
        Booking.status.in_(["confirmed", "checked_in"]),
        Booking.check_out_date == today
    ).first()
    
    if checkout_today:
        return "cleaning"
    
    return room.status or "available"


@router.get("", response_model=List[RoomWithStatus])
async def get_rooms(
    property_id: Optional[str] = Query(None),
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
            'status': calculated_status,
            'keybox_code': room.keybox_code,
            'created_at': room.created_at,
            'updated_at': room.updated_at
        }
        rooms_with_status.append(RoomWithStatus(**room_dict))
    
    return rooms_with_status


@router.get("/{room_id}", response_model=RoomWithStatus)
async def get_room(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single room by ID with calculated dynamic status."""
    db_room = db.query(Room).filter(Room.id == room_id).first()
    if not db_room:
        raise NotFoundError("Room", room_id)
    
    # Calculate dynamic status
    calculated_status = calculate_room_status(db_room, db)
    room_dict = {
        'id': db_room.id,
        'property_id': db_room.property_id,
        'name': db_room.name,
        'description': db_room.description,
        'capacity': db_room.capacity,
        'price_per_night': db_room.price_per_night,
        'status': calculated_status,
        'keybox_code': db_room.keybox_code,
        'created_at': db_room.created_at,
        'updated_at': db_room.updated_at
    }
    return RoomWithStatus(**room_dict)


@router.post("", response_model=RoomSchema)
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


@router.put("/{room_id}", response_model=RoomSchema)
async def update_room(
    room_id: str,
    room_update: RoomUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a room."""
    db_room = db.query(Room).filter(Room.id == room_id).first()
    if not db_room:
        raise NotFoundError("Room", room_id)
    
    update_data = room_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_room, field, value)
    
    db.commit()
    db.refresh(db_room)
    return db_room


@router.delete("/{room_id}")
async def delete_room(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a room with dependency checking."""
    db_room = db.query(Room).filter(Room.id == room_id).first()
    if not db_room:
        raise NotFoundError("Room", room_id)
    
    # Check for dependencies (bookings)
    booking_count = db.query(Booking).filter(Booking.room_id == room_id).count()
    if booking_count > 0:
        raise DependencyConflictError(
            resource=f"room '{db_room.name}'",
            dependencies=f"{booking_count} booking(s)"
        )
    
    db.delete(db_room)
    db.commit()
    
    return {"message": "Room deleted successfully"}