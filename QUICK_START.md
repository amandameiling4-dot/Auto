# 🚀 Quick Start Guide - OnChainWeb Platform

## Complete Setup in 5 Minutes

---

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ PostgreSQL 15 installed
- ✅ Git installed
- ✅ Port 3000 available (backend)
- ✅ Ports 5173-5175 available (frontends)

---

## Step 1: Database Setup

```bash
# Create database
sudo -u postgres psql -c "CREATE DATABASE onchainweb;"

# Create user
sudo -u postgres psql -c "CREATE USER onchainweb WITH ENCRYPTED PASSWORD 'your_password';"

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE onchainweb TO onchainweb;"
```

---

## Step 2: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
DATABASE_URL="postgresql://onchainweb:your_password@localhost:5432/onchainweb?schema=public"
JWT_SECRET="$(openssl rand -base64 64)"
NODE_ENV=development
PORT=3000
CORS_ORIGIN="*"
EOF

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed database (create test users)
node ../create-users.js

# Start backend
npm run dev
```

**Backend should now be running on http://localhost:3000**

---

## Step 3: Frontend Setup

### Public App

```bash
cd frontend-public

# Install dependencies
npm install

# Start dev server
npm run dev
```

**Public app: http://localhost:5173**

---

### Admin Panel

```bash
cd frontend-admin

# Install dependencies
npm install

# Start dev server
npm run dev
```

**Admin panel: http://localhost:5174**

---

### Master Panel

```bash
cd frontend-master

# Install dependencies
npm install

# Start dev server
npm run dev
```

**Master panel: http://localhost:5175**

---

## Step 4: Test Credentials

### User Account
```
Email: user@example.com
Password: password123
Role: USER
```

### Admin Account
```
Email: admin@example.com
Password: admin123
Role: ADMIN
```

### Master Account
```
Email: master@example.com
Password: master123
Role: MASTER
```

---

## Step 5: Verify Installation

```bash
# Run verification script
./verify-part2.sh
```

**Should see:**
- ✅ Helmet headers present
- ✅ CORS configured
- ✅ Rate limiting working
- ✅ Backend responding
- ✅ All files exist

---

## Quick Test Workflow

### 1. User Login & Trade

1. Open http://localhost:5173
2. Login with `user@example.com` / `password123`
3. Navigate to "Trade" page
4. Select symbol (BTC/USDT)
5. Enter amount ($100)
6. Click "Open Trade"
7. See trade in dashboard

---

### 2. Admin Approval

1. Open http://localhost:5174
2. Login with `admin@example.com` / `admin123`
3. Navigate to "Users" page
4. Credit balance to user ($1000)
5. Navigate to "Transactions"
6. Approve pending withdrawal
7. See real-time update in user app

---

### 3. Master Audit

1. Open http://localhost:5175
2. Login with `master@example.com` / `master123`
3. Navigate to "Audit Logs"
4. Filter by actorRole: ADMIN
5. See admin actions in real-time
6. Create new admin account
7. Disable admin account

---

## Testing Rate Limiting

```bash
# Test auth rate limiter (max 5/min)
for i in {1..7}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo ""
done

# Expected: First 5 processed, last 2 rate-limited (429)
```

---

## Testing Socket.IO

```javascript
// Open browser console on public app
const socket = io("http://localhost:3000", {
  auth: { token: localStorage.getItem("token") }
});

socket.on("connect", () => {
  console.log("✅ Connected");
  console.log("Socket ID:", socket.id);
});

socket.on("PRICE_UPDATE", (data) => {
  console.log("📈 Price Update:", data);
});

socket.on("BALANCE_UPDATED", (data) => {
  console.log("💰 Balance Updated:", data);
});
```

---

## Common Issues & Fixes

### Issue: Database connection error

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Verify connection
psql -U onchainweb -d onchainweb -h localhost
```

---

### Issue: Port already in use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port in .env
PORT=3001
```

---

### Issue: JWT secret too weak

```bash
# Generate strong secret
openssl rand -base64 64

# Update .env
JWT_SECRET="<64-character-string>"

# Restart backend
```

---

### Issue: Rate limiting too strict

```bash
# Edit backend/src/middleware/rateLimiter.js
# Increase limits for development:

export const authLimiter = rateLimit({
  windowMs: 60000,
  max: 100,  // Increase from 5 to 100 for dev
  // ...
});
```

---

## Development Tips

### Hot Reload

**Backend:**
- Changes automatically reload (ts-node-dev)
- No restart needed

**Frontend:**
- Vite hot module replacement (HMR)
- Instant updates in browser

---

### Database Inspection

```bash
# Open Prisma Studio
cd backend
npx prisma studio

# Opens browser on http://localhost:5555
# Visual database editor
```

---

### API Testing

```bash
# Save token after login
TOKEN="<jwt_token_here>"

# Test protected endpoint
curl http://localhost:3000/wallets/balance \
  -H "Authorization: Bearer $TOKEN"

# Test admin endpoint
curl http://localhost:3000/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

### Logs

**Backend logs:**
```bash
cd backend
npm run dev
# Logs appear in terminal
```

**Database queries:**
```bash
# Enable Prisma query logging
# In backend/src/database/prisma.js

export default new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

---

## Next Steps

1. ✅ Complete [TEST_CASES_QA.md](TEST_CASES_QA.md) - Run all 20 test cases
2. ✅ Review [SECURITY_HARDENING_COMPLETE.md](SECURITY_HARDENING_COMPLETE.md) - Security checklist
3. ✅ Read [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) - System architecture
4. ✅ Check [deployment/DEPLOYMENT_GUIDE.md](deployment/DEPLOYMENT_GUIDE.md) - Production deployment

---

## Production Deployment

### Quick Deploy

```bash
# Generate production .env
cat > .env.production << EOF
NODE_ENV=production
CORS_ORIGIN=https://onchainweb.app
JWT_SECRET="$(openssl rand -base64 64)"
DATABASE_URL="postgresql://user:pass@localhost:5432/onchainweb"
EOF

# Run deployment script
sudo ./deployment/deploy_production.sh
```

**Deployment script handles:**
- ✅ Database setup
- ✅ Nginx configuration
- ✅ SSL certificates (Let's Encrypt)
- ✅ PM2 process manager
- ✅ Firewall rules (UFW)
- ✅ Auto-restart on boot

---

## Support

**Documentation:**
- [README.md](README.md) - Project overview
- [DEVELOPMENT.md](DEVELOPMENT.md) - Development guide
- [TEST_CASES_QA.md](TEST_CASES_QA.md) - Test documentation
- [SECURITY_HARDENING_COMPLETE.md](SECURITY_HARDENING_COMPLETE.md) - Security guide

**Architecture:**
- [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) - System diagram
- [PART2_SUMMARY.md](PART2_SUMMARY.md) - Implementation summary

**Deployment:**
- [deployment/DEPLOYMENT_GUIDE.md](deployment/DEPLOYMENT_GUIDE.md) - Full deployment guide
- [deployment/SECURITY_CHECKLIST.md](deployment/SECURITY_CHECKLIST.md) - Security checklist

---

## ✅ Quick Start Complete!

**You now have:**
- ✅ Backend API running (http://localhost:3000)
- ✅ Public app (http://localhost:5173)
- ✅ Admin panel (http://localhost:5174)
- ✅ Master panel (http://localhost:5175)
- ✅ Security middleware active
- ✅ Rate limiting enabled
- ✅ Socket.IO real-time updates
- ✅ Test accounts ready

**Start building and testing! 🚀**
