# DarManager Architecture Guide

## Overview
DarManager is a modern, multi-tenant property management system built with FastAPI (backend) and Next.js (frontend). The system is designed to manage guesthouses, hotels, and other hospitality properties with a clean separation of concerns and scalable architecture.

## System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   (PostgreSQL)  │
│   Port 3000     │    │   Port 8000     │    │   Port 5432     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Nginx         │
                    │   (Port 80)     │
                    │   Reverse Proxy │
                    └─────────────────┘
```

## Backend Architecture

### Technology Stack
- **Framework**: FastAPI 0.104.1
- **Database**: PostgreSQL 15 with SQLAlchemy 2.0.23 ORM
- **Authentication**: JWT with PyJWT
- **Validation**: Pydantic 2.5.0
- **Database Migrations**: Alembic
- **Server**: Uvicorn with ASGI

### Project Structure
```
backend/
├── app/
│   ├── api/                    # API endpoints
│   │   └── v1/
│   │       ├── endpoints/      # Individual endpoint modules
│   │       │   ├── auth.py     # Authentication endpoints
│   │       │   ├── properties.py # Property management
│   │       │   ├── bookings.py  # Booking management
│   │       │   ├── guests.py    # Guest management
│   │       │   ├── rooms.py     # Room management
│   │       │   ├── dashboard.py # Dashboard data
│   │       │   ├── reports.py   # Reporting
│   │       │   └── tenants.py   # Tenant management
│   │       └── api.py          # Main router
│   ├── core/                   # Core functionality
│   │   ├── config.py          # Configuration management
│   │   ├── database.py        # Database connection
│   │   ├── security.py        # Security utilities
│   │   ├── exceptions.py      # Custom exceptions
│   │   └── tenant.py          # Multi-tenancy logic
│   ├── models/                 # SQLAlchemy models
│   │   └── models.py          # Database models
│   ├── schemas/                # Pydantic schemas
│   │   └── schemas.py         # Request/Response models
│   ├── services/               # Business logic
│   │   ├── auth_service.py    # Authentication logic
│   │   ├── property_service.py # Property business logic
│   │   ├── booking_service.py # Booking business logic
│   │   └── ...
│   └── main.py                # Application entry point
├── requirements.txt            # Python dependencies
└── Dockerfile                 # Container configuration
```

### Key Architectural Patterns

#### 1. Multi-Tenancy
- **Tenant Isolation**: Each client (guesthouse/hotel) operates in isolation
- **Subdomain Routing**: `{tenant}.darmanager.com` for tenant-specific access
- **Database Schema**: Shared database with tenant_id filtering

#### 2. Layered Architecture
```
┌─────────────────┐
│   API Layer     │ ← FastAPI endpoints
├─────────────────┤
│  Service Layer  │ ← Business logic
├─────────────────┤
│  Data Layer     │ ← SQLAlchemy models
└─────────────────┘
```

#### 3. Dependency Injection
- FastAPI's dependency injection system for database sessions
- Automatic JWT token validation
- Tenant context injection

### Database Models

#### Core Entities
1. **Tenant**: Multi-tenant isolation
2. **User**: Authentication and authorization
3. **Property**: Guesthouse/hotel properties
4. **Room**: Individual rooms within properties
5. **Guest**: Customer information
6. **Booking**: Reservation management
7. **Payment**: Financial tracking

#### Key Relationships
```sql
Tenant (1) ←→ (N) Property
Property (1) ←→ (N) Room
Property (1) ←→ (N) Guest
Property (1) ←→ (N) Booking
Guest (1) ←→ (N) Booking
```

### API Design Principles

#### RESTful Endpoints
- **Authentication**: `/api/auth/*`
- **Properties**: `/api/properties/*`
- **Bookings**: `/api/bookings/*`
- **Guests**: `/api/guests/*`
- **Rooms**: `/api/rooms/*`
- **Dashboard**: `/api/dashboard/*`
- **Reports**: `/api/reports/*`

#### Response Format
```json
{
  "data": { ... },
  "error": null
}
```

#### Error Handling
- Custom exception classes
- HTTP status codes
- Structured error responses
- Validation error handling

## Frontend Architecture

### Technology Stack
- **Framework**: Next.js 14.0.4 with App Router
- **Language**: TypeScript 5.3.3
- **Styling**: Tailwind CSS 3.3.6
- **State Management**: Zustand 4.4.7
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Headless UI + Heroicons
- **PWA**: Next-PWA for offline capabilities

### Project Structure
```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication routes
│   │   │   ├── login/         # Login page
│   │   │   └── admin-login/   # Admin login
│   │   ├── dashboard/         # Main dashboard
│   │   │   ├── properties/    # Property management
│   │   │   ├── bookings/      # Booking management
│   │   │   ├── guests/        # Guest management
│   │   │   ├── reports/       # Reporting
│   │   │   └── calendar/      # Calendar view
│   │   ├── admin/             # Super admin routes
│   │   └── access/            # Access control
│   ├── components/             # Reusable components
│   │   ├── ui/                # Base UI components
│   │   └── InstallPrompt.tsx  # PWA installation
│   ├── contexts/               # React contexts
│   │   └── TenantContext.tsx  # Tenant context
│   ├── hooks/                  # Custom hooks
│   │   └── useFormValidation.ts
│   ├── lib/                    # Utilities
│   │   └── api-client.ts      # API communication
│   ├── stores/                 # Zustand stores
│   │   ├── useAuthStore.ts    # Authentication state
│   │   ├── useDashboardStore.ts # Dashboard state
│   │   └── usePropertyStore.ts # Property state
│   └── types/                  # TypeScript types
│       └── index.ts
├── public/                     # Static assets
├── package.json                # Dependencies
└── Dockerfile.dev             # Development container
```

### State Management Architecture

#### Zustand Stores
1. **Auth Store**: User authentication state
2. **Dashboard Store**: Dashboard data and filters
3. **Property Store**: Property management state

#### Store Pattern
```typescript
interface StoreState {
  // State properties
  data: DataType[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchData: () => Promise<void>;
  updateData: (id: string, data: Partial<DataType>) => void;
  deleteData: (id: string) => void;
}
```

### API Communication

#### Centralized API Client
- **Base URL**: Configurable for different environments
- **Authentication**: Automatic JWT token handling
- **Error Handling**: Consistent error response format
- **Request/Response**: Type-safe API calls

#### API Methods
```typescript
// GET request
const response = await apiClient.get<DataType>('/api/endpoint');

// POST request
const response = await apiClient.post<DataType>('/api/endpoint', data);

// PUT request
const response = await apiClient.put<DataType>('/api/endpoint', data);

// DELETE request
const response = await apiClient.delete('/api/endpoint');
```

## Development Workflow

### Local Development Setup

#### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for frontend development)
- Python 3.8+ (for backend development)

#### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd DarManager

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/api/docs
# Database: localhost:5432
```

#### Development Commands
```bash
# Backend development
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend development
cd frontend
npm install
npm run dev

# Database migrations
cd backend
alembic upgrade head
```

### Adding New Features

#### Backend Feature Development

1. **Define Data Model**
   ```python
   # app/models/models.py
   class NewFeature(Base):
       __tablename__ = "new_features"
       
       id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
       tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
       name = Column(String(255), nullable=False)
       # ... other fields
   ```

2. **Create Pydantic Schemas**
   ```python
   # app/schemas/schemas.py
   class NewFeatureBase(BaseModel):
       name: str
       # ... other fields
   
   class NewFeatureCreate(NewFeatureBase):
       pass
   
   class NewFeatureUpdate(BaseModel):
       name: Optional[str] = None
       # ... other fields
   
   class NewFeature(NewFeatureBase):
       id: UUID4
       tenant_id: UUID4
       created_at: datetime
       updated_at: datetime
       
       class Config:
           from_attributes = True
   ```

3. **Implement Service Layer**
   ```python
   # app/services/new_feature_service.py
   class NewFeatureService:
       def __init__(self, db: Session):
           self.db = db
       
       def create_new_feature(self, tenant_id: UUID, data: NewFeatureCreate) -> NewFeature:
           # Business logic implementation
           pass
       
       def get_new_features(self, tenant_id: UUID) -> List[NewFeature]:
           # Data retrieval logic
           pass
   ```

4. **Create API Endpoints**
   ```python
   # app/api/v1/endpoints/new_features.py
   router = APIRouter()
   
   @router.post("/", response_model=NewFeature)
   async def create_new_feature(
       new_feature: NewFeatureCreate,
       current_user: User = Depends(get_current_user),
       db: Session = Depends(get_db)
   ):
       service = NewFeatureService(db)
       return service.create_new_feature(current_user.tenant_id, new_feature)
   
   @router.get("/", response_model=List[NewFeature])
   async def get_new_features(
       current_user: User = Depends(get_current_user),
       db: Session = Depends(get_db)
   ):
       service = NewFeatureService(db)
       return service.get_new_features(current_user.tenant_id)
   ```

5. **Register Router**
   ```python
   # app/api/v1/api.py
   from app.api.v1.endpoints import new_features
   
   api_router.include_router(new_features.router, prefix="/new-features", tags=["new-features"])
   ```

6. **Database Migration**
   ```bash
   # Generate migration
   alembic revision --autogenerate -m "Add new feature table"
   
   # Apply migration
   alembic upgrade head
   ```

#### Frontend Feature Development

1. **Define TypeScript Types**
   ```typescript
   // src/types/index.ts
   export interface NewFeature {
     id: string;
     name: string;
     tenant_id: string;
     created_at: string;
     updated_at: string;
   }
   
   export interface NewFeatureCreate {
     name: string;
   }
   
   export interface NewFeatureUpdate {
     name?: string;
   }
   ```

2. **Create Zustand Store**
   ```typescript
   // src/stores/useNewFeatureStore.ts
   import { create } from 'zustand';
   import { NewFeature, NewFeatureCreate, NewFeatureUpdate } from '@/types';
   import { apiClient } from '@/lib/api-client';
   
   interface NewFeatureState {
     features: NewFeature[];
     isLoading: boolean;
     error: string | null;
     
     fetchFeatures: () => Promise<void>;
     createFeature: (data: NewFeatureCreate) => Promise<boolean>;
     updateFeature: (id: string, data: NewFeatureUpdate) => Promise<boolean>;
     deleteFeature: (id: string) => Promise<boolean>;
   }
   
   export const useNewFeatureStore = create<NewFeatureState>((set, get) => ({
     features: [],
     isLoading: false,
     error: null,
     
     fetchFeatures: async () => {
       set({ isLoading: true });
       try {
         const response = await apiClient.get<NewFeature[]>('/api/new-features');
         if (response.data) {
           set({ features: response.data, isLoading: false });
         }
       } catch (error) {
         set({ error: 'Failed to fetch features', isLoading: false });
       }
     },
     
     // ... other methods
   }));
   ```

3. **Create React Components**
   ```typescript
   // src/components/NewFeatureList.tsx
   import { useNewFeatureStore } from '@/stores/useNewFeatureStore';
   
   export function NewFeatureList() {
     const { features, isLoading, fetchFeatures } = useNewFeatureStore();
   
     useEffect(() => {
       fetchFeatures();
     }, [fetchFeatures]);
   
     if (isLoading) return <div>Loading...</div>;
   
     return (
       <div>
         {features.map(feature => (
           <div key={feature.id}>{feature.name}</div>
         ))}
       </div>
     );
   }
   ```

4. **Add API Client Methods**
   ```typescript
   // src/lib/api-client.ts
   // Add to ApiClient class
   async getNewFeatures<T>(): Promise<ApiResponse<T>> {
     return this.get('/api/new-features');
   }
   
   async createNewFeature<T>(data: any): Promise<ApiResponse<T>> {
     return this.post('/api/new-features', data);
   }
   ```

5. **Create Page Component**
   ```typescript
   // src/app/dashboard/new-features/page.tsx
   import { NewFeatureList } from '@/components/NewFeatureList';
   
   export default function NewFeaturesPage() {
     return (
       <div>
         <h1>New Features</h1>
         <NewFeatureList />
       </div>
     );
   }
   ```

## Testing Strategy

### Backend Testing
- **Unit Tests**: Pytest for service layer
- **Integration Tests**: API endpoint testing
- **Database Tests**: Test database with fixtures

### Frontend Testing
- **Component Tests**: React Testing Library
- **E2E Tests**: Playwright or Cypress
- **Unit Tests**: Jest for utilities

## Deployment

### Production Environment
- **Containerization**: Docker with multi-stage builds
- **Reverse Proxy**: Nginx for load balancing
- **Database**: PostgreSQL with connection pooling
- **Environment**: Environment-specific configurations

### Environment Variables
```bash
# Backend
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET_KEY=your-secret-key
ENVIRONMENT=production

# Frontend
NEXT_PUBLIC_API_URL=https://api.darmanager.com
NODE_ENV=production
```

## Security Considerations

### Authentication & Authorization
- JWT tokens with refresh mechanism
- Role-based access control (RBAC)
- Tenant isolation
- Password hashing with bcrypt

### API Security
- CORS configuration
- Input validation with Pydantic
- SQL injection prevention with SQLAlchemy
- Rate limiting (future implementation)

### Data Protection
- Tenant data isolation
- Input sanitization
- HTTPS enforcement
- Audit logging

## Performance Optimization

### Backend
- Database connection pooling
- Query optimization
- Caching strategies (Redis - future)
- Async/await patterns

### Frontend
- Code splitting with Next.js
- Image optimization
- PWA capabilities
- Bundle size optimization

## Monitoring & Logging

### Application Monitoring
- Health check endpoints
- Structured logging
- Error tracking
- Performance metrics

### Database Monitoring
- Connection pool status
- Query performance
- Database health checks

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check Docker container status
   - Verify environment variables
   - Check network connectivity

2. **Frontend Build Issues**
   - Clear Next.js cache: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

3. **API Endpoint Issues**
   - Check FastAPI logs
   - Verify endpoint registration
   - Check authentication headers

### Debug Mode
```bash
# Backend debug
ENVIRONMENT=development DEBUG=true uvicorn app.main:app --reload

# Frontend debug
NODE_ENV=development npm run dev
```

## Contributing Guidelines

### Code Style
- **Backend**: Black formatter, isort for imports
- **Frontend**: Prettier, ESLint
- **TypeScript**: Strict mode enabled
- **Python**: Type hints, docstrings

### Git Workflow
1. Create feature branch
2. Implement changes
3. Add tests
4. Update documentation
5. Submit pull request

### Documentation Requirements
- API endpoint documentation
- Component documentation
- Database schema documentation
- Deployment instructions

This architecture guide provides a comprehensive overview for new developers to understand the system and contribute effectively. For specific implementation details, refer to the individual source files and API documentation.
