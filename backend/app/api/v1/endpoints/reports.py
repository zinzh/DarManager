"""
Financial reports endpoints.
Provides revenue and financial reporting capabilities.
"""

from typing import Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models import User, Booking, Property
from app.schemas import GuestRevenue, PropertyRevenue, FinancialReport
from app.core.security import get_current_user
from app.core.exceptions import NotFoundError
from app.services.reports_service import ReportsService

router = APIRouter(tags=["Reports"])


@router.get("/guests/{guest_id}/revenue", response_model=GuestRevenue)
async def get_guest_revenue(
    guest_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get total revenue from a specific guest (checked-out bookings only)."""
    service = ReportsService(db)
    revenue = service.get_guest_revenue(guest_id, current_user)
    
    if not revenue:
        raise NotFoundError("Guest", guest_id)
    
    return revenue


@router.get("/properties/{property_id}/revenue", response_model=PropertyRevenue)
async def get_property_revenue(
    property_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get total revenue from a specific property (checked-out bookings only)."""
    service = ReportsService(db)
    revenue = service.get_property_revenue(property_id, current_user)
    
    if not revenue:
        raise NotFoundError("Property", property_id)
    
    return revenue


@router.get("/financial-report", response_model=FinancialReport)
async def get_financial_report(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get financial report for specified date range."""
    service = ReportsService(db)
    return service.get_financial_report(current_user, start_date, end_date)