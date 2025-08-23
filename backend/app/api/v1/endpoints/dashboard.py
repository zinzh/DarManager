"""
Dashboard endpoints.
Provides aggregated statistics and metrics.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import User, UserRole, Property, Room, Guest, Booking
from schemas import DashboardStats
from app.core.security import get_current_user
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardStats)
async def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard statistics for current user's tenant."""
    service = DashboardService(db)
    return service.get_dashboard_stats(current_user)