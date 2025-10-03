# ShareMarket Manager Pro

## Overview
A full-stack React application for managing shareholders, client profiles, and DMAT (Demat) accounts. The application provides a comprehensive dashboard for tracking and managing share market data with an integrated Express backend and MongoDB database.

## Tech Stack

- **Frontend**: React 18 + React Router 6 (SPA) + Vite + TailwindCSS 3
- **Backend**: Express.js server (Node.js)
- **Database**: MongoDB (Mongoose ODM)
- **UI Components**: Radix UI + Lucide React icons
- **Development**: Hot reload for both client and server

## Project Architecture

### Directory Structure
```
client/                   # React SPA frontend
├── pages/               # Route components (Index, ClientProfiles, Shareholders, DmatAccounts)
├── lib/                 # API client utilities
├── App.jsx              # App entry point with routing setup
└── global.css           # TailwindCSS theming

server/                   # Express API backend
├── models/              # Mongoose models (ClientProfile, DmatAccount, Shareholder)
├── routes/              # API route handlers
├── db.js                # MongoDB connection logic
├── app.js               # Express app configuration
└── server.js            # Server entry point

data/                    # Initial data files
└── shareholders.json    # Sample shareholder data
```

### Port Configuration
- **Frontend (Vite)**: Port 5000 (configured for Replit proxy)
- **Backend (Express)**: Port 3000
- **Development**: Both run simultaneously via workflow

### API Endpoints
All API endpoints are prefixed with `/api/`:
- `/api/ping` - Health check endpoint
- `/api/shareholders` - CRUD operations for shareholders (file-based)
- `/api/dmat` - CRUD operations for DMAT accounts (MongoDB)
- `/api/client-profiles` - CRUD operations for client profiles (MongoDB)

## Replit Configuration

### Environment Setup
The application is configured to run in Replit with:
1. Frontend on port 5000 (bound to 0.0.0.0 for proxy access)
2. Backend on port 3000 (localhost)
3. Vite proxy forwards `/api` requests to backend

### Environment Variables
MongoDB connection is configured in `server/.env`:
- `MONGODB_URI` - MongoDB connection string
- `DB_NAME` - Database name (demosharemarket)
- `PORT` - Backend server port (3000)

### Development Workflow
The Dev Server workflow runs both frontend and backend:
```bash
cd /home/runner/workspace/server && node server.js & cd /home/runner/workspace && npm run dev
```

### Deployment Configuration
- **Target**: Autoscale (stateless web application)
- **Build**: `npm run build` (builds both client and server)
- **Run**: `npm start` (runs production server)

## Features

### Dashboard
- Overview of total shareholders, client profiles, and DMAT accounts
- Real-time statistics from database

### Client Profiles
- Search by name, PAN, or company
- View, edit, and delete client profiles
- Add new clients
- Active/Inactive status tracking

### Shareholders
- Manage shareholder information
- File-based data storage

### DMAT Accounts
- Manage demat account information
- MongoDB-backed storage
- Linked to client profiles

## Development

### Running Locally
1. Both frontend and backend start automatically via the Dev Server workflow
2. Frontend: http://localhost:5000
3. Backend API: http://localhost:3000/api
4. Hot reload enabled for both

### Database
- MongoDB Atlas connection configured
- Database: demosharemarket
- Collections: clientprofiles, dmataccounts
- Initial seed data available

## Recent Changes
- **2025-10-03**: Initial Replit setup
  - Configured ports for Replit environment (frontend: 5000, backend: 3000)
  - Set up Vite with proxy for API requests
  - Configured host binding (0.0.0.0 for frontend)
  - Added `allowedHosts: true` to Vite config for Replit proxy compatibility
  - Created unified workflow for dev server
  - Configured deployment for autoscale

## Project Status
✅ Fully configured and running in Replit
✅ MongoDB database connected
✅ Frontend and backend working correctly
✅ Deployment configured
