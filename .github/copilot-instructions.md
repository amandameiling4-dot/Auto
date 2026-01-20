# Copilot Instructions for Auto

## 🔹 GLOBAL APP CONCEPT

**This is a custodial trading platform** with the following characteristics:

- **Internal wallets** - Users have custodial wallets managed by the platform
- **Simulated trading logic** - Trading operations validated by system, not auto-executed
- **Real-time market feeds** - Live price data for trading instruments
- **Admin-controlled execution** - Admins approve/reject trades and withdrawals
- **Master-controlled system** - Master manages admins and system configuration
- **Binary options trading** - Time-based prediction contracts
- **AI arbitrage** - Automated arbitrage detection and execution
- **Real-time updates** - Socket.IO for instant notifications

❗ **Key Business Rule:** Trades are system-validated, not auto-minted, not auto-approved. All critical operations require admin review.

## Project Overview
**Single system with three interfaces** sharing one backend, one database, and real-time data synchronization:
1. **Public App** → onchainweb.app (User trading interface)
2. **Admin Panel** → onchainweb.app/admin (Trade/withdrawal approvals, user management)
3. **Master Panel** → onchainweb.app/master-admin (Admin management, system control)

Backend provides REST APIs, WebSocket connections, and JWT authentication with role-based access control.

## Structure
```
backend/
  ├─ src/
  │   ├─ app.js                - Express configuration
  │   ├─ server.js             - Server entry point
  │   ├─ env.js                - Environment config
  │   │
  │   ├─ database/
  │   │   ├─ prisma.js         - Prisma client initialization
  │   │   └─ seed.js           - Database seeding
  │   │
  │   ├─ auth/
  │   │   ├─ auth.controller.js  - Auth request handlers
  │   │   ├─ auth.service.js     - Auth business logic
  │   │   ├─ auth.routes.js      - Auth route definitions
  │   │   └─ auth.middleware.js  - JWT validation & role guards
  │   │
  │   ├─ users/
  │   │   ├─ user.controller.js  - User request handlers
  │   │   ├─ user.service.js     - User business logic
  │   │   └─ user.routes.js      - User route definitions
  │   │
  │   ├─ wallets/
  │   │   ├─ wallet.controller.js - Wallet request handlers
  │   │   ├─ wallet.service.js    - Wallet business logic
  │   │   └─ wallet.routes.js     - Wallet route definitions
  │   │
  │   ├─ transactions/
  │   │   ├─ tx.controller.js     - Transaction handlers
  │   │   ├─ tx.service.js        - Transaction logic
  │   │   └─ tx.routes.js         - Transaction routes
  │   │
  │   ├─ admin/
  │   │   ├─ admin.controller.js  - Admin panel handlers
  │   │   ├─ admin.service.js     - Admin business logic
  │   │   └─ admin.routes.js      - Admin route definitions
  │   │
  │   ├─ master/
  │   │   ├─ master.controller.js - Master panel handlers
  │   │   ├─ master.service.js    - Master business logic
  │   │   └─ master.routes.js     - Master route definitions
  │   │
  │   ├─ audit/
  │   │   ├─ audit.service.js     - Audit logging service
  │   │   └─ audit.model.js       - Audit data models
  │   │
  │   ├─ sockets/
  │   │   ├─ socket.js            - Socket.io setup
  │   │   └─ events.js            - Socket event handlers
  │   │
  │   └─ utils/
  │       ├─ hash.js              - Password hashing (bcrypt)
  │       ├─ token.js             - JWT generation/validation
  │       └─ logger.js            - Logging utility
  │
  └─ prisma/
      └─ schema.prisma            - Database models (User, Wallet, Transaction, Admin, AuditLog)
│
frontend-public/                  - Public app (onchainweb.app/)
frontend-admin/                   - Admin panel (onchainweb.app/admin)
frontend-master/                  - Master panel (onchainweb.app/master-admin)
```

## Architecture Overview
```
                              ┌─────────────────┐
                              │   Internet /    │
                              │  Users/Clients  │
                              └─────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│  Public App   │           │ Admin Panel   │           │ Master Panel  │
│ onchainweb.   │           │ /admin        │           │/master-admin  │
│   app         │           │               │           │               │
└───────────────┘           └───────────────┘           └───────────────┘
        │                             │                             │
        │                             │                             │
        └─────────────────────────────┼─────────────────────────────┘
                                      │
                              HTTP/HTTPS + WebSocket
                                      │
                              ┌───────────────┐
                              │   Nginx       │
                              │ Reverse Proxy │
                              │ Path-based    │
                              │ Routing + SSL │
                              └───────────────┘
                                      │
                       ┌──────────────┴──────────────┐
                       │ Backend API (Node.js +      │
                       │ Express + Prisma)           │
                       │ Runs via PM2                │
                       │ THREE ROLE SYSTEM:          │
                       │ - user (public)             │
                       │ - admin (admin panel)       │
                       │ - master (master panel)     │
                       └──────────────┬──────────────┘
                                      │
                  ┌───────────────────┴───────────────┐
                  │                                   │
          PostgreSQL Database                 Socket.IO Server
          (Persistent Storage)                (Real-time updates)
          - Users (3 roles)                   - Broadcasts to ALL
          - Items/Data                        - Role-based filtering
                  │                                   │
                  └───────────────────┬───────────────┘
                                      │
                           Real-time events
              (Master/Admin actions → All panels update)
```

**Key components**:
- **Single Domain**: All three interfaces served from onchainweb.app with path-based routing
- **Three User Roles**: user (public), admin (admin panel), master (master panel)
- **Nginx**: Path-based routing (/, /admin, /master-admin), WebSocket proxy, SSL/HTTPS
- **Backend**: Node.js + Express + Prisma running via PM2 for auto-restart and uptime
- **Database**: PostgreSQL for persistent storage of users and items (single shared database)
- **Real-time**: Socket.io integrated - master/admin actions instantly update all connected panels
- **Deployment**: Script automates full setup (database, PM2, Nginx, SSL) with multi-environment support

## Development Workflow
Each package runs independently: on port 5173)
- **Admin Frontend**: `cd frontend-admin && npm install && npm run dev` (Vite dev server on port 5174)
- **Master Frontend**: `cd frontend-master && npm install && npm run dev` (Vite dev server on port 5175)

Start backend first, then all three frontends connect via `api.js` modules to `http://localhost:4000`.

**Three-Role System:**
- **user** - Public app access (read-only)
- **admin** - Admin panel access (CRUD operations)
- **master** - Master panel access (full system control + user/admin management)
  3. `npm run prisma:generate` (generates Prisma client)
  4. `npm run prisma:migrate` (runs migrations)
  5. `npm run dev` (ts-node-dev with hot reload on port 4000)
- **Public Frontend**: `cd frontend-public && npm install && npm run dev` (Vite dev server)
- **Admin Frontend**: `cd frontend-admin && npm install && npm run dev` (Vite dev server)

Start backend first, then frontends connect via `api.js` modules to `http://localhost:4000`.

### Testing Authentication
To get a token for testing:
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin"}'
```
Save returned token to `localStorage.token` in browser console.

## Architecture Patterns

### Backend (`backend/src/`)
- **index.ts** - Server entry point, creates HTTP server, initializes Socket.io with CORS (`origin: "*"`)
- **app.ts** - Express app with two main routers: `/auth` (authRouter) and `/data` (dataRouter)
- **env.ts** - Exports `ENV` object with `PORT`, `JWT_SECRET` from `process.env` (uses dotenv)
- **auth.ts** - Exports `authRouter` (register/login with bcrypt) and `guard` middleware, instantiates `PrismaClient`
- **data.ts** - Exports `dataRouter` for CRUD using `PrismaClient`, imports `io` for real-time broadcasts
- **socket.ts** - Exports `initSocket(io)` to initialize global `io` instance, and `io` for use in other modules
- **error.ts** - Exports `errorHandler` middleware, applied last in `app.ts` (returns 500 with `{ error: err.message }`)
- **prisma/schema.prisma** - Database models: `User` (id, username, role, password), `Item` (id, message, createdAt, updatedAt)

Key dependencies: `express`, `socket.io`, `jsonwebtoken`, `cors`, `@prisma/client`, `bcrypt`, `dotenv`
TypeScript config: ES2020 target, CommonJS modules, strict mode enabled

### Frontend Architecture
Both frontends use Vite for development and share similar structure:
- **index.html** - Entry HTML with `<div id="root">` and module script pointing to `src/main.jsx`
- **main.jsx** - React app entry point (React 18 `ReactDOM.createRoot`)
- **App.jsx** - Root component with login flow, state management, and Socket.io connection
- **api.js** - Exports `API` constant (`"http://localhost:4000"`)

Key dependencies: `react`, `react-dom`, `socket.io-client`, `@vitejs/plugin-react`, `vite`
Scripts: `npm run dev` (Vite dev server), `npm run build`, `npm run preview`

**Frontend-public**: Login UI (username input), reads data (GET `/data/`), listens for real-time updates
**Frontend-admin**: Login UI (username input), full CRUD operations:
  - Add: POST `/data/` with `{ message: "New item " + Date.now() }`
  - Edit: PUT `/data/:id` with `{ message: "Updated " + Date.now() }`
  - Delete: DELETE `/data/:id`
  - Real-time sync via Socket.io, renders items in `<ul>` with inline edit/delete buttons

## Key Conventions

### Architecture Pattern: Controller → Service → Database

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Prisma ORM** - Database toolkit and query builder
- **PostgreSQL** - Relational database
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing

### Frontend
- **Reacbase Models & Relationships
- **User**: Core user model with email, password, role (USER/ADMIN/MASTER), status (ACTIVE/FROZEN/SUSPENDED)
- **Wallet**: One-to-one with User, stores balance (Decimal 20,8), locked status
- **Transaction**: Many-to-one with User, tracks DEPOSIT/WITHDRAWAL/CREDIT/DEBIT/TRANSFER operations
- **Admin**: Separate admin accounts with active status
- **AuditLog**: Tracks all actions by actorId, actorRole, action, target, metadata

### Service Pattern Examples
**User Service** (`user.service.js`):
- `getUsers()` - Fetch all users with optional filters
- `getUserById(id)` - Get single user with wallet
- `updateUserStatus(id, status)` - Update user status (ACTIVE/FROZEN)
- `deleteUser(id)` - Soft delete or hard delete user

**Wallet Service** (`wallet.service.js`):
- `createWallet(userId)` - Auto-create wallet on user registration
- `getBalance(userId)` - Get current wallet balance
- `lockWallet(userId)` - Freeze wallet (prevent transactions)
- `unlockWallet(userId)` - Unfreeze wallet

**Transaction Service** (`tx.service.js`):
- `createTransaction(userId, type, amount)` - Create new transaction
- `approveTransaction(txId, actorId)` - Admin/Master approve
- `rejectTransaction(txId, actorId)` - Admin/Master reject
- `getTransactionHistory(userId, filters)` - Get user transactions

All mutations trigger `audit.service.js` logging and Socket.IO broadcasts
3. **Services** contain business logic, interact with Prisma
4. **Middleware** handles authentication, authorization, validation

### Authentication Flow
1. **Register**: POST `/auth/register` with `{ email, password, role }` - hashes password with bcrypt (10 rounds)
2. **Login**: POST `/auth/login` with `{ email, password }` - validates credentials, returns `{ token, user }`
3. Backend uses `bcrypt.compare()` to verify password against hashed value in `User` table
4. JWT toTime Communication (Socket.IO)
**Backend** (`sockets/socket.js`, `sockets/events.js`):
- Global `io` instance initialized in `server.js`
- Connection authentication: Verify JWT token on socket connect
- Room-based broadcasting: `USER`, `ADMIN`, `MASTER` rooms for role-based events
- Event types:
  - `wallet:update` - Balance changes
  - `transaction:new` - New transaction created
  - `transaction:status` - Transaction status change
  - `user:status` - User status change (frozen/unfrozen)
  - `system:alert` - System-wide notifications

**Frontend** (All three apps):
- Connect via `io(API, { auth: { token } })` in useEffect
- Join role-specific room on connection

## 3️⃣ USER WALLET MODULE

### Files Structure
```
wallets/
├── wallet.controller.js  - HTTP request handlers
├── wallet.service.js     - Balance operations, wallet logic
└── wallet.routes.js      - Route definitions
```

### Core Functions

**getWallet(userId)**
```javascript
// Returns complete wallet information
// Returns: {
//   id: string,
//   userId: string,
//   balance: Decimal,
//   locked: boolean,
//   exposure: Decimal,  // Amount in open trades
//   availableBalance: balance - exposure
// }
// Used by: User dashboard, trading checks
```

**lockWallet(userId)**
```javascript
// Sets wallet.locked = true
// Blocks all trading operations
// Blocks all withdrawal requests
// Used by: Admin freeze action, System risk management
// Returns: { locked: true, reason: string }
```

**updateBalance(userId, amount, reason)**
```javascript
// Updates wallet balance
// ONLY called by:
//   1. Admin approval (credit/debit)
//   2. Trade settlement (profit/loss)
//   3. System correction (manual adjustment)
// 
// ❗ Users NEVER update balance directly
// ❗ All balance changes logged in AuditLog
// ❗ Triggers BALANCE_UPDATED Socket.IO event
//
// Parameters:
//   amount: positive (credit) or negative (debit)
//   reason: "ADMIN_CREDIT" | "TRADE_SETTLEMENT" | "WITHDRAWAL_APPROVED" | etc.
```

### Wallet Business Rules
- ✅ One wallet per user (1:1 relationship)
- ✅ Auto-created on user registration
- ✅ Balance stored as Decimal(20,8) for precision
- ✅ Locked wallets cannot trade or withdraw
- ✅ Exposure tracks funds in open positions
- ✅ Available balance = balance - exposure
- ✅ All balance changes require a reason and are audited

## 4️⃣ REAL-TIME MARKET DATA MODULE

### Files Structure
```
market/
├── market.service.js   - Market data logic, feed connections
├── market.gateway.js   - WebSocket gateway for external feeds
└── market.cache.js     - In-memory price cache with timestamps
```

### Core Functions

**connectMarketFeeds()**
```javascript
// Connects to external market data sources via WebSocket
// Sources:
//   - Crypto price feeds (Binance, Coinbase, etc.)
//   - FX feeds (forex pairs)
//   - Indices (optional - S&P 500, NASDAQ, etc.)
//
// Maintains persistent WebSocket connections
// Auto-reconnects on disconnect
// Handles authentication with feed providers
```

**normalizePrice(symbol, rawData)**
```javascript
// Converts external feed format to internal format
// Input: Raw data from different providers
// Output: {
//   symbol: string,      // e.g., "BTC/USDT"
//   price: Decimal,      // Current price
//   timestamp: DateTime,
//   source: string       // Feed provider name
// }
// Handles different timestamp formats
// Validates price data integrity
```

**cacheMarketData(symbol, price)**
```javascript
// Stores latest price in memory cache
// Structure: Map<symbol, { price, timestamp }>
// Used for:
//   - Fast price lookups during trade execution
//   - Chart data retrieval
//   - AI arbitrage calculations
//
// Cache expiry: 60 seconds (stale data check)
```

**emitPriceUpdate(symbol)**
```javascript
// Broadcasts price update via Socket.IO
// Emitted to: All connected clients (public, admin, master)
// Event: "PRICE_UPDATE"
// Payload: { symbol, price, timestamp }
//
// Used by:
//   - Real-time charts in user interface
//   - Trade execution price validation
//   - AI arbitrage opportunity detection
```

### Market Data Business Rules
- ✅ **Read-only** - Market data is never editable by users or admins
- ✅ **Real-time** - WebSocket feeds for instant updates
- ✅ **Cached** - In-memory storage for fast access
- ✅ **Timestamped** - All prices include exact timestamp
- ✅ **Normalized** - Consistent format across all sources
- ✅ **Broadcast** - Socket.IO for live updates to all clients
- ✅ **Validated** - Price sanity checks (not negative, not stale)

### New API Module
1. Create new directory: `src/moduleName/`
2. Add files: `moduleName.controller.js`, `moduleName.service.js`, `moduleName.routes.js`
3. Define routes in `moduleName.routes.js` (use `auth.middleware.js` for protection)
4. Implement controllers (handle req/res, call services)
5. Implement services (business logic, Prisma queries)
6. Register routes in `app.js`: `app.use('/api/moduleName', moduleNameRoutes)`

### New Database Model
1. Add model to `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_model_name`
3. Run `npx prisma generate`
4. Create service methods to interact with new model
5. Add audit logging for model mutations

### New Socket Event
1. Define event in `sockets/events.js`
2. Emit from service layer: `io.to('ADMIN').emit('event:name', data)`
3. Add listener in frontend: `socket.on('event:name', handler)`

### Role-Based Feature
1. Add role check in `auth.middleware.js`: `requireRole(['ADMIN', 'MASTER'])`
2. Use middleware in routes: `router.get('/endpoint', requireRole(['ADMIN']), controller)`
3. Add frontend route guard in React Router

## Admin Control Process (STEP 6)

### Admin Capabilities

**1. Credit Balance**
```javascript
POST /admin/credit
Body: { userId, amount }
→ Create CREDIT transaction
→ Update wallet balance
→ Log action in AuditLog
→ Emit socket event: BALANCE_UPDATED
```

**2. Approve Withdrawal**
```javascript
PUT /admin/transaction/:id/approve
→ Change status: PENDING → APPROVED → COMPLETED
→ Deduct from wallet balance
→ Log action in AuditLog
→ Emit socket event: TX_STATUS_UPDATED
```

**3. Freeze User**
```javascript
PUT /admin/user/:id/freeze
Body: { reason }
→ Set user.status = FROZEN
→ Lock user wallet
→ Disconnect user sockets
→ Log action in AuditLog
→ Emit socket event: USER_FROZEN
```

**All Admin Actions:**
- ✅ Logged in `AuditLog` with actorId, actorRole, action, target
- ✅ Visible to master panel in real-time
- ✅ Trigger Socket.IO broadcasts
- ✅ Include metadata (reason, amount, etc.)

## Master Control Process (STEP 7)

### Master Capabilities

**Admin Management**
```javascript
POST /master/admin/create
→ Create new admin account
→ Log in AuditLog

PUT /master/admin/:id/disable
→ Set admin.active = false
→ Revoke admin sessions
→ Log in AuditLog

GET /master/admin/actions
→ Fetch all admin actions from AuditLog
→ Filter by date, admin, action type
```

**System Control**
```javascript
PUT /master/system/maintenance
→ Enable/disable maintenance mode
→ Broadcast to all connected clients

PUT /master/system/limits
Body: { maxWithdrawal, minDeposit }
→ Update system-wide transaction limits
→ Store in configuration
```

**Key Rules:**
- ✅ Master routes completely isolated (separate router)
- ✅ Master can see all admin actions in real-time
- ✅ Master cannot be frozen or disabled by admins
- ✅ Only one master account (or very limited)

## Real-Time Socket System (STEP 8)

### Socket Authentication & Room Assignment

```javascript
// sockets/socket.js
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  const user = verifyToken(token);
  
  if (!user) return next(new Error('Authentication failed'));
  
  socket.userId = user.id;
  socket.userRole = user.role;
  
  // Assign to role-based rooms
  if (user.role === 'USER') {
    socket.join(`user:${user.id}`);
  } else if (user.role === 'ADMIN') {
    socket.join('admin');
  } else if (user.role === 'MASTER') {
    socket.join('master');
  }
  
  next();
});
```

### Socket Events

**BALANCE_UPDATED**
```javascript
// Triggered by: Credit, withdrawal approval, transfers
io.to(`user:${userId}`).emit('BALANCE_UPDATED', {
  userId,
  newBalance,
  change,
  reason
});
```

**TX_STATUS_UPDATED**
```javascript
// Triggered by: Admin approval/rejection
io.to(`user:${userId}`).emit('TX_STATUS_UPDATED', {
  transactionId,
  newStatus,
  updatedBy
});
```

**USER_FROZEN**
```javascript
// Triggered by: Admin freeze action
io.to(`user:${userId}`).emit('USER_FROZEN', {
  userId,
  reason,
  freezedBy
});
// Also disconnect user socket
io.in(`user:${userId}`).disconnectSockets();
```

**ADMIN_ACTION**
```javascript
// Triggered by: Any admin action
io.to('master').emit('ADMIN_ACTION', {
  adminId,
  action,
  target,
  metadata,
  timestamp
});
```

## Frontend Build Order (STEP 9)

### 1️⃣ Public App (frontend-public)

**Pages:**
1. **Login Page** (`/login`)
   - Email + password form
   - JWT token storage
   - Role validation

2. **Dashboard** (`/`)
   - Welcome message
   - Wallet balance (real-time)
   - Recent transactions
   - Quick actions

3. **Wallet Page** (`/wallet`)
   - Current balance
   - Deposit button
   - Withdrawal form
   - Transaction history

4. **Transactions Page** (`/transactions`)
   - Filterable transaction list
   - Status badges (PENDING, APPROVED, COMPLETED)
   - Real-time updates

### 2️⃣ Admin Panel (frontend-admin)

**Pages:**
1. **Admin Login** (`/admin/login`)
   - Separate login for admins
   - Admin role verification

2. **User List** (`/admin/users`)
   - Searchable user table
   - Status indicators (ACTIVE/FROZEN)
   - Quick actions (Credit, Freeze)

3. **Transaction Approvals** (`/admin/transactions`)
   - Pending transactions list
   - Approve/Reject buttons
   - Transaction details modal
   - Real-time updates

4. **Credit Balance** (`/admin/credit`)
   - Select user
   - Enter amount
   - Add reason
   - Confirm and execute

### 3️⃣ Master Panel (frontend-master)

**Pages:**
1. **Master Login** (`/master-admin/login`)
   - Master credentials only
   - Highest security

2. **Admin Management** (`/master-admin/admins`)
   - Admin list with active status
   - Create new admin
   - Disable/Enable admins
   - View admin activity

3. **Audit Logs** (`/master-admin/audit`)
   - Comprehensive action log
   - Filter by admin, action, date
   - Export functionality
   - Real-time updates

4. **System Status** (`/master-admin/system`)
   - Active users count
   - Transaction statistics
   - System health
   - Maintenance mode toggle

## Final Build Sequence (STEP 10)

### Implementation Order

**Phase 1: Foundation**
1. ✅ Setup database (PostgreSQL + Prisma)
2. ✅ Update schema with all models
3. ✅ Run migrations

**Phase 2: Core Backend**
4. Implement authentication system
   - `auth/auth.service.js` - Register, login, token generation
   - `auth/auth.middleware.js` - JWT verification, role guards
   - `utils/hash.js` - bcrypt password hashing
   - `utils/token.js` - JWT sign/verify

5. Implement user + wallet system
   - `users/user.service.js` - CRUD operations
   - `wallets/wallet.service.js` - Balance management
   - Auto-create wallet on user registration

6. Implement transaction system
   - `transactions/tx.service.js` - Create, approve, reject
   - Transaction status workflow
   - Balance validation

**Phase 3: Admin & Master**
7. Implement admin controls
   - `admin/admin.service.js` - Credit, approve, freeze
   - Audit logging integration
   - Permission checks

8. Implement master controls
   - `master/master.service.js` - Admin management
   - System configuration
   - Audit log queries

**Phase 4: Real-Time**
9. Add Socket.IO system
   - `sockets/socket.js` - Connection, authentication
   - `sockets/events.js` - Event definitions
   - Room-based broadcasting
   - Integrate with services

**Phase 5: Frontend**
10. Build frontend applications
    - Public app (React)
    - Admin panel (React)
    - Master panel (React)
    - Socket.IO client integration

**Phase 6: Testing & Deployment**
11. QA test flows
    - User registration → deposit → withdrawal
    - Admin credit → approve → freeze
    - Master admin management
    - Real-time event verification

12. Deploy to production
    - Environment setup
    - Database migration
    - Nginx configuration
    - SSL certificates
    - PM2 process management
- POST `/data/` - requires admin (`guard("admin")`), creates via `prisma.item.create()`, emits "update" with all items
- PUT `/data/:id` - requires admin, updates via `prisma.item.update()`, emits "update" with all items
- DELETE `/data/:id` - requires admin, deletes via `prisma.item.delete()`, emits "update" with all items

All mutations refetch all items (`prisma.item.findMany()`) and broadcast via `io.emit("update", items)`.
Prisma errors automatically handled by Express error handler (500 responses).

### Real-time Communication
- `socket.ts` exports global `io` instance after `initSocket()` called in `index.ts`
- Connection logging: Logs client connect/disconnect with socket.id
- Other modules import `io` to emit events (e.g., all CRUD operations emit "update")
- Frontends: Connect via `io(API)` in useEffect, listen for "update" event with `socket.on("update", setData)`
- Pattern: Fetch initial data on mount, then socket updates keep it synchronized
- useEffect dependency: `[token]` - reconnects when token changes (after login)

### API Communication
- Frontends use `api.js` abstraction layer - never call fetch directly in components
- Backend routes organized by router: `/auth/*` for authentication, `/data/*` for data operations
- CORS configured to allow all origins (`origin: "*"`) for development
- Error handling centralized in `errorHandler` middleware (always runs last)

## Adding Features
- **New API endpoint**: Add route to `authRouter` or `dataRouter` in respective files, use `guard()` for auth
- **New Prisma model**: Add to `schema.prisma`, run `prisma migrate dev`, import `PrismaClient` in handlers
- **New Socket event**: Import `io` from `socket.ts`, call `io.emit(event, data)` where needed
- **New auth requirement**: Extend `guard` middleware or add new role-based guard variant
- **New frontend feature**: Add component in respective frontend, use `api.js` for backend calls

## Production Deployment

### Automated Deployment (Ubuntu)
For one-command setup, use the deployment script that automates all steps:
1. Installs Node.js, PostgreSQL, Nginx, Certbot, PM2
2. Creates database and user
3. Clones repository and installs dependencies
4. Configures `.env` with database credentials
5. Runs Prisma migrations
6. Builds both frontends
7. Configures Nginx with WebSocket proxy
8. Sets up SSL certificates with Certbot
9. Starts backend with PM2 auto-restart

Script handles: PostgreSQL setup, environment variables, Prisma migrations, frontend builds, Nginx config, SSL/HTTPS

**Multi-environment support**: Advanced script supports `prod`, `staging`, `test` environments with:
- Environment-specific domains (e.g., `staging-public.example.com`)
- Separate databases per environment
- Unique PM2 process names (`onchain-backend-prod`)
- Environment-specific JWT secrets and Nginx configs

Usage: `./deploy_onchainweb_env.sh prod` (or `staging`, `test`)

### Manual Deployment Steps

#### Backend (PM2)
1. Install PM2: `sudo npm install -g pm2`
2. Navigate to backend: `cd backend && npm install`
3. Run migrations: `npx prisma migrate deploy`
4. Start with PM2: `pm2 start src/index.ts --name onchain-backend --watch --interpreter ./node_modules/.bin/ts-node`
5. Save process: `pm2 save && pm2 startup`

PM2 provides: auto-restart on crash, zero-downtime reloads, log management, cluster mode support

#### Frontend (Nginx)
1. Build frontends: `cd frontend-public && npm install && npm run build` (repeat for frontend-admin)
2. Nginx serves static files from `dist/` directories
3. WebSocket proxy requires `Upgrade` headers for Socket.io compatibility
4. Use `try_files $uri /index.html` for React Router (SPA fallback)

### Nginx Configuration Pattern
Complete configuration file example (`/etc/nginx/sites-available/onchainweb`):
```nginx
# Public App
server {
    listen 80;
    server_name public.example.com;

    root /home/ubuntu/onchainweb/frontend-public/dist;
    index index.html;

    location / {
        try_files $uri /index.html;  # SPA fallback
    }

    location /socket.io/ {
        proxy_pass http://localhost:4000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}

# Admin App
server {
    listen 80;
    server_name admin.example.com;

    root /home/ubuntu/onchainweb/frontend-admin/dist;
    index index.html;

    location / {
        try_files $uri /index.html;  # SPA fallback
    }

    location /socket.io/ {
        proxy_pass http://localhost:4000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/onchainweb /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Domain setup: Serve public app and admin panel on separate subdomains (e.g., `public.example.com`, `admin.example.com`)
Each subdomain points to respective `dist/` folder, both proxy Socket.io to backend port 4000

### SSL/HTTPS (Certbot)
1. Install Certbot: `sudo apt install certbot python3-certbot-nginx`
2. Generate certificates: `sudo certbot --nginx -d public.example.com -d admin.example.com`
3. Test Nginx config: `sudo nginx -t`
4. Restart Nginx: `sudo systemctl restart nginx`

Auto-renewal enabled by default. WebSocket works automatically over HTTPS.

### PM2 Management
- **List processes**: `pm2 list`
- **View logs**: `pm2 logs onchain-backend`
- **Restart**: `pm2 restart onchain-backend`
- **Stop**: `pm2 stop onchain-backend`
- **Monitor**: `pm2 monit`

Backend auto-restarts on crash or server reboot after `pm2 startup` configuration.

### Verification
After deployment, verify functionality:
1. Access `https://public.example.com` - Public app should load with login
2. Access `https://admin.example.com` - Admin panel should load with login
3. Login as admin, add/edit/delete data
4. Verify real-time updates appear immediately in public app (Socket.io working)

### Optional Production Optimizations
- **Environment config**: Create `.env.prod` with production-specific settings
- **CORS restrictions**: Update `cors({ origin: "*" })` to whitelist specific domains only
- **Firewall**: Configure UFW/iptables to allow only ports 80, 443, and SSH
- **Security**: Install `fail2ban` to protect against brute-force attacks
- **HTTPS enforcement**: Add redirect from HTTP to HTTPS in Nginx config
- **Database**: Use connection pooling and read replicas for scaling
