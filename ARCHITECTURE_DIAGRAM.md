# 🏗️ Complete System Architecture

## OnChainWeb Platform - Full Stack Implementation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INTERNET / USERS                                   │
│                     (Web Browsers, Mobile Devices)                           │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │
                              │ HTTPS (SSL/TLS)
                              │ WebSocket (wss://)
                              │
┌─────────────────────────────┴───────────────────────────────────────────────┐
│                         NGINX REVERSE PROXY                                  │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ • SSL/TLS Termination (Let's Encrypt)                              │    │
│  │ • Rate Limiting (300 req/min per IP)                               │    │
│  │ • Path-based Routing                                               │    │
│  │   - / → Public App (frontend-public)                               │    │
│  │   - /admin → Admin Panel (frontend-admin)                          │    │
│  │   - /master-admin → Master Panel (frontend-master)                 │    │
│  │   - /api → Backend API (port 3000)                                 │    │
│  │ • WebSocket Proxy (upgrade headers)                                │    │
│  │ • Static File Serving (dist/)                                      │    │
│  └────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Public App   │    │ Admin Panel  │    │ Master Panel │
│ (React)      │    │ (React)      │    │ (React)      │
│ Port: 5173   │    │ Port: 5174   │    │ Port: 5175   │
│              │    │              │    │              │
│ • Login      │    │ • Users      │    │ • Audit Logs │
│ • Dashboard  │    │ • TXs        │    │ • Admins     │
│ • Trade      │    │ • Credit     │    │ • Config     │
│ • Binary     │    │ • Freeze     │    │ • System     │
│ • Wallet     │    │ • Approve    │    │ • Emergency  │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                    HTTP/HTTPS + WebSocket
                              │
┌─────────────────────────────┴───────────────────────────────────────────────┐
│                       BACKEND API (Node.js + Express)                        │
│                           Port: 3000 (PM2 Managed)                           │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                      SECURITY MIDDLEWARE                            │    │
│  │  ✅ Helmet (CSP, HSTS, X-Frame-Options, XSS)                        │    │
│  │  ✅ CORS (Production: onchainweb.app only)                          │    │
│  │  ✅ Rate Limiting:                                                   │    │
│  │     - /auth: 5 req/min (skip successful)                            │    │
│  │     - /trades: 20 req/min                                           │    │
│  │     - /binary: 30 req/min                                           │    │
│  │     - /admin: 50 req/min                                            │    │
│  │     - API: 100 req/min                                              │    │
│  │  ✅ JWT Authentication (all protected routes)                       │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                          API ROUTES                                 │    │
│  │                                                                      │    │
│  │  /auth          → Login, Register (authLimiter)                     │    │
│  │  /users         → User profile, settings                            │    │
│  │  /wallets       → Balance, deposit, withdraw                        │    │
│  │  /trades        → Open, close, history (tradeLimiter)               │    │
│  │  /transactions  → Withdrawals, deposits, history                    │    │
│  │  /binary        → Open binary, history (binaryLimiter)              │    │
│  │  /ai            → AI opt-in, settings, history                      │    │
│  │  /admin         → User mgmt, TX approvals (adminLimiter, ADMIN)     │    │
│  │  /master        → Audit logs, admin mgmt, config (MASTER)           │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                      BUSINESS LOGIC SERVICES                        │    │
│  │                                                                      │    │
│  │  Auth Service        → JWT generation, password hashing (bcrypt)    │    │
│  │  User Service        → CRUD, profile, status management             │    │
│  │  Wallet Service      → credit(), debit(), getWallet()               │    │
│  │  Trade Engine        → openTrade(), closeTrade(), PnL calculation   │    │
│  │  Transaction Service → createTransaction(), approvals, history      │    │
│  │  Binary Engine       → openBinary(), resolveBinary() (cron)         │    │
│  │  AI Engine           → detectArb(), signal generation               │    │
│  │  Admin Controller    → approveTx(), freezeUser(), creditBalance()  │    │
│  │  Master Controller   → getAuditLogs(), createAdmin(), disableAdmin()│    │
│  │  Audit Service       → logAction() (all mutations)                  │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                      SOCKET.IO SERVER (wss://)                      │    │
│  │                                                                      │    │
│  │  ✅ JWT Authentication on handshake                                 │    │
│  │  ✅ Role-based rooms: user:{id}, admin, master                      │    │
│  │  ✅ Events:                                                          │    │
│  │     - PRICE_UPDATE          → Live market prices                    │    │
│  │     - BALANCE_UPDATED       → User balance changes                  │    │
│  │     - TRADE_OPENED          → New position opened                   │    │
│  │     - TRADE_CLOSED          → Position closed with PnL              │    │
│  │     - BINARY_RESOLVED       → Binary option settled                 │    │
│  │     - TX_STATUS_UPDATED     → Transaction approval/rejection        │    │
│  │     - USER_FROZEN           → User account frozen                   │    │
│  │     - ADMIN_ACTION          → Admin performed action (to master)    │    │
│  │     - SYSTEM_ALERT          → System-wide notifications             │    │
│  └────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ PostgreSQL   │    │ Prisma ORM   │    │ External     │
│ Database     │    │              │    │ Market Feeds │
│              │    │ Client       │    │ (WebSocket)  │
│ • Users      │◄───┤ Singleton    │    │              │
│ • Wallets    │    │              │    │ • Binance    │
│ • Trades     │    │ Models:      │    │ • Coinbase   │
│ • Binary     │    │ - User       │    │ • FX feeds   │
│ • TXs        │    │ - Wallet     │    │              │
│ • AuditLog   │    │ - Trade      │    │ Price Cache  │
│ • Admin      │    │ - Binary     │    │ (in-memory)  │
│              │    │ - TX         │    │ 60s expiry   │
│ Port: 5432   │    │ - AuditLog   │    │              │
└──────────────┘    └──────────────┘    └──────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA FLOW EXAMPLES                                  │
└─────────────────────────────────────────────────────────────────────────────┘

1️⃣ USER TRADE FLOW
──────────────────
User (Public App)
  │ 1. Click "Open Trade" (BTC/USDT, $100)
  ├──► POST /trades/open { symbol, amount } + JWT
  │    └─► Rate Limiter (20 req/min) ✅
  │        └─► Auth Middleware (JWT verify) ✅
  │            └─► Trade Controller → Trade Engine
  │                ├─► Check wallet balance ✅
  │                ├─► Get market price (cache) ✅
  │                ├─► Lock funds (increase exposure)
  │                ├─► Create Trade record (status: OPEN)
  │                ├─► Emit Socket.IO: TRADE_OPENED
  │                └─► Return { tradeId, entry, timestamp }
  │
  └─► Frontend receives:
      ├─► HTTP 200 + trade data
      └─► Socket event: TRADE_OPENED → Update UI


2️⃣ ADMIN APPROVAL FLOW
───────────────────────
Admin (Admin Panel)
  │ 1. Review pending withdrawal ($500)
  ├──► PUT /admin/tx/{id}/approve-tx + ADMIN JWT
  │    └─► Rate Limiter (50 req/min) ✅
  │        └─► Auth Middleware (role: ADMIN) ✅
  │            └─► Admin Controller → approveTx()
  │                ├─► Prisma.$transaction([
  │                │     TX.update(status: COMPLETED),
  │                │     Wallet.update(balance: -500),
  │                │     AuditLog.create(...)
  │                │   ]) ✅ ATOMIC
  │                ├─► Emit Socket.IO to user: TX_STATUS_UPDATED
  │                ├─► Emit Socket.IO to master: ADMIN_ACTION
  │                └─► Return { status: "APPROVED" }
  │
  └─► Real-time updates:
      ├─► User sees balance deducted instantly
      └─► Master sees admin action in audit log


3️⃣ MASTER AUDIT QUERY
──────────────────────
Master (Master Panel)
  │ 1. Open Audit Logs page
  ├──► GET /master/audit/logs?actorRole=ADMIN + MASTER JWT
  │    └─► Rate Limiter (API: 100 req/min) ✅
  │        └─► Auth Middleware (role: MASTER) ✅
  │            └─► Master Controller → getAuditLogs()
  │                ├─► Prisma.auditLog.findMany({
  │                │     where: { actorRole: "ADMIN" },
  │                │     orderBy: { createdAt: "desc" }
  │                │   })
  │                └─► Return { logs: [...], total, hasMore }
  │
  ├─► Socket.IO connection (ADMIN_ACTION room)
  │   └─► Listen for real-time admin actions
  │       └─► Auto-update table without refresh
  │
  └─► Frontend displays:
      └─► Filterable audit log with real-time updates


4️⃣ REAL-TIME PRICE UPDATE
──────────────────────────
External Feed (Binance WebSocket)
  │ 1. BTC/USDT price: $50,000
  ├──► Market Service receives price
  │    ├─► Normalize format
  │    ├─► Update in-memory cache
  │    ├─► Emit Socket.IO: PRICE_UPDATE
  │    │   └─► Broadcast to ALL connected users
  │    │       ├─► Public app: Update chart
  │    │       ├─► Admin panel: Update live trades table
  │    │       └─► Master panel: System status
  │    │
  │    └─► AI Engine checks for arbitrage
  │        └─► If opportunity detected → Log + Notify
  │
  └─► All frontends update instantly (no polling)

┌─────────────────────────────────────────────────────────────────────────────┐
│                          SECURITY LAYERS                                     │
└─────────────────────────────────────────────────────────────────────────────┘

Layer 1: Nginx
  ├─► SSL/TLS encryption (HTTPS only)
  ├─► Rate limiting (300 req/min per IP)
  ├─► DDoS protection
  └─► Reverse proxy (hide backend)

Layer 2: Express Middleware
  ├─► Helmet (security headers)
  │   ├─► CSP: Prevent XSS
  │   ├─► HSTS: Enforce HTTPS
  │   ├─► X-Frame-Options: Prevent clickjacking
  │   └─► X-Content-Type-Options: Prevent MIME sniffing
  │
  ├─► CORS (production: onchainweb.app only)
  │
  └─► Rate Limiters (per endpoint)
      ├─► Auth: 5 req/min (brute force protection)
      ├─► Trades: 20 req/min (spam prevention)
      ├─► Binary: 30 req/min
      ├─► Admin: 50 req/min
      └─► API: 100 req/min

Layer 3: JWT Authentication
  ├─► All protected routes require valid token
  ├─► Token contains: userId, role, expiry
  ├─► Role-based access control (RBAC)
  │   ├─► USER: Public routes only
  │   ├─► ADMIN: Admin routes + user routes
  │   └─► MASTER: All routes
  │
  └─► Socket.IO: JWT on handshake

Layer 4: Business Logic
  ├─► Input validation (all user inputs)
  ├─► Output sanitization (prevent XSS)
  ├─► SQL injection protection (Prisma parameterized queries)
  ├─► Atomic transactions (Prisma.$transaction)
  └─► Audit logging (all mutations)

Layer 5: Database
  ├─► Encrypted at rest
  ├─► Connection pooling
  ├─► Read replicas (future)
  └─► Automated backups

┌─────────────────────────────────────────────────────────────────────────────┐
│                          DEPLOYMENT STACK                                    │
└─────────────────────────────────────────────────────────────────────────────┘

Infrastructure:
  ├─► Ubuntu 20.04 LTS (VPS/Cloud)
  ├─► Nginx 1.18+ (reverse proxy)
  ├─► Node.js 18+ (runtime)
  ├─► PostgreSQL 15 (database)
  ├─► PM2 (process manager)
  │   ├─► Cluster mode (2 instances)
  │   ├─► Auto-restart on crash
  │   ├─► Log rotation
  │   └─► Zero-downtime reloads
  │
  └─► Let's Encrypt (SSL certificates)
      ├─► Auto-renewal (certbot)
      └─► HTTPS enforcement

Monitoring:
  ├─► PM2 logs (backend)
  ├─► Nginx access/error logs
  ├─► PostgreSQL query logs
  └─► AuditLog table (all actions)

Security:
  ├─► UFW firewall (ports 80, 443, 22 only)
  ├─► Fail2ban (brute force protection)
  ├─► SSH key-only authentication
  └─► Regular security updates

Backup:
  ├─► Database daily backups (pg_dump)
  ├─► Code repository (Git)
  └─► Disaster recovery plan

┌─────────────────────────────────────────────────────────────────────────────┐
│                        TECHNOLOGY STACK SUMMARY                              │
└─────────────────────────────────────────────────────────────────────────────┘

Frontend:
  ├─► React 18.2.0
  ├─► Vite 5.0.8 (build tool)
  ├─► React Router DOM (routing)
  ├─► Axios (HTTP client)
  ├─► socket.io-client 4.7.4 (WebSocket)
  └─► ESLint + Prettier (code quality)

Backend:
  ├─► Node.js 18+
  ├─► Express 4.18.2
  ├─► Prisma ORM 5.x
  ├─► Socket.IO 4.7.4
  ├─► JWT (jsonwebtoken 9.0.2)
  ├─► bcrypt 5.1.0 (password hashing)
  ├─► helmet 8.0.0 (security headers)
  ├─► express-rate-limit 7.1.5 (rate limiting)
  ├─► cors (CORS middleware)
  ├─► dotenv (environment config)
  └─► ws 8.16.0 (external WebSocket feeds)

Database:
  ├─► PostgreSQL 15
  ├─► Prisma Schema (ORM)
  └─► UUID primary keys

Deployment:
  ├─► Nginx (reverse proxy)
  ├─► PM2 (process manager)
  ├─► Let's Encrypt (SSL)
  ├─► Ubuntu 20.04 LTS
  └─► Git (version control)

Testing:
  ├─► Manual test cases (20+)
  ├─► cURL scripts
  ├─► Verification script (verify-part2.sh)
  └─► QA checklist

Documentation:
  ├─► Copilot instructions (1,600+ lines)
  ├─► Test cases (TEST_CASES_QA.md)
  ├─► Security hardening (SECURITY_HARDENING_COMPLETE.md)
  ├─► Deployment guide (DEPLOYMENT_GUIDE.md)
  └─► Architecture diagram (this file)

┌─────────────────────────────────────────────────────────────────────────────┐
│                            STATUS: ✅ COMPLETE                                │
│                                                                              │
│  • Frontend: 3 apps fully functional                                         │
│  • Backend: All services implemented                                         │
│  • Security: Enterprise-grade hardening                                      │
│  • Testing: 20 comprehensive test cases                                      │
│  • Documentation: Complete and detailed                                      │
│  • Deployment: Production-ready scripts                                      │
│                                                                              │
│                    🚀 READY FOR PRODUCTION DEPLOYMENT 🚀                     │
└─────────────────────────────────────────────────────────────────────────────┘
```
