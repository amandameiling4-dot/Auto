# Auto - Custodial Trading Platform

**A full-stack trading platform** with internal wallets, binary options, AI arbitrage, and admin-controlled execution.

## 🎯 Platform Features

- **Internal Custodial Wallets** - Users' funds managed by platform
- **Binary Options Trading** - Time-based prediction contracts
- **AI Arbitrage System** - Automated arbitrage detection
- **Real-time Market Data** - Live price feeds
- **Admin-Controlled Execution** - All trades require approval
- **Three-Tier Access Control** - User, Admin, Master roles

## 🏗️ System Architecture

**Single system with three interfaces** sharing one backend, one database, and real-time data:
- **Public App** → onchainweb.app (User trading interface)
- **Admin Panel** → onchainweb.app/admin (Approve trades, manage users)
- **Master Panel** → onchainweb.app/master-admin (Admin & system management)

Features REST APIs, WebSocket real-time updates, JWT authentication with 3-tier role-based access control, and PostgreSQL persistence.

> **Note:** The app name will be updated as the project nears completion.

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js 18+
- PostgreSQL
- npm

### Backend Setup
```bash
cd backend
npm install

# Create .env file (copy from .env.example and update with your database credentials)
cp .env.example .env

# Generate Prisma client and run migrations
npm run prisma:generate
npm run prisma:migrate

# Start development server
npm run dev
```

Backend runs on http://localhost:4000

### Frontend Setup

**Public App:**
```bash
cd frontend-public
npm install
npm run dev
```

**Admin Panel:**
```bash
cd frontend-admin
npm install
npm run dev
```

## 📁 Project Structure

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for complete architecture documentation.

## 🔐 Authentication

1. Register a user via POST `/auth/register` with `{ username, password, role }`
2. Login via POST `/auth/login` to get JWT token
3. Use admin credentials (role: "admin") to access admin panel

## 🌐 Production Deployment

### Automated (Ubuntu)
```bash
./deploy_onchainweb_env.sh prod
```

Supports multi-environment deployment: `prod`, `staging`, `test`

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for detailed deployment instructions.

## 📚 Documentation

Complete architecture, patterns, and deployment guide: [.github/copilot-instructions.md](.github/copilot-instructions.md)