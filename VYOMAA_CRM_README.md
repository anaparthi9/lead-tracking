# Vyomaa Energy CRM - Sales Pipeline Management System

A comprehensive production-ready CRM application designed specifically for Vyomaa Energy to manage renewable energy project sales cycles and track a large B2B prospect database.

## 🌟 Features

### Core Functionality
- **9-Stage Sales Pipeline**: Complete implementation of Vyomaa's sales process from Lead Qualified to Documentation & Signing
- **Company Management**: Manage 500+ companies with advanced filtering and search
- **Opportunity Tracking**: Track opportunities through the entire sales cycle with detailed metrics
- **Kanban Board**: Visual pipeline management with stage-based organization
- **Analytics Dashboard**: Comprehensive insights into sales performance, conversion rates, and pipeline health
- **Lead Source Tracking**: Track and analyze customer acquisition by source (Tender/RFP, MERCOM, etc.)
- **Stage History**: Complete audit trail of all stage transitions
- **Notes System**: Collaborate with notes on each opportunity

### Technical Features
- **Authentication**: Secure JWT-based authentication
- **RESTful API**: Clean, documented REST API
- **PostgreSQL Database**: Robust data storage with proper indexing
- **TypeScript**: Full type safety across frontend and backend
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **CSV Import**: Bulk import companies from CSV files

## 🏗️ Architecture

### Tech Stack

**Backend:**
- Node.js + TypeScript
- Express.js
- PostgreSQL
- JWT for authentication
- bcryptjs for password hashing

**Frontend:**
- React 18 + TypeScript
- Material-UI (MUI)
- React Router
- Recharts for data visualization
- Axios for API calls

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18 or higher ([Download](https://nodejs.org/))
- **PostgreSQL**: v14 or higher ([Download](https://www.postgresql.org/download/))
- **npm**: v9 or higher (comes with Node.js)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd lead-tracking
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Return to root
cd ..
```

### 3. Set Up PostgreSQL Database

```bash
# Create a new PostgreSQL database
createdb vyomaa_crm

# Or using psql:
psql -U postgres
CREATE DATABASE vyomaa_crm;
\q
```

### 4. Configure Environment Variables

The backend already has a `.env` file configured. Update if needed:

```bash
cd backend
# Edit .env file with your database credentials
```

Default configuration:
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vyomaa_crm
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=vyomaa-crm-secret-key-2024-change-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

### 5. Run Database Migrations

```bash
cd backend
npm run db:migrate
```

This will create all necessary tables:
- users
- companies
- opportunities
- stage_history
- notes

### 6. Seed the Database

```bash
npm run db:seed
```

This creates a default admin user:
- **Email**: admin@vyomaa.com
- **Password**: admin123

⚠️ **IMPORTANT**: Change this password in production!

### 7. Import Company Data (Optional)

If you have a CSV file with company data:

```bash
npm run db:import path/to/your/companies.csv
```

CSV format should have columns:
- Sr No
- Company Name
- Industry
- Location
- RE Consumption
- Capacity (MW)
- Status
- Model

A sample CSV is provided at `companies-sample.csv`.

### 8. Start the Application

#### Development Mode (Recommended)

From the root directory:

```bash
# Start both backend and frontend concurrently
npm run dev
```

Or start them separately:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

#### Production Mode

```bash
# Build both frontend and backend
npm run build

# Start the production server
npm start
```

## 📱 Using the Application

### 1. Login

Navigate to http://localhost:3000/login

Use the default credentials:
- Email: admin@vyomaa.com
- Password: admin123

### 2. Dashboard

The dashboard provides:
- Total opportunities and capacity metrics
- Pipeline breakdown by stage
- Pipeline by model (EPC, RESCO, etc.)
- Lead source analysis
- Conversion metrics
- Average time in each stage

### 3. Companies

- View all companies with pagination (500+ companies)
- Search by name, industry, or location
- Filter by status and model
- View company details
- Create opportunities for companies

### 4. Pipeline (Kanban Board)

- Visual representation of all open opportunities
- Organized by sales stage (9 stages)
- Filter by location, industry, lead source, and model
- Click any card to view detailed opportunity information

### 5. Opportunity Management

- View detailed opportunity information
- Change sales stages
- Track stage history
- Add notes and collaborate
- Monitor probability and expected capacity

## 🔧 Key Workflows

### Creating an Opportunity

1. Go to **Companies** page
2. Find the company (use search/filters)
3. Click on the company name to view details
4. Click **"Create Opportunity"**
5. Fill in:
   - Sales Stage
   - Lead Source
   - Expected MW
   - Acquisition Cost
   - Expected Contract Date
   - Owner Name
6. Click **"Create"**

### Moving Through Sales Stages

1. Go to **Pipeline** or open an **Opportunity**
2. Click **"Change Stage"**
3. Select new stage
4. The system automatically:
   - Updates the stage
   - Logs the change in history
   - Updates probability based on stage

### Tracking Progress

1. **Dashboard** shows overall metrics
2. **Pipeline** shows distribution across stages
3. **Opportunity Detail** shows:
   - Complete stage history
   - All notes
   - Key metrics and dates

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Companies
- `GET /api/companies` - Get all companies (with filters)
- `GET /api/companies/:id` - Get company by ID
- `POST /api/companies` - Create company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company
- `GET /api/companies/filters` - Get available filter options

### Opportunities
- `GET /api/opportunities` - Get all opportunities (with filters)
- `GET /api/opportunities/:id` - Get opportunity by ID
- `POST /api/opportunities` - Create opportunity
- `PUT /api/opportunities/:id` - Update opportunity
- `POST /api/opportunities/:id/change-stage` - Change sales stage
- `POST /api/opportunities/:id/notes` - Add note
- `GET /api/opportunities/:id/history` - Get stage history

### Dashboard/Analytics
- `GET /api/dashboard/summary` - Pipeline summary metrics
- `GET /api/dashboard/conversions` - Conversion metrics
- `GET /api/dashboard/lead-sources` - Lead source analysis
- `GET /api/dashboard/durations` - Duration metrics

All endpoints (except `/auth/login`) require JWT authentication via the `Authorization: Bearer <token>` header.

## 🗃️ Database Schema

### Companies Table
- id, sr_no, name, industry, location
- re_consumption, capacity_mw, status, model
- created_at, updated_at

### Opportunities Table
- id, company_id, sales_stage, lead_source
- acquisition_cost, expected_mw, probability
- expected_contract_date, value_estimate
- owner_name, status
- created_at, updated_at, stage_entered_at

### Stage History Table
- id, opportunity_id
- from_stage, to_stage
- changed_at, changed_by

### Notes Table
- id, opportunity_id
- author_name, content
- created_at

## 🎯 Sales Stages

The system implements these 9 stages in order:

1. **Lead Qualified** (10% probability)
2. **Pre-Feasibility** (20% probability)
3. **Site Survey** (30% probability)
4. **Technical Feasibility Report** (40% probability)
5. **Business Case & ROI** (50% probability)
6. **Commercial Alignment** (60% probability)
7. **Proposal Issued** (70% probability)
8. **Negotiation & Compliance** (80% probability)
9. **Documentation & Signing** (90% probability)

## 📈 Analytics & Metrics

The system tracks:

- **Pipeline Metrics**: Total opportunities, capacity (MW), average probability
- **Stage Distribution**: Count and capacity at each stage
- **Model Split**: EPC vs RESCO vs others
- **Conversion Rates**: Overall and by lead source
- **Lead Source Mix**: Distribution and effectiveness of lead sources
- **CAC per Source**: Customer acquisition cost per signed contract
- **Duration Metrics**: Average time in each stage and total lead-to-contract time

## 🔒 Security

- Passwords hashed with bcryptjs
- JWT tokens for authentication
- CORS protection
- Helmet.js for security headers
- SQL injection protection via parameterized queries
- Input validation on all endpoints

## 🧪 Testing the Application

### Sample Data

A sample CSV with 10 companies is provided at `companies-sample.csv`. Import it:

```bash
cd backend
npm run db:import ../companies-sample.csv
```

### Creating Test Opportunities

1. Login to the application
2. Go to Companies
3. Select any company
4. Create an opportunity
5. Try changing stages
6. Add notes
7. View in Pipeline and Dashboard

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
pg_isready

# Check if database exists
psql -U postgres -l | grep vyomaa_crm
```

### Port Already in Use

If ports 3000 or 5000 are in use:

```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### Migration Errors

```bash
# Drop and recreate database
dropdb vyomaa_crm
createdb vyomaa_crm

# Run migrations again
cd backend && npm run db:migrate
```

## 📝 Development Commands

```bash
# Root level
npm run dev              # Start both frontend and backend
npm run build            # Build both for production
npm run install:all      # Install all dependencies

# Backend
cd backend
npm run dev              # Start dev server with hot reload
npm run build            # Build TypeScript
npm start                # Start production server
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with admin user
npm run db:import        # Import companies from CSV

# Frontend
cd frontend
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
```

## 🚢 Deployment

### Environment Variables for Production

Update these in production:

```env
NODE_ENV=production
JWT_SECRET=<generate-strong-secret>
DB_PASSWORD=<secure-password>
CORS_ORIGIN=https://your-domain.com
```

### Build for Production

```bash
npm run build
```

### Deploy Backend

The backend can be deployed to:
- AWS EC2
- Heroku
- DigitalOcean
- Any Node.js hosting platform

### Deploy Frontend

The frontend build can be deployed to:
- Netlify
- Vercel
- AWS S3 + CloudFront
- Any static hosting platform

## 👥 Default User

**Admin User**
- Email: admin@vyomaa.com
- Password: admin123

⚠️ Change this in production!

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check the code comments in the source files

## 🎉 Success Criteria

The application is ready when:

✅ You can login as admin
✅ Companies are loaded (from CSV or manually)
✅ You can search/filter companies
✅ You can create opportunities
✅ You can move opportunities through stages
✅ Stage history is tracked
✅ Dashboard shows metrics
✅ Pipeline view displays opportunities by stage
✅ Notes can be added to opportunities
✅ All API endpoints are working

## 📄 License

MIT License - feel free to use and modify for Vyomaa Energy's internal use.

---

**Built with ❤️ for Vyomaa Energy**
