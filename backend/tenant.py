"""
Tenant context and middleware for multi-tenant support.
"""

from typing import Optional
from fastapi import Request, HTTPException, Depends
from sqlalchemy.orm import Session
import threading

from models import Tenant, User
from database import get_db

# Thread-local storage for tenant context
_tenant_context = threading.local()

class TenantContext:
    """Thread-local tenant context."""
    
    def __init__(self):
        self.tenant_id: Optional[str] = None
        self.tenant: Optional[Tenant] = None
        self.user: Optional[User] = None

def get_tenant_context() -> TenantContext:
    """Get the current tenant context."""
    if not hasattr(_tenant_context, 'context'):
        _tenant_context.context = TenantContext()
    return _tenant_context.context

def set_tenant_context(tenant_id: Optional[str], tenant: Optional[Tenant] = None, user: Optional[User] = None):
    """Set the current tenant context."""
    context = get_tenant_context()
    context.tenant_id = tenant_id
    context.tenant = tenant
    context.user = user

def clear_tenant_context():
    """Clear the current tenant context."""
    context = get_tenant_context()
    context.tenant_id = None
    context.tenant = None
    context.user = None

async def get_tenant_from_subdomain(request: Request, db: Session) -> Optional[Tenant]:
    """Extract tenant from subdomain in the request."""
    # First, check for the X-Tenant-Subdomain header (set by Nginx)
    subdomain = request.headers.get("x-tenant-subdomain")
    
    if not subdomain:
        # Fallback: extract from host header directly
        host = request.headers.get("host", "")
        
        # Handle different host patterns:
        # - localhost (development)
        # - tenant.localhost (development with subdomain)
        # - tenant.darmanager.com (production)
        
        if host in ["localhost", "localhost:3000", "localhost:80"]:
            # Development mode - no tenant filtering for now
            return None
        
        # Extract subdomain from host
        if ".localhost" in host:
            # tenant.localhost -> tenant
            subdomain = host.split(".localhost")[0]
        elif ".darmanager.net" in host:
            # tenant.darmanager.net -> tenant
            subdomain = host.split(".darmanager.net")[0]
    
    if not subdomain:
        return None
    
    # Find tenant by subdomain
    tenant = db.query(Tenant).filter(
        Tenant.subdomain == subdomain,
        Tenant.is_active == True
    ).first()
    
    return tenant

async def get_current_tenant(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[Tenant]:
    """Get current tenant from request context."""
    return await get_tenant_from_subdomain(request, db)

async def require_tenant(
    request: Request,
    db: Session = Depends(get_db)
) -> Tenant:
    """Require a valid tenant context (for tenant-specific endpoints)."""
    tenant = await get_tenant_from_subdomain(request, db)
    if not tenant:
        raise HTTPException(
            status_code=404,
            detail="Tenant not found. Please access via your subdomain (e.g., yourname.darmanager.net)"
        )
    return tenant

def get_user_tenant_id(user: User) -> Optional[str]:
    """Get tenant ID for a user. Super admins have no tenant."""
    from models import UserRole
    
    if user.role == UserRole.SUPER_ADMIN:
        return None  # Super admin can access all tenants
    
    return str(user.tenant_id) if user.tenant_id else None

def validate_tenant_access(user: User, tenant_id: Optional[str]) -> bool:
    """Validate that a user can access resources for a given tenant."""
    from models import UserRole
    
    # Super admin can access everything
    if user.role == UserRole.SUPER_ADMIN:
        return True
    
    # Regular users can only access their own tenant
    user_tenant_id = get_user_tenant_id(user)
    return user_tenant_id == tenant_id
