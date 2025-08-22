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
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MANAGER = "manager"
    STAFF = "staff"

# Base schemas
class TenantBase(BaseModel):
    name: str
    subdomain: str
    domain: Optional[str] = None
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    is_active: bool = True

class TenantCreate(TenantBase):
    pass

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    is_active: Optional[bool] = None

class Tenant(TenantBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: EmailStr
    username: str
    first_name: str
    last_name: str
    role: UserRoleSchema = UserRoleSchema.STAFF
    tenant_id: Optional[UUID4] = None  # None for super admin
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
    price_per_night: Optional[Decimal] = None
    max_guests: int = 1

class PropertyCreateBase(BaseModel):
    """Property creation without tenant_id (will be set by backend)"""
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    wifi_password: Optional[str] = None
    price_per_night: Optional[Decimal] = None
    max_guests: int = 1

class PropertyCreate(PropertyCreateBase):
    pass

class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    wifi_password: Optional[str] = None
    price_per_night: Optional[Decimal] = None
    max_guests: Optional[int] = None

class Property(PropertyBase):
    id: UUID4
    tenant_id: UUID4
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
    status: str = "available"  # Use string instead of enum
    keybox_code: Optional[str] = None

class RoomCreate(BaseModel):
    property_id: UUID4
    name: str
    description: Optional[str] = None
    capacity: int = 1
    price_per_night: Optional[Decimal] = None
    status: str = "available"  # Use string instead of enum for creation
    keybox_code: Optional[str] = None

class RoomUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    capacity: Optional[int] = None
    price_per_night: Optional[Decimal] = None
    status: Optional[str] = None
    keybox_code: Optional[str] = None

class Room(RoomBase):
    id: UUID4
    property_id: UUID4
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class RoomWithStatus(BaseModel):
    """Room schema with calculated dynamic status."""
    id: UUID4
    property_id: UUID4
    name: str
    description: Optional[str] = None
    capacity: int = 1
    price_per_night: Optional[Decimal] = None
    status: str  # This will be the calculated status
    keybox_code: Optional[str] = None
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

class GuestCreateBase(BaseModel):
    """Guest creation without tenant_id (will be set by backend)"""
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    nationality: Optional[str] = None
    id_number: Optional[str] = None
    notes: Optional[str] = None

class GuestCreate(GuestCreateBase):
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
    tenant_id: UUID4
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
    status: str = "pending"  # Use string instead of enum
    booking_source: Optional[str] = None
    notes: Optional[str] = None

class BookingCreate(BookingBase):
    property_id: UUID4
    room_id: Optional[UUID4] = None  # Optional for property-level bookings
    guest_id: UUID4

class BookingUpdate(BaseModel):
    check_in_date: Optional[date] = None
    check_out_date: Optional[date] = None
    guests_count: Optional[int] = None
    total_amount: Optional[Decimal] = None
    status: Optional[str] = None
    booking_source: Optional[str] = None
    notes: Optional[str] = None

class Booking(BookingBase):
    id: UUID4
    property_id: UUID4
    room_id: Optional[UUID4] = None  # Optional for property-level bookings
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
    total_guests: int
    active_bookings: int
    monthly_revenue: Decimal
    occupancy_rate: float
    recent_bookings: List[Booking]

# Revenue and Financial schemas
class RevenueStats(BaseModel):
    total_revenue: Decimal
    period: str
    breakdown: Optional[dict] = None
    
class PropertyRevenue(BaseModel):
    property_id: UUID4
    property_name: str
    total_revenue: Decimal
    bookings_count: int
    
class GuestRevenue(BaseModel):
    guest_id: UUID4
    guest_name: str
    total_spent: Decimal
    bookings_count: int

class FinancialReport(BaseModel):
    start_date: date
    end_date: date
    total_revenue: Decimal
    properties: List[PropertyRevenue]
    payment_methods_breakdown: dict
    booking_sources_breakdown: dict
    daily_revenue: List[dict]

# Response schemas
class MessageResponse(BaseModel):
    message: str

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
