"""
Pydantic schemas for DarManager API.
"""

from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, EmailStr, UUID4
from enum import Enum

# Enum schemas
class BookingStatusSchema(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CHECKED_IN = "checked_in"
    CHECKED_OUT = "checked_out"
    CANCELLED = "cancelled"

class PaymentStatusSchema(str, Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    COMPLETED = "completed"
    REFUNDED = "refunded"

class PaymentMethodSchema(str, Enum):
    CASH = "cash"
    OMT = "omt"
    WHISH = "whish"
    BANK_TRANSFER = "bank_transfer"
    OTHER = "other"

class RoomStatusSchema(str, Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    CLEANING = "cleaning"
    MAINTENANCE = "maintenance"
    OUT_OF_ORDER = "out_of_order"

class UserRoleSchema(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    STAFF = "staff"

# Base schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    first_name: str
    last_name: str
    role: UserRoleSchema = UserRoleSchema.STAFF
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRoleSchema] = None
    is_active: Optional[bool] = None

class User(UserBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Authentication schemas
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenRefresh(BaseModel):
    refresh_token: str

# Property schemas
class PropertyBase(BaseModel):
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    wifi_password: Optional[str] = None

class PropertyCreate(PropertyBase):
    pass

class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    wifi_password: Optional[str] = None

class Property(PropertyBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Room schemas
class RoomBase(BaseModel):
    name: str
    description: Optional[str] = None
    capacity: int = 1
    price_per_night: Optional[Decimal] = None
    status: RoomStatusSchema = RoomStatusSchema.AVAILABLE
    keybox_code: Optional[str] = None

class RoomCreate(RoomBase):
    property_id: UUID4

class RoomUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    capacity: Optional[int] = None
    price_per_night: Optional[Decimal] = None
    status: Optional[RoomStatusSchema] = None
    keybox_code: Optional[str] = None

class Room(RoomBase):
    id: UUID4
    property_id: UUID4
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Guest schemas
class GuestBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    nationality: Optional[str] = None
    id_number: Optional[str] = None
    notes: Optional[str] = None

class GuestCreate(GuestBase):
    pass

class GuestUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    nationality: Optional[str] = None
    id_number: Optional[str] = None
    notes: Optional[str] = None

class Guest(GuestBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Booking schemas
class BookingBase(BaseModel):
    check_in_date: date
    check_out_date: date
    guests_count: int = 1
    total_amount: Optional[Decimal] = None
    status: BookingStatusSchema = BookingStatusSchema.PENDING
    booking_source: Optional[str] = None
    notes: Optional[str] = None

class BookingCreate(BookingBase):
    property_id: UUID4
    room_id: UUID4
    guest_id: UUID4

class BookingUpdate(BaseModel):
    check_in_date: Optional[date] = None
    check_out_date: Optional[date] = None
    guests_count: Optional[int] = None
    total_amount: Optional[Decimal] = None
    status: Optional[BookingStatusSchema] = None
    booking_source: Optional[str] = None
    notes: Optional[str] = None

class Booking(BookingBase):
    id: UUID4
    property_id: UUID4
    room_id: UUID4
    guest_id: UUID4
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Payment schemas
class PaymentBase(BaseModel):
    amount: Decimal
    currency: str = "USD"
    payment_method: PaymentMethodSchema
    payment_status: PaymentStatusSchema = PaymentStatusSchema.PENDING
    receipt_url: Optional[str] = None
    transaction_reference: Optional[str] = None
    payment_date: Optional[datetime] = None
    notes: Optional[str] = None

class PaymentCreate(PaymentBase):
    booking_id: UUID4

class PaymentUpdate(BaseModel):
    amount: Optional[Decimal] = None
    currency: Optional[str] = None
    payment_method: Optional[PaymentMethodSchema] = None
    payment_status: Optional[PaymentStatusSchema] = None
    receipt_url: Optional[str] = None
    transaction_reference: Optional[str] = None
    payment_date: Optional[datetime] = None
    notes: Optional[str] = None

class Payment(PaymentBase):
    id: UUID4
    booking_id: UUID4
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Dashboard schemas
class DashboardStats(BaseModel):
    total_properties: int
    total_rooms: int
    active_bookings: int
    monthly_revenue: Decimal
    occupancy_rate: float
    recent_bookings: List[Booking]

# Response schemas
class MessageResponse(BaseModel):
    message: str

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
