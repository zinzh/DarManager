"""
Reports service layer.
Handles business logic for financial reporting and analytics.
"""

from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import User, UserRole, Guest, Property, Booking
from schemas import GuestRevenue, PropertyRevenue, FinancialReport
from tenant import get_user_tenant_id, validate_tenant_access


class ReportsService:
    """Service class for report-related operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_guest_revenue(self, guest_id: str, user: User) -> Optional[GuestRevenue]:
        """Get total revenue from a specific guest."""
        # Get the guest
        db_guest = self.db.query(Guest).filter(Guest.id == guest_id).first()
        if not db_guest:
            return None
        
        # Validate tenant access
        if not validate_tenant_access(user, str(db_guest.tenant_id)):
            return None
        
        # Calculate total spent by guest (only checked-out bookings)
        total_spent = self.db.query(func.sum(Booking.total_amount)).filter(
            Booking.guest_id == guest_id,
            Booking.status == 'checked_out'
        ).scalar() or 0
        
        # Count bookings
        bookings_count = self.db.query(Booking).filter(
            Booking.guest_id == guest_id,
            Booking.status == 'checked_out'
        ).count()
        
        return GuestRevenue(
            guest_id=db_guest.id,
            guest_name=f"{db_guest.first_name} {db_guest.last_name}",
            total_spent=total_spent,
            bookings_count=bookings_count
        )
    
    def get_property_revenue(self, property_id: str, user: User) -> Optional[PropertyRevenue]:
        """Get total revenue from a specific property."""
        # Get the property
        db_property = self.db.query(Property).filter(Property.id == property_id).first()
        if not db_property:
            return None
        
        # Validate tenant access
        if not validate_tenant_access(user, str(db_property.tenant_id)):
            return None
        
        # Calculate total revenue for property (only checked-out bookings)
        total_revenue = self.db.query(func.sum(Booking.total_amount)).filter(
            Booking.property_id == property_id,
            Booking.status == 'checked_out'
        ).scalar() or 0
        
        # Count bookings
        bookings_count = self.db.query(Booking).filter(
            Booking.property_id == property_id,
            Booking.status == 'checked_out'
        ).count()
        
        return PropertyRevenue(
            property_id=db_property.id,
            property_name=db_property.name,
            total_revenue=total_revenue,
            bookings_count=bookings_count
        )
    
    def get_financial_report(
        self, 
        user: User, 
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> FinancialReport:
        """Get comprehensive financial report for date range."""
        tenant_id = get_user_tenant_id(user)
        
        # Parse dates or use defaults
        if not end_date:
            end_dt = datetime.now().date()
        else:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        if not start_date:
            start_dt = end_dt - timedelta(days=30)
        else:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        
        # Base query for bookings
        base_query = self.db.query(Booking).filter(
            Booking.status == 'checked_out',
            Booking.check_out_date >= start_dt,
            Booking.check_out_date <= end_dt
        )
        
        # Filter by tenant if not super admin
        if user.role != UserRole.SUPER_ADMIN and tenant_id:
            base_query = base_query.join(Property).filter(Property.tenant_id == tenant_id)
        
        bookings = base_query.all()
        
        # Calculate total revenue
        total_revenue = sum(b.total_amount or 0 for b in bookings)
        
        # Get revenue by property
        property_revenues = {}
        for booking in bookings:
            prop_id = str(booking.property_id)
            if prop_id not in property_revenues:
                prop = booking.property
                property_revenues[prop_id] = {
                    'property_id': prop.id,
                    'property_name': prop.name,
                    'total_revenue': 0,
                    'bookings_count': 0
                }
            property_revenues[prop_id]['total_revenue'] += booking.total_amount or 0
            property_revenues[prop_id]['bookings_count'] += 1
        
        # Convert to list of PropertyRevenue objects
        properties = [PropertyRevenue(**data) for data in property_revenues.values()]
        
        # Calculate breakdown by booking source
        booking_sources = {}
        for booking in bookings:
            source = booking.booking_source or 'unknown'
            if source not in booking_sources:
                booking_sources[source] = 0
            booking_sources[source] += booking.total_amount or 0
        
        # Calculate daily revenue
        daily_revenue = {}
        for booking in bookings:
            day = str(booking.check_out_date)
            if day not in daily_revenue:
                daily_revenue[day] = 0
            daily_revenue[day] += booking.total_amount or 0
        
        # Convert daily revenue to list format
        daily_revenue_list = [
            {'date': date, 'revenue': revenue}
            for date, revenue in sorted(daily_revenue.items())
        ]
        
        return FinancialReport(
            start_date=start_dt,
            end_date=end_dt,
            total_revenue=total_revenue,
            properties=properties,
            payment_methods_breakdown={},  # Not using payments table yet
            booking_sources_breakdown=booking_sources,
            daily_revenue=daily_revenue_list
        )