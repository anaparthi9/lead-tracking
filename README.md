# Vyomaa Energy CRM

**Professional Sales Pipeline Management System for Renewable Energy Projects**

<div align="center">

![Status](https://img.shields.io/badge/status-production--ready-brightgreen)
![TypeScript](https://img.shields.io/badge/typescript-100%25-blue)
![Node.js](https://img.shields.io/badge/node.js-v18+-green)
![React](https://img.shields.io/badge/react-v18-blue)
![PostgreSQL](https://img.shields.io/badge/postgresql-v14+-blue)

</div>

---

## Quick Start

Get up and running in 5 minutes:

```bash
# 1. Run automated setup script
./setup.sh

# 2. Start the application
npm run dev

# 3. Open browser and login
http://localhost:3000
```

**Default Login:**
- Email: `admin@vyomaa.com`
- Password: `admin123`

## Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - 5-minute setup guide
- **[VYOMAA_CRM_README.md](VYOMAA_CRM_README.md)** - Complete documentation
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - API reference
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Technical overview

## Features

### Core Functionality
- **Lead Management** - Comprehensive lead tracking with scoring
- **Sales Pipeline** - Visual Kanban board with drag-and-drop
- **Activity Tracking** - Log calls, emails, meetings, and more
- **Task Management** - Create and track follow-up tasks
- **Analytics Dashboard** - Real-time metrics and insights
- **Contact Management** - Multiple contacts per lead
- **Lead Scoring** - Automatic scoring based on qualification data

### Technical Features
- **JWT Authentication** - Secure user management
- **RESTful API** - 20+ documented endpoints
- **PostgreSQL Database** - Supabase-hosted robust data storage
- **TypeScript** - Full type safety
- **Responsive Design** - Works on all devices
- **CSV Import** - Bulk data loading

## Tech Stack

**Backend:**
- Node.js + TypeScript
- Express.js
- PostgreSQL (Supabase)
- JWT Authentication

**Frontend:**
- React 18 + TypeScript + Vite
- Material-UI (MUI)
- Recharts
- React Router

## Lead Status Pipeline

1. **New** - Fresh lead
2. **Qualified** - Initial qualification complete
3. **Site Survey** - Site assessment scheduled/completed
4. **Proposal** - Proposal in preparation/sent
5. **Negotiation** - Terms being discussed
6. **Won** - Deal closed successfully
7. **Lost** - Deal lost

## Project Structure

```
lead-tracking/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── config/   # Database config
│   │   ├── controllers/  # API controllers
│   │   ├── middleware/   # Auth middleware
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── db/           # Migrations & seeds
│   └── package.json
├── frontend/         # React application
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── context/      # Auth context
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client
│   │   └── types/        # TypeScript types
│   ├── netlify.toml      # Netlify deployment
│   └── package.json
├── setup.sh          # Automated setup
└── companies-sample.csv  # Sample data
```

## Development

```bash
# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install

# Start development servers
cd ..
npm run dev
```

## Deployment

**Frontend:** Deployed on Netlify
**Backend:** Deploy to Render, Railway, or similar
**Database:** Supabase PostgreSQL

### Environment Variables

**Backend (.env):**
```
PORT=5001
DB_HOST=your-supabase-host
DB_PORT=5432
DB_NAME=postgres
DB_USER=your-user
DB_PASSWORD=your-password
DB_SSL=true
JWT_SECRET=your-secret
```

**Frontend (.env):**
```
VITE_API_URL=https://your-backend-url/api
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Leads
- `GET /api/leads` - List leads with filters
- `GET /api/leads/:id` - Get lead details
- `POST /api/leads` - Create lead
- `PUT /api/leads/:id` - Update lead
- `PUT /api/leads/:id/status` - Change status
- `PUT /api/leads/:id/assign` - Assign to user

### Activities
- `GET /api/activities` - List activities
- `POST /api/activities` - Log activity

### Tasks
- `GET /api/tasks` - List tasks
- `GET /api/tasks/today` - Today's tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id/complete` - Complete task

### Dashboard
- `GET /api/dashboard/summary` - Pipeline metrics

## Security

- Password hashing with bcryptjs
- JWT token authentication
- CORS protection
- SQL injection prevention
- Security headers (Helmet)
- Input validation

## License

MIT License - For Vyomaa Energy internal use.

---

<div align="center">

**Built for Vyomaa Energy**

*Professional CRM for Renewable Energy Sales Pipeline Management*

</div>
