#!/bin/bash

# Vyomaa CRM Setup Script
# This script automates the initial setup of the Vyomaa CRM application

set -e

echo "╔═══════════════════════════════════════════╗"
echo "║     Vyomaa CRM - Automated Setup         ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "Please install Node.js v18 or higher from https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✓ Node.js is installed${NC}"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}✗ PostgreSQL is not installed${NC}"
    echo "Please install PostgreSQL v14 or higher from https://www.postgresql.org/download/"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL is installed${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is not installed${NC}"
    echo "npm should come with Node.js. Please reinstall Node.js."
    exit 1
fi
echo -e "${GREEN}✓ npm is installed${NC}"

echo ""
echo "═══════════════════════════════════════════"
echo "Step 1: Installing Dependencies"
echo "═══════════════════════════════════════════"

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo -e "${GREEN}✓ All dependencies installed${NC}"
echo ""

echo "═══════════════════════════════════════════"
echo "Step 2: Database Setup"
echo "═══════════════════════════════════════════"

# Prompt for database credentials
echo ""
echo "Please provide PostgreSQL credentials:"
read -p "PostgreSQL username (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "PostgreSQL password: " DB_PASSWORD
echo ""

DB_NAME="vyomaa_crm"

# Test PostgreSQL connection
echo "Testing PostgreSQL connection..."
export PGPASSWORD=$DB_PASSWORD
if psql -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw template1; then
    echo -e "${GREEN}✓ PostgreSQL connection successful${NC}"
else
    echo -e "${RED}✗ Failed to connect to PostgreSQL${NC}"
    echo "Please check your credentials and try again."
    exit 1
fi

# Check if database exists
if psql -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "${YELLOW}⚠ Database '$DB_NAME' already exists${NC}"
    read -p "Do you want to drop and recreate it? (y/N): " DROP_DB
    if [[ $DROP_DB =~ ^[Yy]$ ]]; then
        echo "Dropping existing database..."
        dropdb -U $DB_USER $DB_NAME
        echo "Creating database..."
        createdb -U $DB_USER $DB_NAME
        echo -e "${GREEN}✓ Database recreated${NC}"
    else
        echo "Using existing database..."
    fi
else
    echo "Creating database..."
    createdb -U $DB_USER $DB_NAME
    echo -e "${GREEN}✓ Database created${NC}"
fi

# Update backend .env file
echo ""
echo "Updating backend configuration..."
cat > backend/.env << EOF
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# JWT Configuration
JWT_SECRET=vyomaa-crm-secret-key-2024-change-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
EOF

echo -e "${GREEN}✓ Backend configuration updated${NC}"

echo ""
echo "═══════════════════════════════════════════"
echo "Step 3: Running Database Migrations"
echo "═══════════════════════════════════════════"

cd backend
npm run db:migrate
echo -e "${GREEN}✓ Database tables created${NC}"

echo ""
echo "═══════════════════════════════════════════"
echo "Step 4: Seeding Database"
echo "═══════════════════════════════════════════"

npm run db:seed
echo -e "${GREEN}✓ Admin user created${NC}"
cd ..

echo ""
echo "═══════════════════════════════════════════"
echo "Step 5: Importing Sample Data (Optional)"
echo "═══════════════════════════════════════════"

read -p "Do you want to import sample company data? (Y/n): " IMPORT_SAMPLE
if [[ ! $IMPORT_SAMPLE =~ ^[Nn]$ ]]; then
    cd backend
    npm run db:import ../companies-sample.csv
    echo -e "${GREEN}✓ Sample data imported${NC}"
    cd ..
else
    echo "Skipping sample data import..."
fi

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║          Setup Complete! 🎉               ║"
echo "╚═══════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo ""
echo "1. Start the application:"
echo "   ${GREEN}npm run dev${NC}"
echo ""
echo "2. Open your browser:"
echo "   ${GREEN}http://localhost:3000${NC}"
echo ""
echo "3. Login with default credentials:"
echo "   Email:    ${GREEN}admin@vyomaa.com${NC}"
echo "   Password: ${GREEN}admin123${NC}"
echo ""
echo -e "${YELLOW}⚠ Remember to change the default password in production!${NC}"
echo ""
echo "For more information, see:"
echo "  - QUICKSTART.md - Quick reference guide"
echo "  - VYOMAA_CRM_README.md - Complete documentation"
echo "  - API_DOCUMENTATION.md - API reference"
echo ""

unset PGPASSWORD
