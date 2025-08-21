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

**NEXT SESSION GOALS**:
1. Property-based booking workflow (whole property rental)
2. Calendar integration for booking visualization
3. Payment confirmation system
4. Guest-booking relationship management
