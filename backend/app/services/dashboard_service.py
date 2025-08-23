"""
Dashboard service layer.
Handles business logic for dashboard statistics and metrics.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from models import User, UserRole, Property, Room, Guest, Booking
from schemas import DashboardStats
from tenant import get_user_tenant_id


class DashboardService:
    """Service class for dashboard-related operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_dashboard_stats(self, user: User) -> DashboardStats:
        """Get dashboard statistics based on user's role and tenant."""
        try:
            tenant_id = get_user_tenant_id(user)
            
            # For super admin, show aggregated stats across all tenants
            if user.role == UserRole.SUPER_ADMIN:
                # Get counts across all tenants
                total_properties = self.db.query(Property).count()
                total_rooms = self.db.query(Room).count()
                total_guests = self.db.query(Guest).count()
                active_bookings = self.db.query(Booking).filter(
                    Booking.status.in_(['confirmed', 'checked_in'])
                ).count()
                
                # Get recent bookings across all tenants
                recent_bookings = self.db.query(Booking).order_by(
                    Booking.created_at.desc()
                ).limit(5).all()
                
                # Get total revenue from all checked-out bookings
                total_revenue = self.db.query(func.sum(Booking.total_amount)).filter(
                    Booking.status == 'checked_out'
                ).scalar() or 0
            else:
                # For regular users, filter by tenant
                if not tenant_id:
                    # User has no tenant, return zeros
                    return DashboardStats(
                        total_properties=0,
                        total_rooms=0,
                        total_guests=0,
                        active_bookings=0,
                        monthly_revenue=0.0,
                        occupancy_rate=0.0,
                        recent_bookings=[]
                    )
                
                # Get counts for current tenant only
                total_properties = self.db.query(Property).filter(
                    Property.tenant_id == tenant_id
                ).count()
                
                total_guests = self.db.query(Guest).filter(
                    Guest.tenant_id == tenant_id
                ).count()
                
                # Count rooms for properties belonging to this tenant
                total_rooms = self.db.query(Room).join(Property).filter(
                    Property.tenant_id == tenant_id
                ).count()
                
                # Count active bookings for properties belonging to this tenant
                active_bookings = self.db.query(Booking).join(Property).filter(
                    Property.tenant_id == tenant_id,
                    Booking.status.in_(['confirmed', 'checked_in'])
                ).count()
                
                # Get recent bookings for this tenant's properties
                recent_bookings = self.db.query(Booking).join(Property).filter(
                    Property.tenant_id == tenant_id
                ).order_by(Booking.created_at.desc()).limit(5).all()
                
                # Get revenue for this tenant
                total_revenue = self.db.query(func.sum(Booking.total_amount)).join(Property).filter(
                    Property.tenant_id == tenant_id,
                    Booking.status == 'checked_out'
                ).scalar() or 0
            
            # For backward compatibility, keep monthly_revenue as total_revenue for now
            monthly_revenue = total_revenue
            
            # Calculate occupancy rate (simplified)
            occupancy_rate = 0.0
            if total_rooms > 0:
                occupancy_rate = (active_bookings / total_rooms) * 100
            
            return DashboardStats(
                total_properties=total_properties,
                total_rooms=total_rooms,
                total_guests=total_guests,
                active_bookings=active_bookings,
                monthly_revenue=float(monthly_revenue),
                occupancy_rate=occupancy_rate,
                recent_bookings=recent_bookings or []
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error retrieving dashboard data: {str(e)}"
            )