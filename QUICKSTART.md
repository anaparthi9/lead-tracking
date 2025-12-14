# Vyomaa CRM - Quick Start Guide

Get the CRM up and running in 5 minutes!

## Prerequisites
- Node.js v18+
- PostgreSQL v14+
- npm v9+

## Installation Steps

### 1. Install Dependencies

```bash
# From root directory
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Setup Database

```bash
# Create database
createdb vyomaa_crm

# Or using psql
psql -U postgres -c "CREATE DATABASE vyomaa_crm;"
```

### 3. Configure Environment

Backend environment is already configured at `backend/.env`. Update if needed (especially database credentials).

### 4. Run Migrations & Seed

```bash
cd backend
npm run db:migrate
npm run db:seed
```

### 5. Import Sample Data (Optional)

```bash
npm run db:import ../companies-sample.csv
```

### 6. Start Application

```bash
# From root directory
npm run dev
```

This starts both backend (port 5000) and frontend (port 3000).

### 7. Login

Open http://localhost:3000/login

**Credentials:**
- Email: `admin@vyomaa.com`
- Password: `admin123`

## Quick Tour

1. **Dashboard** - View all metrics and analytics
2. **Companies** - Browse and search 500+ companies
3. **Pipeline** - Kanban board view of all opportunities
4. **Create Opportunity** - Click on any company → "Create Opportunity"
5. **Manage Stages** - Open an opportunity → "Change Stage"

## Common Commands

```bash
# Start development servers
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database commands
cd backend
npm run db:migrate    # Create tables
npm run db:seed       # Add admin user
npm run db:import <csv-file>  # Import companies
```

## Troubleshooting

**Database connection failed?**
```bash
# Check PostgreSQL is running
pg_isready

# Verify database exists
psql -U postgres -l | grep vyomaa_crm
```

**Port already in use?**
```bash
# Kill port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

**Need to reset database?**
```bash
dropdb vyomaa_crm
createdb vyomaa_crm
cd backend
npm run db:migrate
npm run db:seed
```

## Next Steps

- Import your company data via CSV
- Create your first opportunity
- Explore the dashboard analytics
- Set up production deployment

For detailed documentation, see `VYOMAA_CRM_README.md`

---

**Happy Selling! 🚀**
