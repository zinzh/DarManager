# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DarManager is a multi-tenant SaaS platform for guesthouse management, specifically designed for the Lebanese market. It handles bookings from WhatsApp, Instagram, phone calls, and cash-based payments (OMT, Whish, bank transfers).

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript, React 18, Tailwind CSS
- **Backend**: Python FastAPI with async support, SQLAlchemy ORM
- **Database**: PostgreSQL 15 with UUID primary keys
- **Infrastructure**: Docker Compose, Nginx reverse proxy
- **Authentication**: JWT with passlib bcrypt

## Essential Commands

### Development
```bash
# Start all services
docker-compose up --build

# Windows quick start
start.bat

# Unix/Mac quick start
./start.sh

# Access points
# Frontend: http://localhost
# API Docs: http://localhost/api/docs
# Database: localhost:5432 (user: darmanager_user, db: darmanager)
```

### Frontend Commands
```bash
# Development server
npm run dev

# Build production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

### Backend Commands
```bash
# Install dependencies
pip install -r requirements.txt

# Run development server (inside container)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Database Access
```bash
docker-compose exec database psql -U darmanager_user -d darmanager
```

## Architecture Overview

### Multi-Tenant Architecture
The system implements complete tenant isolation:
- Each tenant has a subdomain (e.g., `tenant.darmanager.com`)
- All business entities (Properties, Guests, Bookings, Rooms) are tenant-scoped
- Super Admin role manages tenants from `/admin` dashboard
- Tenant context is managed via `backend/tenant.py`

### Key Backend Modules
- `backend/main.py`: FastAPI application with all API endpoints
- `backend/models.py`: SQLAlchemy ORM models with tenant relationships
- `backend/schemas.py`: Pydantic schemas for request/response validation
- `backend/auth.py`: JWT authentication and authorization
- `backend/database.py`: Database connection and session management
- `backend/tenant.py`: Multi-tenant context and middleware

### Frontend Structure
- `frontend/src/app/`: Next.js app router pages
  - `page.tsx`: Public landing page
  - `login/`: Tenant-specific login
  - `dashboard/`: Main authenticated area
  - `admin/`: Super admin dashboard
  - `onboarding/`: New tenant setup
- `frontend/src/contexts/TenantContext.tsx`: Tenant state management

### API Endpoints Pattern
- Public: `/api/public/*` - No authentication required
- Auth: `/api/auth/*` - Login, register, profile
- Tenant: `/api/{resource}` - Tenant-scoped resources (properties, guests, bookings)
- Admin: `/api/admin/*` - Super admin only (tenant management)

## Business Logic & Constraints

### Lebanese Business Model
- **Whole Property Rental**: Properties are rented as complete units, not individual rooms
- **Room Management**: Rooms exist for space organization but inherit property pricing
- **Payment Methods**: Cash-focused (OMT, Whish, bank transfers)
- **Booking Sources**: WhatsApp, Instagram, phone, walk-in, referral
- **Multi-Currency**: Support for LBP and USD

### Booking System Rules
1. No overlapping bookings on the same property
2. Room status automatically updates based on booking dates:
   - "occupied" during active stay
   - "cleaning" on checkout day
   - Otherwise uses manual status or "available"
3. Bookings cascade delete when properties are deleted
4. Guest capacity validation prevents overbooking

### Status Enums
- **Booking Status**: pending, confirmed, checked_in, checked_out, cancelled
- **Room Status**: available, occupied, cleaning, maintenance, out_of_order
- **User Roles**: SUPER_ADMIN, ADMIN, MANAGER, STAFF

## Development Guidelines

### Database Migrations
When modifying database schema:
1. Update `database/init_multitenant.sql` for fresh installs
2. Create migration script in `database/migrate_*.sql`
3. Update SQLAlchemy models in `backend/models.py`
4. Update Pydantic schemas in `backend/schemas.py`

### Adding New Features
1. Start with database schema and backend API
2. Implement frontend pages in `frontend/src/app/dashboard/`
3. Ensure tenant isolation in all queries
4. Add proper error handling and validation
5. Test with multiple tenants to verify isolation

### Common Patterns
- All list endpoints filter by `tenant_id`
- Use `get_current_user` dependency for auth
- Frontend stores auth token in localStorage
- API calls include `Authorization: Bearer {token}` header
- Tenant context passed via `X-Tenant-Subdomain` header

## Testing Credentials

### Super Admin
- Email: admin@darmanager.com
- Password: admin123
- Access: `/admin-login` → `/admin`

### Test Tenant Admin
- Subdomain: test.localhost
- Email: test@darmanager.com
- Password: test123
- Access: `/login` → `/dashboard`

## Critical Files to Review

Before making changes, review:
- `backend/models.py` - Database schema and relationships
- `backend/tenant.py` - Multi-tenant logic
- `frontend/src/contexts/TenantContext.tsx` - Frontend tenant handling
- `database/init_multitenant.sql` - Current database schema
- `CURSOR_MEMORY.md` - Detailed development history and decisions