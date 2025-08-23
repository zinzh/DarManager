"""
Main API router that combines all v1 endpoints.
Central routing configuration for the API.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, properties, bookings, guests, rooms, dashboard, tenants, reports

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router)
api_router.include_router(properties.router)
api_router.include_router(bookings.router)
api_router.include_router(guests.router)
api_router.include_router(rooms.router)
api_router.include_router(dashboard.router)
api_router.include_router(reports.router)
api_router.include_router(tenants.router)