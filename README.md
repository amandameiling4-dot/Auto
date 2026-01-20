# Auto - Full-Stack Web Application

Monorepo web application with TypeScript backend and dual React frontends (public-facing and admin). Features REST APIs, WebSocket real-time updates, and JWT authentication with PostgreSQL persistence.

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