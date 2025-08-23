"""
Tenant management endpoints.
Super admin only endpoints for tenant management.
"""

from typing import List
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from database import get_db
from models import User, Tenant, Property, Guest, Booking
from schemas import (
    Tenant as TenantSchema, TenantCreate, TenantUpdate,
    User as UserSchema, UserCreate
)
from app.core.security import require_super_admin, SecurityService
from app.core.exceptions import NotFoundError, ConflictError

router = APIRouter(tags=["Tenants"])


@router.get("/admin/tenants", response_model=List[TenantSchema])
async def get_all_tenants(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Get all tenants (Super admin only)."""
    tenants = db.query(Tenant).order_by(Tenant.created_at.desc()).all()
    return tenants


@router.get("/admin/tenants/{tenant_id}", response_model=TenantSchema)
async def get_tenant(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Get a specific tenant (Super admin only)."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise NotFoundError("Tenant", tenant_id)
    return tenant


@router.post("/admin/tenants", response_model=TenantSchema)
async def create_tenant(
    tenant_create: TenantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Create a new tenant (Super admin only)."""
    # Check if subdomain already exists
    existing_tenant = db.query(Tenant).filter(Tenant.subdomain == tenant_create.subdomain).first()
    if existing_tenant:
        raise ConflictError("Subdomain already exists")
    
    # Check if domain already exists (if provided)
    if tenant_create.domain:
        existing_domain = db.query(Tenant).filter(Tenant.domain == tenant_create.domain).first()
        if existing_domain:
            raise ConflictError("Domain already exists")
    
    # Create tenant
    db_tenant = Tenant(**tenant_create.dict())
    db.add(db_tenant)
    db.commit()
    db.refresh(db_tenant)
    return db_tenant


@router.put("/admin/tenants/{tenant_id}", response_model=TenantSchema)
async def update_tenant(
    tenant_id: str,
    tenant_update: TenantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Update a tenant (Super admin only)."""
    db_tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not db_tenant:
        raise NotFoundError("Tenant", tenant_id)
    
    # Update fields
    update_data = tenant_update.dict(exclude_unset=True)
    
    # Check subdomain uniqueness if being updated
    if "subdomain" in update_data:
        existing_tenant = db.query(Tenant).filter(
            Tenant.subdomain == update_data["subdomain"],
            Tenant.id != tenant_id
        ).first()
        if existing_tenant:
            raise ConflictError("Subdomain already exists")
    
    # Check domain uniqueness if being updated
    if "domain" in update_data and update_data["domain"]:
        existing_domain = db.query(Tenant).filter(
            Tenant.domain == update_data["domain"],
            Tenant.id != tenant_id
        ).first()
        if existing_domain:
            raise ConflictError("Domain already exists")
    
    for field, value in update_data.items():
        setattr(db_tenant, field, value)
    
    db.commit()
    db.refresh(db_tenant)
    return db_tenant


@router.delete("/admin/tenants/{tenant_id}")
async def delete_tenant(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Delete a tenant (Super admin only). WARNING: This will delete all tenant data!"""
    db_tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not db_tenant:
        raise NotFoundError("Tenant", tenant_id)
    
    # Get count of related data that will be deleted (using raw SQL to avoid loading objects)
    from sqlalchemy import text
    
    # Count related data without loading into SQLAlchemy session
    user_count = db.execute(text("SELECT COUNT(*) FROM users WHERE tenant_id = :tenant_id"), {"tenant_id": tenant_id}).scalar()
    property_count = db.execute(text("SELECT COUNT(*) FROM properties WHERE tenant_id = :tenant_id"), {"tenant_id": tenant_id}).scalar()
    guest_count = db.execute(text("SELECT COUNT(*) FROM guests WHERE tenant_id = :tenant_id"), {"tenant_id": tenant_id}).scalar()
    booking_count = db.execute(text("SELECT COUNT(*) FROM bookings b JOIN properties p ON b.property_id = p.id WHERE p.tenant_id = :tenant_id"), {"tenant_id": tenant_id}).scalar()
    
    # Delete the tenant using raw SQL to bypass SQLAlchemy relationship management
    db.execute(text("DELETE FROM tenants WHERE id = :tenant_id"), {"tenant_id": tenant_id})
    db.commit()
    
    return {
        "message": "Tenant deleted successfully",
        "deleted_data": {
            "users": user_count,
            "properties": property_count,
            "guests": guest_count,
            "bookings": booking_count
        }
    }


@router.post("/admin/tenants/{tenant_id}/admin-user", response_model=UserSchema)
async def create_tenant_admin(
    tenant_id: str,
    user_create: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """Create an admin user for a specific tenant (Super admin only)."""
    from models import UserRole
    
    # Verify tenant exists
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise NotFoundError("Tenant", tenant_id)
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_create.email).first()
    if existing_user:
        raise ConflictError("Email already registered")
    
    # Create user with tenant_id and ADMIN role
    hashed_password = SecurityService.get_password_hash(user_create.password)
    db_user = User(
        email=user_create.email,
        username=user_create.username,
        hashed_password=hashed_password,
        first_name=user_create.first_name,
        last_name=user_create.last_name,
        role=UserRole.ADMIN,
        tenant_id=tenant_id
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.get("/tenant/current", response_model=TenantSchema)
async def get_current_tenant_info(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get current tenant information (no auth required for tenant detection)."""
    from tenant import get_tenant_from_subdomain
    
    tenant = await get_tenant_from_subdomain(request, db)
    if not tenant:
        raise NotFoundError("Tenant", "current")
    
    return tenant