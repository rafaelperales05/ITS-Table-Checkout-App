# ITS Table Checkout Management System

A modern web application to replace Excel-based table checkout systems for university facilities. Built with React frontend and serverless API backend.

## Current Status (95% Complete)

**WORKING FEATURES:**
- Dashboard with real-time statistics (2 active, 2 overdue checkouts)
- Active checkouts display with organization and table details
- Organization management interface  
- Production-ready serverless architecture with PostgreSQL
- Comprehensive logging, monitoring, and error handling

**IN PROGRESS:**
- Available tables display (minor UI logic fix needed)

**NEXT PHASE:**
- POST endpoints for checkout creation/returns
- Production deployment to Vercel

## Tech Stack

### Frontend
- **React 18** with hooks and modern patterns
- **Tailwind CSS** for styling and responsive design
- **Axios** for API communication with error handling
- **Heroicons** for consistent iconography

### Backend (Serverless)
- **Vercel Functions** for serverless API endpoints
- **Node.js** with Express-style handlers
- **Sequelize ORM** with PostgreSQL
- **Pino** for structured JSON logging
- **Custom error classes** with proper HTTP status codes

### Database
- **PostgreSQL** with optimized connection pooling
- **5 Tables, 5 Organizations, 2 Active Checkouts** (populated with test data)
- **Comprehensive relationships** between organizations, tables, and checkouts

## Database Schema

```sql
-- Organizations (5 records)
organizations: id, officialName, aliases[], category, status, banReason, banDate

-- Tables (5 records) 
tables: id, tableNumber, status, location, capacity, notes

-- Checkouts (2 active)
checkouts: id, organizationId, tableId, checkoutTime, expectedReturnTime, 
           actualReturnTime, status, notes, checkedOutBy, returnedBy
```

## Development Setup

### Prerequisites
- **Node.js 18+** and npm
- **PostgreSQL 12+** or Docker
- **Vercel CLI** for local development

### Quick Start

```bash
# 1. Clone and install
git clone https://github.com/rafaelperales05/ITS-Table-Checkout-App.git
cd ITS-Table-Checkout-App
git checkout serverless-migration
npm install && cd client && npm install

# 2. Database setup (Docker)
docker run --name postgres-tables \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password123 \
  -e POSTGRES_DB=table_checkout_db \
  -p 5432:5432 -d postgres:13

# 3. Environment configuration
# Create server/.env:
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=table_checkout_db
DB_USER=postgres
DB_PASSWORD=password123

# 4. Database initialization
cd server && npm run seed  # Populates with test data

# 5. Start development environment
vercel dev  # Starts serverless functions + React client
```

### Development URLs
- **Frontend:** http://localhost:3000
- **API Health:** http://localhost:3000/api/health
- **API Endpoints:** http://localhost:3000/api/*

## API Endpoints

### Working Endpoints
```
GET  /api/health                    # Health check
GET  /api/checkouts/stats          # Dashboard statistics  
GET  /api/checkouts/active         # Active checkouts (paginated)
GET  /api/checkouts/overdue        # Overdue checkouts (paginated)
GET  /api/tables                   # Tables list (paginated, filterable)
GET  /api/organizations            # Organizations list (paginated)
```

### Coming Next
```
POST /api/checkouts                # Create checkout
POST /api/checkouts/[id]/return    # Return checkout  
POST /api/organizations/validate   # Organization validation
POST /api/tables                   # Table management
```

## Project Structure

```
├── api/                          # Vercel serverless functions
│   ├── health.js                # Health check endpoint
│   ├── organizations.js         # Organizations API
│   ├── tables.js                # Tables API with validation
│   └── checkouts/
│       ├── active.js            # Active checkouts
│       ├── overdue.js           # Overdue checkouts  
│       └── stats.js             # Dashboard statistics
├── lib/                          # Shared utilities
│   ├── database.js              # DB connection pooling
│   ├── serverless-handler.js    # Production middleware
│   └── errors.js                # Custom error classes
├── client/                       # React frontend
│   └── src/
│       ├── components/          # UI components
│       ├── hooks/               # Data fetching hooks
│       └── services/            # API client
└── server/                       # Legacy (keep for DB models)
    └── models/                  # Sequelize models
```

## Security Features

- **CORS validation** with origin whitelisting
- **Request validation** with proper error responses  
- **Environment-aware error handling** (detailed in dev, generic in prod)
- **SQL injection protection** via Sequelize ORM
- **Rate limiting ready** (implement in production)

## Performance Features

- **Database connection pooling** optimized for serverless
- **Module-level initialization** for faster warm starts
- **Efficient queries** with proper indexing and joins
- **Pagination** on all list endpoints
- **Request correlation** with UUID tracking

## Production Deployment

### Vercel Deployment
```bash
# 1. Configure environment variables in Vercel dashboard:
DATABASE_URL=postgresql://...      # Production database
CORS_ORIGINS=https://your-app.vercel.app
LOG_LEVEL=info

# 2. Deploy
vercel --prod
```

### Environment Variables
```env
# Production (Vercel)
DATABASE_URL=postgresql://user:pass@host:port/db
CORS_ORIGINS=https://domain.com,https://www.domain.com  
LOG_LEVEL=info
NODE_ENV=production

# Development  
REACT_APP_API_URL=/api
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=password123
DB_NAME=table_checkout_db
```

## Testing

### Manual API Testing
```bash
# Health check
curl http://localhost:3000/api/health

# Get statistics
curl http://localhost:3000/api/checkouts/stats

# Get tables with filtering
curl "http://localhost:3000/api/tables?available=true&limit=10"
```

### Integration Testing
- Dashboard loads successfully
- Active checkouts display with data
- Organization management functional
- API error handling robust

## Development Notes

### Recent Major Changes (Branch: serverless-migration)
1. **Complete serverless migration** from Express.js
2. **Production-ready architecture** with proper logging/monitoring  
3. **Fixed all client-server integration** issues
4. **Database connection optimization** for serverless environment
5. **Comprehensive error handling** with custom error types

### Known Issues
- **Available tables display** - Shows empty list instead of 3 available tables (30-min fix)

### Next Sprint Priority
1. **Fix available tables display** 
2. **Build checkout creation/return POST endpoints**
3. **Deploy to production Vercel environment**
4. **Add authentication layer**

## Contributing

1. Branch from `serverless-migration`
2. Follow established patterns in `/api` endpoints
3. Ensure proper error handling and logging
4. Test with real database data
5. Update documentation

## Current Database State
- **5 Tables:** FAC-001 to FAC-005 (3 available, 2 checked out)
- **5 Organizations:** Academic, Cultural, Government, Sports categories
- **2 Active Checkouts:** Both currently overdue (good for testing)
- **0 Returns:** No completed checkouts yet

---

**Status:** Production-ready serverless architecture  
**Last Updated:** 2025-09-03  
**Branch:** serverless-migration (pushed to GitHub)  
**Next:** Minor UI fixes + POST endpoint development