# Development Setup Guide

## Quick Start with Docker

### 1. Start PostgreSQL
```bash
docker-compose up -d
```

This starts PostgreSQL on port 5432 with credentials:
- Username: `postgres`
- Password: `postgres`
- Database: `onchaindb`

### 2. Setup Backend
```bash
cd backend

# Install dependencies (if not done)
npm install

# .env file already configured for docker postgres
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start backend server
npm run dev
```

Backend runs on http://localhost:4000

### 3. Setup Frontends

**Terminal 2 - Public App:**
```bash
cd frontend-public
npm run dev
```
Runs on http://localhost:5173

**Terminal 3 - Admin Panel:**
```bash
cd frontend-admin
npm run dev
```
Runs on http://localhost:5174

## Creating Your First Admin User

Once the backend is running, register an admin user:

```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","role":"admin"}'
```

Or create a regular user:
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"user123","role":"user"}'
```

## Testing the Application

1. **Login to Public App** (http://localhost:5173)
   - Username: `user` or `admin`
   - Password: `user123` or `admin123`
   - View data in real-time

2. **Login to Admin Panel** (http://localhost:5174)
   - Username: `admin`
   - Password: `admin123`
   - Add/Edit/Delete items
   - See changes reflect in public app instantly

## Development Workflow

### Backend Development
- Auto-reloads on file changes (ts-node-dev)
- View logs in the terminal
- Prisma Studio: `cd backend && npx prisma studio` (database GUI on port 5555)

### Frontend Development
- Auto-reloads on file changes (Vite HMR)
- React DevTools available in browser

### Database Management

**View data:**
```bash
cd backend && npx prisma studio
```

**Reset database:**
```bash
cd backend && npx prisma migrate reset
```

**Create new migration:**
```bash
cd backend && npx prisma migrate dev --name your_migration_name
```

## Stopping Services

```bash
# Stop PostgreSQL
docker-compose down

# Stop with data cleanup
docker-compose down -v
```

## Troubleshooting

### Port Already in Use
- Backend (4000): Check if another service is using port 4000
- Frontend (5173/5174): Vite will auto-increment if port is busy
- PostgreSQL (5432): Stop other postgres instances

### Database Connection Issues
- Ensure docker-compose is running: `docker-compose ps`
- Check connection string in `backend/.env`
- Restart PostgreSQL: `docker-compose restart`

### Prisma Issues
- Regenerate client: `cd backend && npx prisma generate`
- Reset migrations: `cd backend && npx prisma migrate reset`

## Production Deployment

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for complete production deployment instructions with PM2, Nginx, and SSL.
