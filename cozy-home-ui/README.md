# Manipal Rooms

A full-stack Rental Property Management Platform built with React, TypeScript, NestJS, and PostgreSQL.

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- shadcn/ui for component library
- React Router for navigation

### Backend
- NestJS for API framework
- PostgreSQL database
- Prisma ORM
- JWT authentication with refresh tokens

## Features

- **Room Management** - Create, edit, and manage property listings
- **Booking System** - Full booking workflow from request to approval
- **Document Verification** - Upload and verify tenant documents
- **Payment Integration** - Razorpay/Cashfree payment gateway support
- **Rent Cycles** - Monthly billing with late fee calculation
- **Maintenance Tickets** - Track and resolve tenant issues
- **Admin Dashboard** - Comprehensive stats and management tools
- **Multi-role Access** - Admin and Tenant roles with JWT authentication

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
npm install
# Configure .env file with your database credentials
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

## API Documentation

Once the backend is running, visit `/api/docs` for Swagger documentation.

## Project Structure

```
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── data/          # Mock data
│   │   └── hooks/        # Custom React hooks
│   └── ...
│
├── backend/           # NestJS backend application
│   ├── src/
│   │   ├── modules/       # Feature modules
│   │   ├── prisma/       # Database service
│   │   └── common/       # Shared utilities
│   └── ...
```
