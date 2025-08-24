"""
Authentication endpoints.
Handles user login, registration, and token management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from database import get_db
from models import User, UserRole
from schemas import UserCreate, UserLogin, Token, User as UserSchema
from app.core.security import SecurityService, get_current_user, get_current_admin
from app.core.exceptions import UnauthorizedError, ConflictError
from tenant import get_tenant_from_subdomain

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
async def login(
    user_login: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    """Authenticate user and return JWT tokens with tenant validation."""
    # Get current tenant from subdomain (if any)
    current_tenant = await get_tenant_from_subdomain(request, db)
    
    user = SecurityService.authenticate_user(db, user_login.email, user_login.password)
    if not user:
        raise UnauthorizedError("Incorrect email or password")
    
    # Tenant validation logic
    if current_tenant:
        # If accessing via a specific tenant subdomain
        if user.role == UserRole.SUPER_ADMIN:
            # Super admin can login from any tenant subdomain
            pass
        else:
            # Regular users must login from their own tenant's subdomain
            if not user.tenant_id or str(user.tenant_id) != str(current_tenant.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"You cannot access {current_tenant.name} from this account. Please use your organization's subdomain.",
                )
    else:
        # If accessing via localhost (no tenant subdomain)
        if user.role == UserRole.SUPER_ADMIN:
            # Super admin can login from localhost
            pass
        else:
            # Regular users should be redirected to their tenant subdomain
            if user.tenant_id:
                from models import Tenant
                user_tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
                if user_tenant:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Please access your account at: https://{user_tenant.subdomain}.darmanager.com",
                    )
    
    # Create tokens
    access_token = SecurityService.create_access_token(data={"sub": user.email})
    refresh_token = SecurityService.create_refresh_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/register", response_model=UserSchema)
async def register(
    user_create: UserCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Register a new user (admin only)."""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_create.email).first()
    if existing_user:
        raise ConflictError("Email already registered")
    
    # Create new user
    hashed_password = SecurityService.get_password_hash(user_create.password)
    db_user = User(
        email=user_create.email,
        username=user_create.username,
        first_name=user_create.first_name,
        last_name=user_create.last_name,
        hashed_password=hashed_password,
        role=user_create.role,
        is_active=user_create.is_active
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


@router.get("/me", response_model=UserSchema)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return current_user