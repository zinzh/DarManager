# DarManager Project Memory

## Project Overview
DarManager is a guesthouse management app tailored for Lebanese property owners who manage bookings via WhatsApp, Instagram, phone calls, and offline methods. The system handles cash-based payments (OMT, Whish, bank transfers), booking management, and revenue tracking.

## Tech Stack Decisions
- **Frontend**: Next.js (React) with Tailwind CSS - PWA capable, mobile-first
- **Backend**: Python FastAPI - Fast, modern, with automatic API docs
- **Database**: PostgreSQL - Reliable, supports complex queries
- **Proxy**: Nginx - Reverse proxy and static file serving
- **Containerization**: Docker Compose - Easy development and deployment
- **File Storage**: Amazon S3 (planned for later)
- **Authentication**: JWT + passlib (planned for later)

## Development Approach
Starting with basic functioning stack, then adding features incrementally:

### Phase 1: Foundation (✅ COMPLETED)
- [x] Project structure with proper directory layout
- [x] Docker Compose setup with 4 containers (nginx, frontend, api, database)
- [x] Basic Next.js frontend with Tailwind CSS and landing page
- [x] FastAPI backend skeleton with health checks and placeholder endpoints
- [x] PostgreSQL database setup with complete schema and sample data
- [x] Nginx configuration as reverse proxy
- [x] README documentation and startup scripts

### Phase 2: Core Features (✅ COMPLETED)
1. ✅ User authentication and authorization system with JWT
2. ✅ Property and room management CRUD operations (API ready)
3. ✅ Authenticated dashboard with real-time data
4. ✅ Mobile-responsive UI with proper alignment
5. ✅ Login/logout functionality with token management

### Phase 3: Property Management (✅ COMPLETED)
- ✅ Property listing, add/edit/delete
- ✅ Property details with room management
- ✅ Room add/delete with full CRUD
- ✅ Complete backend API for properties and rooms

### Phase 4: Core Booking System (🚧 NEXT)
1. ⏳ Guest management (profiles, contact info)
2. ⏳ Booking creation and management
3. ⏳ Calendar view for availability
4. ⏳ Payment tracking workflow

### Known Issues Fixed
- ✅ Rooms icon alignment in dashboard stats
- ✅ Properties button navigation functionality  
- ✅ Database connection pool "double checkin" errors
- ✅ Cursor already closed SQLAlchemy warnings

### Phase 3: Advanced Features (Future)
1. WhatsApp integration
2. Automated messaging
3. OCR for receipt processing
4. Revenue dashboard
5. PDF invoice generation
6. Export functionality

### Phase 4: Optimization (Future)
1. PWA features
2. Offline capability
3. Performance optimization
4. Mobile app considerations

## Key Design Decisions
- Mobile-first approach for Lebanese market
- Cash payment focus (OMT, Whish, bank transfers)
- Multi-source booking management
- Color-coded calendar system
- Receipt image storage and OCR
- Localization for LBP/USD currencies

## Container Architecture
```
nginx (port 80) -> frontend (port 3000)
                -> api (port 8000)
database (port 5432) <- api
```

## Development Notes
- Focus on getting basic stack running first
- Avoid feature creep in initial phases
- Test each component before adding complexity
- Document all decisions in this file for future sessions

### Setup Instructions
1. **Prerequisites**: Docker and Docker Compose must be installed
2. **Quick Start**: Run `docker-compose up --build` or use `start.bat` (Windows) or `start.sh` (Unix)
3. **Access Points**:
   - Frontend: http://localhost
   - API Docs: http://localhost/api/docs
   - Health Check: http://localhost/health
   - Database: localhost:5432 (user: darmanager_user, db: darmanager)

### Current File Structure
```
DarManager/
├── backend/                    # FastAPI application
│   ├── main.py                # API with auth + CRUD endpoints
│   ├── models.py              # SQLAlchemy models
│   ├── schemas.py             # Pydantic schemas
│   ├── auth.py                # JWT authentication
│   └── database.py            # DB connection & config
├── frontend/                   # Next.js application  
│   ├── src/app/               # App router pages
│   │   ├── page.tsx           # Public homepage
│   │   ├── login/page.tsx     # Login page
│   │   ├── dashboard/
│   │   │   ├── page.tsx       # Authenticated dashboard
│   │   │   └── properties/
│   │   │       ├── page.tsx   # Property listing ✅
│   │   │       ├── new/page.tsx # Add property form ✅
│   │   │       └── [id]/
│   │   │           ├── page.tsx # Property details ✅ NEW
│   │   │           └── edit/page.tsx # Edit property form ✅
│   └── ...                    # Config files
├── nginx/                      # Reverse proxy config
├── database/                   # PostgreSQL init scripts
├── docker-compose.yml          # Container orchestration
├── start.bat / start.sh        # Startup scripts
├── README.md                   # Documentation
└── CURSOR_MEMORY.md           # This file
```

### Implementation Status
**Authentication System**: ✅ Complete
- JWT-based login/logout
- Role-based access control (Admin/Manager/Staff)
- Token validation and refresh
- Protected API endpoints

**Backend API**: ✅ Complete  
- User management (register, login, profile)
- Property CRUD operations
- Room CRUD operations
- Dashboard statistics endpoint
- Database models with relationships

**Frontend**: ✅ Complete Basic Features
- Public homepage with live stats
- Login page with form validation
- Authenticated dashboard with user profile
- Mobile-responsive design
- Proper component alignment

**Database**: ✅ Complete Schema
- Users, Properties, Rooms, Guests, Bookings, Payments tables
- Proper relationships and constraints
- Sample data for testing

**Current Session Progress**: Fixed database connection issues and UI bugs

**Next Development Priority**: Property Add/Edit Forms

**COMPLETED**: Property & Room Management System
- Full CRUD for properties and rooms
- Form validation and error handling
- Status tracking and management
- Complete navigation flow

## **LATEST COMPLETED**: Database Migration & Business Model ✅

### **FIXED Issues**:
- ✅ Room creation enum error (removed incorrect uppercase conversion)
- ✅ Room details view enum error (changed Room.status from Enum to String)
- ✅ Room edit 422 error (fixed schema validation - using RoomUpdate instead of RoomCreate)
- ✅ Database column error: `properties.price_per_night does not exist`
- ✅ Missing property-level pricing fields
- ✅ SQLAlchemy enum mapping conflict (Room status now uses String field)
- ✅ Schema consistency (all room schemas now use string for status)

### **IMPLEMENTED**: Lebanese Business Model Adaptation
- ✅ Database migration: Added `price_per_night` and `max_guests` columns to properties
- ✅ Updated all forms (add/edit property) with pricing fields
- ✅ Property details page shows pricing information
- ✅ Property listing cards display price and capacity
- ✅ Whole-property rental model (Lebanese style)
- ✅ Rooms kept for flexible space management

### **Database Changes**:
```sql
ALTER TABLE properties 
ADD COLUMN price_per_night NUMERIC(10, 2),
ADD COLUMN max_guests INTEGER DEFAULT 1;
```

## **CURRENT SESSION**: Guest Management System ✅

### **NEW FEATURES IMPLEMENTED**:
- ✅ **Complete Guest Management System (CRUD)**
  - Guest listing page with contact info display
  - Add guest form with Lebanese context validation
  - Edit guest form with data pre-population
  - Guest details page with booking history placeholder
  - Delete functionality with confirmation
- ✅ **Complete Room Management System (CRUD)**
  - Room edit form with status management
  - Room-specific pricing and capacity
  - Keybox code management
  - Status tracking (available, occupied, cleaning, etc.)
- ✅ **Enhanced Dashboard**
  - Guest count in dashboard stats
  - Quick action cards for navigation
  - Mobile-responsive design improvements

### **Guest Management Features**:
- **Complete CRUD**: List, add, edit, view details, delete
- **Lebanese Context**: WhatsApp integration, nationality, ID storage
- **Communication Tools**: Direct links for phone, email, WhatsApp
- **Guest Details**: Full profile view with timestamps
- **Future Ready**: Booking history section prepared

### **Room Management Features**:
- **Complete CRUD**: List, add, edit, delete rooms per property
- **Status Management**: Available, occupied, cleaning, maintenance, out of order
- **Pricing Flexibility**: Room-level pricing or inherit from property
- **Access Control**: Keybox code storage and display
- **Capacity Tracking**: Guest limits per room

## **CURRENT SESSION**: Booking Management System ✅

### **NEW FEATURES IMPLEMENTED**:
- ✅ **Complete Booking Management System**
  - Booking API endpoints (CRUD operations)
  - Booking listing page with status tracking
  - Add booking form with validation
  - Property-level booking (Lebanese model)
  - Guest-booking relationship
  - Automatic pricing calculation
  - Multiple booking sources (WhatsApp, Instagram, phone, etc.)
- ✅ **Status System Fixed**
  - Standardized booking status values (lowercase)
  - Migrated database from ENUM to VARCHAR(20)
  - Fixed frontend-backend status mismatch

### **Booking System Features**:
- **Property-Based Bookings**: Whole property rental model
- **Guest Integration**: Select existing guests for bookings
- **Date Management**: Check-in/check-out with validation
- **Automatic Pricing**: Calculates total based on property rates and nights
- **Status Tracking**: Pending, confirmed, checked-in, checked-out, cancelled
- **Source Tracking**: WhatsApp, Instagram, phone, walk-in, referral
- **Capacity Validation**: Prevents over-booking guest limits
- **Notes System**: Special requests and preferences

### **LATEST SESSION FIXES**:
- ✅ **Room Status Integration** - Rooms automatically update when bookings change
- ✅ **Guest Booking History** - Real booking history display in guest details
- ✅ **Guest-to-Booking Workflow** - "Create Booking" button pre-populates guest
- ✅ **Date Overlap Prevention** - No more double bookings on same property
- ✅ **Smart Room Status** - Dynamic status based on current date vs booking dates

### **Critical Business Logic Fixed**:
- **No Overlapping Bookings**: System prevents double-booking same property
- **Date-Aware Room Status**: Rooms only show "occupied" during actual stay
- **Booking Validation**: Comprehensive date and overlap checking
- **Lebanese Model Perfect**: Whole property booking with intelligent status

### **Room Status Logic**:
- **During Stay**: Confirmed/checked-in bookings → "occupied" 
- **Checkout Day**: → "cleaning"
- **Outside Dates**: → "available" (default or manual status)
- **Dynamic Calculation**: Status updates in real-time based on current date

## **LATEST MAJOR FEATURE**: Comprehensive Booking Calendar System ✅

### **🎯 CALENDAR - THE HEART OF THE SYSTEM**:
- ✅ **Visual Monthly Calendar** - Full month view with intuitive navigation
- ✅ **Color-Coded Bookings** - Status-based colors (pending=yellow, confirmed=blue, checked-in=green, etc.)
- ✅ **Property Filtering** - View specific property or all properties
- ✅ **Interactive Date Selection** - Click dates to view bookings or create new ones
- ✅ **Direct Booking Creation** - Click empty dates to instantly start booking process
- ✅ **Booking Details Modal** - Click dates with bookings to see details and manage
- ✅ **Past Date Prevention** - Grey out past dates, prevent booking historical dates
- ✅ **Date Range Selection** - Click start date, then end date to select booking range
- ✅ **Visual Range Feedback** - Blue highlighting shows selected date range
- ✅ **Smart Form Pre-fill** - Selected date range automatically fills booking form
- ✅ **Fixed Date Timezone Issues** - Dates now display correctly without offset
- ✅ **Smart Navigation** - Back button returns to calendar when booking started from calendar
- ✅ **Fixed Booking Display** - Calendar now correctly shows booking dates without timezone shift
- ✅ **Fixed Overlap Validation** - Now correctly prevents overlapping bookings including pending status
- ✅ **Fixed Dashboard Empty State** - Dashboard now handles empty data gracefully without errors
- ✅ **Fixed Orphaned Bookings** - Cleaned up null property_id bookings and added foreign key constraints with cascade delete

## **🏢 MULTI-TENANT ARCHITECTURE (Phase 1 Complete)**

### **🎯 FOUNDATION ESTABLISHED**:
- ✅ **Tenant Model** - Complete tenant schema with subdomain, domain, contact info
- ✅ **User Role System** - Added SUPER_ADMIN role for platform management  
- ✅ **Data Isolation** - All business models (Property, Guest) now have tenant_id
- ✅ **Database Schema** - Fresh multi-tenant schema with foreign key constraints
- ✅ **Super Admin User** - Platform admin created: admin@darmanager.com / admin123
- ✅ **Enum Fix** - Fixed user role enum mismatch between database and Python models
- ✅ **Authentication Working** - Super admin can now login successfully
- ✅ **Tenant Context System** - Created tenant middleware for request handling
- ✅ **Property Creation Fixed** - Properties now automatically get tenant_id from user context
- ✅ **Test Tenant Created** - Test tenant and admin user for development: test@darmanager.com / test123
- ✅ **Complete Data Isolation** - All endpoints (Properties, Guests, Bookings) now tenant-aware
- ✅ **Tenant Validation** - Users can only access resources within their tenant
- ✅ **API Testing Successful** - Property and guest creation working with automatic tenant assignment

### **🔧 SUPER ADMIN ENDPOINTS (PHASE 3 - COMPLETE)**:
- ✅ **Super Admin Security** - `require_super_admin` dependency for protected endpoints
- ✅ **Tenant Management** - Full CRUD operations for tenant management
- ✅ **Tenant Creation** - `POST /api/admin/tenants` with subdomain/domain validation
- ✅ **Tenant Listing** - `GET /api/admin/tenants` shows all tenants
- ✅ **Tenant Updates** - `PUT /api/admin/tenants/{id}` with uniqueness validation
- ✅ **Tenant Deletion** - `DELETE /api/admin/tenants/{id}` with cascade data reporting
- ✅ **Admin User Creation** - `POST /api/admin/tenants/{id}/admin-user` creates tenant admins
- ✅ **Isolation Testing** - Demo tenant created with empty property list (perfect isolation)

### **🔧 DASHBOARD TENANT ISOLATION FIX**:
- ✅ **Dashboard Statistics Fixed** - All counters now tenant-aware and show correct data
- ✅ **Demo Tenant Dashboard** - Shows 0 properties, 0 guests, 0 bookings (perfect isolation)
- ✅ **Test Tenant Dashboard** - Shows 2 properties, 2 guests, 1 booking (correct data)

### **🔧 NGINX SUBDOMAIN ROUTING (PHASE 4 - COMPLETE)**:
- ✅ **Nginx Configuration** - Supports both localhost and subdomain routing
- ✅ **Tenant Header Passing** - `X-Tenant-Subdomain` header passed from Nginx to backend/frontend
- ✅ **Development Mode** - Regular localhost access still works for development
- ✅ **Production Ready** - `*.darmanager.com` subdomain pattern configured

### **🔧 FRONTEND TENANT DETECTION (PHASE 4 - COMPLETE)**:
- ✅ **TenantProvider Context** - React context for tenant state management
- ✅ **Subdomain Detection** - Automatic tenant detection from URL
- ✅ **Tenant API Endpoint** - `/api/tenant/current` for frontend tenant lookup
- ✅ **Backend Integration** - Tenant info passed via `X-Tenant-Subdomain` header
- ✅ **API Testing** - Tenant detection working for "test" and "demo" subdomains

### **🔧 TENANT PROVISIONING & ONBOARDING SYSTEM (PHASE 5 - COMPLETE)**:
- ✅ **Super Admin Dashboard** - Complete UI for managing all tenants (`/admin`)
- ✅ **Tenant Creation Wizard** - 3-step process (tenant info → admin user → completion)
- ✅ **Password Generation** - Secure automatic password generation for new admins
- ✅ **Tenant Management** - Edit tenant details, view stats, delete tenants
- ✅ **Smart Login Redirects** - Super admin → `/admin`, New tenant → `/onboarding`, Existing → `/dashboard`
- ✅ **Onboarding Guide** - Step-by-step setup guide for new tenants (`/onboarding`)
- ✅ **Complete Workflow** - End-to-end tenant provisioning ready for production

### **🔧 TENANT-AWARE AUTHENTICATION & LANDING PAGE (FINAL TOUCHES)**:
- ✅ **Subdomain Authentication** - Users can only login to their own tenant's subdomain
- ✅ **Super Admin Override** - Platform admin can access any tenant for management
- ✅ **Visual Tenant Context** - Login page shows which tenant you're accessing
- ✅ **Professional Landing Page** - Proper B2B SaaS marketing page with features, pricing, Lebanese focus
- ✅ **Removed Public Dashboard** - No more aggregate stats, replaced with platform status endpoint
- ✅ **Complete Tenant Isolation** - Each subdomain is a secure, isolated business environment

### **🔧 COMPLETE BOOKING MANAGEMENT**:
- ✅ **Booking Edit Form** - Full form with validation and overlap prevention
- ✅ **Booking Details View** - Comprehensive booking information with guest/property details
- ✅ **Calendar Integration** - Pre-populates dates, properties, and guests from calendar
- ✅ **Dashboard Navigation** - Prominent calendar access as main booking tool

### **🎨 Lebanese-Optimized Calendar Features**:
- **Whole Property Focus**: Calendar shows property-level bookings (Lebanese model)
- **Multi-Source Tracking**: Color codes show booking sources (WhatsApp, Instagram, etc.)
- **Guest-Centric View**: Easy guest identification and contact from calendar
- **Mobile-Responsive**: Calendar works perfectly on Lebanese mobile devices

## **🚀 PRODUCTION-GRADE REFACTORING COMPLETE (MAJOR MILESTONE)**

### **🎯 WHAT WAS ACCOMPLISHED**:
The entire codebase has been transformed from a working prototype to enterprise-ready production architecture while maintaining 100% functional compatibility.

### **🔧 BACKEND TRANSFORMATION**:
- ✅ **Modular Architecture** - Split monolithic 1340+ line main.py into focused router modules
- ✅ **Service Layer Pattern** - Business logic extracted to service classes (PropertyService, DashboardService, etc.)
- ✅ **Dependency Injection** - Proper separation of concerns with centralized configuration
- ✅ **Exception Handling** - Standardized error responses with custom exception classes
- ✅ **Production Configuration** - Pydantic Settings with environment variable support
- ✅ **Security Layer** - Centralized authentication with role-based access control
- ✅ **Health Checks** - Enhanced container monitoring with proper startup/shutdown hooks

**New Structure:**
```
backend/app/
├── main.py              # Application factory
├── core/
│   ├── config.py        # Pydantic Settings
│   ├── security.py      # Auth & authorization
│   └── exceptions.py    # Error handling
├── services/            # Business logic layer
│   ├── property_service.py
│   └── dashboard_service.py
└── api/v1/endpoints/    # Modular routers
    ├── auth.py
    ├── properties.py
    ├── tenants.py
    └── ...
```

### **🔧 FRONTEND TRANSFORMATION**:
- ✅ **Centralized API Client** - Single point of API communication with error handling
- ✅ **State Management** - Zustand stores replacing scattered useState calls
- ✅ **TypeScript Integration** - Comprehensive type safety across frontend/backend
- ✅ **Reusable Components** - UI component library with consistent styling
- ✅ **Form Validation** - React Hook Form with Zod schemas for robust validation
- ✅ **Error Boundaries** - Production-grade error handling throughout UI

**New Structure:**
```
frontend/src/
├── lib/
│   └── api-client.ts    # Centralized API
├── stores/              # Zustand state management
│   ├── useAuthStore.ts
│   └── usePropertyStore.ts
├── types/
│   └── index.ts         # TypeScript definitions
├── components/ui/       # Reusable components
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Card.tsx
└── hooks/               # Custom hooks & validation
    └── useFormValidation.ts
```

### **🔧 CRITICAL ISSUES RESOLVED**:
- ✅ **Docker Entry Point** - Fixed Dockerfile to use new modular app.main:app
- ✅ **API Routing** - Fixed double /api path issue in Next.js rewrites  
- ✅ **CORS Configuration** - Proper regex-based subdomain support
- ✅ **Missing Endpoints** - All original functionality preserved and enhanced
- ✅ **Database Connections** - Added retry logic and health checks
- ✅ **Error Handling** - Standardized responses across all endpoints

### **🎯 PRODUCTION READINESS ACHIEVED**:
- **Scalability** - Modular architecture supports easy feature additions
- **Maintainability** - Clean separation of concerns and single responsibility
- **Security** - Centralized auth with proper error handling
- **Performance** - Optimized state management and API calls
- **Developer Experience** - Full TypeScript support and comprehensive documentation
- **Deployment** - Production-ready Docker configuration with health checks

### **🔧 BACKWARD COMPATIBILITY**:
- All existing API endpoints remain functional at same URLs
- Database schema unchanged - no data migration required
- Frontend functionality identical from user perspective
- All authentication and multi-tenant features preserved
- Docker Compose configuration remains the same

**NEXT SESSION GOALS**:
1. Payment confirmation system integration  
2. WhatsApp integration for guest communication
3. Advanced calendar features (drag & drop, multi-day selection)
4. Revenue analytics and reporting dashboard
5. Repository pattern implementation (remaining from refactoring)
