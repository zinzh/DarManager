# DarManager - Guesthouse Management System

A modern, mobile-first property management system tailored for Lebanese guesthouse owners who manage bookings via WhatsApp, Instagram, phone calls, and local offline methods.

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 with React 18, TypeScript, and Tailwind CSS
- **Backend**: Python FastAPI with async support
- **Database**: PostgreSQL 15 with UUID primary keys
- **Proxy**: Nginx for reverse proxy and static file serving
- **Containerization**: Docker Compose for easy development
- **Deployment**: EC2-ready with container orchestration

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git for version control

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DarManager
   ```

2. **Start the development environment**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost (via Nginx)
   - API Documentation: http://localhost/api/docs
   - Database: localhost:5432

### Container Architecture

```
nginx (port 80) -> frontend (port 3000)
                -> api (port 8000)
database (port 5432) <- api
```

## 📱 Features Roadmap

### Phase 1: Foundation ✅
- [x] Project structure and Docker setup
- [x] Basic Next.js frontend with Tailwind CSS
- [x] FastAPI backend skeleton
- [x] PostgreSQL database with initial schema
- [x] Nginx reverse proxy configuration

### Phase 2: Core Features ✅ COMPLETED
- [x] User authentication and authorization
- [x] Authenticated dashboard with real-time data
- [x] Property listing and management interface
- [x] Add/Edit property forms with validation
- [x] Mobile-responsive UI design

### Phase 3: Property Management ✅ COMPLETED
- [x] Property listing with CRUD operations
- [x] Property pricing and capacity management
- [x] Add/Edit property forms with Lebanese business model
- [x] Property details view with room management
- [x] Room listing and management interface
- [x] Property-level pricing (whole property rental)

### Phase 4: Guest Management ✅ COMPLETED
- [x] Complete Guest CRUD (Create, Read, Update, Delete)
- [x] Guest listing interface with contact display
- [x] Add/Edit guest forms with Lebanese context (WhatsApp, nationality)
- [x] Guest details page with full profile view
- [x] Guest communication tools (phone, email, WhatsApp links)
- [x] Guest dashboard integration and statistics

### Phase 5: Room Management ✅ COMPLETED
- [x] Complete Room CRUD operations
- [x] Room edit form with status management
- [x] Room-specific pricing and capacity controls
- [x] Status tracking (available, occupied, cleaning, maintenance)
- [x] Keybox code management per room
- [x] Integration with property management system

### Phase 6: Advanced Features (Future)
- [ ] Manual booking entry system
- [ ] Calendar view for bookings
- [ ] Payment confirmation workflow
- [ ] WhatsApp integration for guest communication
- [ ] Automated messaging templates
- [ ] OCR for receipt processing
- [ ] Revenue and occupancy dashboard
- [ ] PDF invoice generation
- [ ] Data export functionality

### Phase 4: Optimization (Future)
- [ ] PWA features for mobile
- [ ] Offline capability
- [ ] Performance optimization
- [ ] Mobile app considerations

## 🔧 Development Commands

```bash
# Start all services
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f [service-name]

# Stop services
docker-compose down

# Rebuild specific service
docker-compose build [service-name]

# Access database
docker-compose exec database psql -U darmanager_user -d darmanager
```

## 📁 Project Structure

```
DarManager/
├── backend/                 # FastAPI application
│   ├── Dockerfile
│   ├── main.py             # API entry point
│   └── requirements.txt    # Python dependencies
├── frontend/               # Next.js application
│   ├── src/
│   │   ├── app/           # App router pages
│   │   └── components/    # Reusable components
│   ├── Dockerfile
│   ├── package.json
│   └── tailwind.config.js
├── nginx/                  # Nginx configuration
│   ├── nginx.conf
│   └── default.conf
├── database/              # Database initialization
│   └── init.sql
└── docker-compose.yml     # Container orchestration
```

## 🎯 Lebanese Market Focus

This system is specifically designed for the Lebanese market with:
- Cash-based payment support (OMT, Whish, bank transfers)
- WhatsApp integration for customer communication
- Multi-currency support (LBP/USD)
- Offline-first approach for unstable internet
- Mobile-optimized interface for on-the-go management

## 🔒 Security Considerations

- JWT authentication for API endpoints
- PostgreSQL with proper indexing and constraints
- Nginx security headers and rate limiting
- Container isolation and non-root user execution
- Environment variable management for secrets

## 📊 Database Schema

The initial schema includes:
- **Properties**: Guesthouse information and settings
- **Rooms**: Room details, pricing, and status
- **Guests**: Customer information and contact details
- **Bookings**: Reservation management with status tracking
- **Payments**: Payment tracking with receipt storage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is proprietary software for guesthouse management in Lebanon.

---

**Status**: 🟢 Active Development - Property Management Phase Complete
**Current**: Property listing, add/edit forms working
**Next Steps**: Property details view and room management interface

### 🆕 Latest Features Added (Current Session)
- ✅ Property add/edit forms with full validation
- ✅ Backend GET/PUT endpoints for single property
- ✅ Form error handling and loading states
- ✅ Mobile-responsive form design
- ✅ Navigation between property management pages
