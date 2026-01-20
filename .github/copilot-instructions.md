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

## 5️⃣ TRADING ENGINE (CORE LOGIC)

### Files Structure
```
trading/
├── trade.controller.js  - HTTP request handlers
├── trade.service.js     - Trade business logic
└── trade.engine.js      - Trade execution engine
```

### Core Functions

**placeTrade(userId, tradeData)**
```javascript
// Creates a new trade position
// Validates:
//   - User wallet has sufficient balance
//   - Market is open (trading hours)
//   - Trade size within limits
//   - User not frozen
//
// Creates trade with status: OPEN
// Locks funds in wallet (increases exposure)
// Does NOT deduct from balance yet
// 
// tradeData: {
//   symbol: "BTC/USDT",
//   type: "LONG" | "SHORT",
//   amount: Decimal,
//   leverage: number (optional)
// }
//
// ❗ Trades are internal ledger entries, not blockchain transactions
```

**calculatePnL(trade, marketPrice)**
```javascript
// Calculates current profit/loss for open trade
// Formula:
//   LONG: (currentPrice - entryPrice) * amount
//   SHORT: (entryPrice - currentPrice) * amount
//
// Used for:
//   - Live PnL display in user dashboard
//   - Risk management calculations
//   - Margin call checks
//
// Does NOT update database
// Returns: { pnl: Decimal, pnlPercentage: number }
```

**closeTrade(tradeId)**
```javascript
// Closes an open trade position
// Process:
//   1. Lock final market price
//   2. Calculate final PnL
//   3. Set trade status: OPEN → CLOSED
//   4. Release locked funds (decrease exposure)
//   5. Update wallet balance (only after validation)
//   6. Log trade result in AuditLog
//   7. Emit TRADE_CLOSED Socket.IO event
//
// Validation required before wallet update
// Admin can force-close trades if needed
```

### Trading Business Rules
- ✅ Trades are **internal ledger entries** (not blockchain transactions)
- ✅ Funds locked during open positions (exposure tracking)
- ✅ Balance updated only on trade close
- ✅ All trades logged for audit
- ✅ PnL calculated in real-time
- ✅ Admin can force-close positions
- ✅ Market hours enforced
- ✅ Per-trade and daily limits enforced

## 6️⃣ BINARY OPTIONS MODULE

### Files Structure
```
binary/
├── binary.controller.js  - HTTP request handlers
├── binary.service.js     - Binary options logic
└── binary.engine.js      - Resolution engine
```

### Core Functions

**openBinaryTrade(userId, symbol, direction, amount, expiry)**
```javascript
// Opens a binary options position
// Parameters:
//   direction: "UP" | "DOWN" (price prediction)
//   expiry: fixed duration (e.g., 60s, 5min, 1hr)
//   amount: stake amount
//
// Process:
//   1. Lock entry price (from market cache)
//   2. Lock stake amount in wallet
//   3. Set expiry timestamp
//   4. Create trade with status: PENDING_RESOLUTION
//
// User predicts if price will be UP or DOWN at expiry
// Stake is fully at risk (all or nothing)
```

**resolveBinaryTrade(tradeId)**
```javascript
// Resolves binary option at expiry time
// System-driven (not user-triggered)
// 
// Process:
//   1. Fetch market price at exact expiry time
//   2. Compare with entry price
//   3. Determine WIN or LOSS:
//      - UP trade: WIN if exitPrice > entryPrice
//      - DOWN trade: WIN if exitPrice < entryPrice
//   4. Apply payout rules
//   5. Update wallet
//   6. Set status: RESOLVED
//   7. Log result in AuditLog
//   8. Emit BINARY_RESOLVED event
//
// Resolution is automated by cron job or timer service
```

**binaryPayoutRules()**
```javascript
// Defines payout structure (configured by Master)
// Standard rules:
//   WIN: stake + (stake * payoutRate)
//     Example: $100 stake, 85% payout = $185 return
//   LOSS: stake lost (returns $0)
//
// Payout rate typically 70-95%
// Rate can be adjusted per symbol or globally
// House edge built into payout rate
```

### Binary Options Business Rules
- ✅ Fixed expiry durations (60s, 5min, 15min, 1hr, etc.)
- ✅ Direction: UP or DOWN only (no complex predictions)
- ✅ All-or-nothing payout (no partial wins)
- ✅ **Resolution is system-driven** (not user-triggered)
- ✅ Automated resolution at expiry (cron/timer service)
- ✅ Payout rate configured by Master
- ✅ Entry and exit prices locked and immutable
- ✅ Cannot close before expiry (no early exit)

## 7️⃣ AI ARBITRAGE MODULE

### Files Structure
```
ai/
├── ai.controller.js  - HTTP request handlers
├── ai.engine.js      - AI arbitrage engine
└── ai.strategy.js    - Trading strategies and algorithms
```

### Core Functions

**scanMarketOpportunities()**
```javascript
// Continuously monitors market for arbitrage opportunities
// Analyzes:
//   - Price discrepancies across symbols
//   - Volatility thresholds
//   - Correlation patterns
//   - Liquidity conditions
//
// Uses real-time market feeds
// Runs as background service
// Identifies potential profitable trades
//
// Returns: Array of opportunities with:
//   { symbol, expectedProfit, confidence, riskLevel }
```

**simulateArbitrage(trade)**
```javascript
// Simulates arbitrage trade before execution
// Calculates:
//   - Expected profit (with fees)
//   - Risk exposure
//   - Slippage model (price impact)
//   - Success probability
//
// Does NOT execute the trade
// Used for decision-making
// Returns: { profit, risk, recommendation: "EXECUTE" | "SKIP" }
```

**executeAITrade(userId)**
```javascript
// Executes AI-identified arbitrage trade
// Requirements:
//   - User must opt-in to AI trading
//   - Admin or system approval required
//   - Sufficient wallet balance
//
// Process:
//   1. Verify user opt-in status
//   2. Check admin/system approval
//   3. Validate wallet balance
//   4. Execute trade internally
//   5. Log AI trade in AuditLog
//   6. Track performance metrics
//
// ❗ AI does NOT self-fund
// ❗ AI does NOT auto-credit balances
// ❗ All trades use user's wallet balance
```

### AI Arbitrage Business Rules
- ✅ **User opt-in required** - Users must enable AI trading
- ✅ **Admin/system approval** - Not fully automated
- ✅ **Uses user funds** - AI does not self-fund
- ✅ **Internal execution** - Trades executed in platform ledger
- ✅ **No auto-crediting** - Profits/losses settle through normal trade flow
- ✅ **Performance tracking** - AI success rate monitored
- ✅ **Risk limits** - Per-trade and daily AI trade limits
- ✅ **Transparency** - All AI trades visible to user
- ✅ **Can be disabled** - Master can disable AI module globally

## 8️⃣ TRANSACTION & SETTLEMENT MODULE

### Files Structure
```
transactions/
├── tx.controller.js  - HTTP request handlers
└── tx.service.js     - Transaction business logic
```

### Core Functions

**createTransaction(userId, type, amount)**
```javascript
// Creates a new transaction record
// Types: DEPOSIT, WITHDRAWAL, CREDIT, DEBIT, TRANSFER
// Initial status: PENDING
//
// Process:
//   1. Validate user exists and is not frozen
//   2. Validate amount (positive, within limits)
//   3. Create transaction record with metadata
//   4. For WITHDRAWAL: check sufficient balance
//   5. Log transaction creation
//   6. Emit TX_CREATED event
//
// Returns: { id, userId, type, amount, status: PENDING }
//
// ❗ Transaction does NOT update balance immediately
// ❗ Balance updates only after approval
```

**approveTransaction(txId, adminId)**
```javascript
// Approves a pending transaction
// Only ADMIN or MASTER can approve
//
// Process:
//   1. Fetch transaction (must be PENDING)
//   2. Validate admin permissions
//   3. Update status: PENDING → PROCESSING → APPROVED → COMPLETED
//   4. Trigger wallet update based on type:
//      - DEPOSIT/CREDIT: increase balance
//      - WITHDRAWAL/DEBIT: decrease balance
//   5. Log approval in AuditLog
//   6. Emit TX_APPROVED event to user
//   7. Emit ADMIN_ACTION event to master
//
// All wallet updates happen HERE
// Returns: { transactionId, status: COMPLETED, newBalance }
```

**rejectTransaction(txId, adminId, reason)**
```javascript
// Rejects a pending transaction
// Only ADMIN or MASTER can reject
//
// Process:
//   1. Fetch transaction (must be PENDING)
//   2. Validate admin permissions
//   3. Update status: PENDING → REJECTED
//   4. Store rejection reason in metadata
//   5. Log rejection in AuditLog
//   6. Emit TX_REJECTED event to user
//   7. Emit ADMIN_ACTION event to master
//
// NO balance change occurs
// User notified with reason
```

### Transaction Settlement Business Rules
- ✅ **All settlements** go through this module (no direct wallet updates)
- ✅ **Two-step process**: Create (PENDING) → Approve/Reject (COMPLETED/REJECTED)
- ✅ **Admin approval required** for withdrawals and manual credits
- ✅ **Automatic logging** of all transaction state changes
- ✅ **Real-time notifications** to users and admins
- ✅ **Rejection requires reason** for transparency
- ✅ **Balance updates atomic** with transaction approval
- ✅ **Transaction history immutable** once completed

## 9️⃣ ADMIN CONTROL MODULE

### Files Structure
```
admin/
├── admin.controller.js  - HTTP request handlers
└── admin.service.js     - Admin business logic
```

### Admin Capabilities

**User Management**

**freezeUser(userId, adminId, reason)**
```javascript
// Freezes user account
// Process:
//   1. Set user.status = FROZEN
//   2. Lock user wallet (wallet.locked = true)
//   3. Close all open trades (force close)
//   4. Disconnect user sockets
//   5. Log action in AuditLog
//   6. Emit USER_FROZEN event
//   7. Emit ADMIN_ACTION to master
//
// User can login but cannot trade or withdraw
// Can view balance and transaction history (read-only)
```

**lockWallet(userId, adminId, reason)**
```javascript
// Locks user wallet without freezing account
// Prevents trading and withdrawals
// User can still view data
```

**adjustLimits(userId, adminId, newLimits)**
```javascript
// Updates user-specific limits
// Limits: { maxTradeSize, dailyWithdrawal, maxLeverage }
// Logged in AuditLog
```

**Trade Oversight**

**viewLiveTrades(filters)**
```javascript
// Returns all open trades across all users
// Filters: { userId, symbol, type, minAmount }
// Real-time PnL calculations
// Used for risk monitoring
```

**forceCloseTrade(tradeId, adminId, reason)**
```javascript
// Forcefully closes an open trade
// Reasons: Risk management, suspicious activity, margin call
// Process:
//   1. Lock current market price
//   2. Calculate final PnL
//   3. Close trade (status: FORCE_CLOSED)
//   4. Update wallet balance
//   5. Log in AuditLog with reason
//   6. Notify user
//   7. Emit ADMIN_ACTION to master
```

**approveWithdrawal(txId, adminId)**
```javascript
// Approves pending withdrawal transaction
// Calls approveTransaction() in tx.service.js
// Additional validation:
//   - User not frozen
//   - Sufficient balance
//   - Within daily limits
//   - No suspicious activity flags
```

**Market Control**

**pauseSymbol(symbol, adminId, reason)**
```javascript
// Temporarily disables trading for a symbol
// Reasons: High volatility, system maintenance, feed issues
// Process:
//   1. Set symbol status: PAUSED
//   2. Reject new trades for this symbol
//   3. Allow closing existing positions
//   4. Log action
//   5. Broadcast to all users
//
// Can be unpaused by admin or master
```

**disableProduct(product, adminId, reason)**
```javascript
// Disables entire product (e.g., binary options)
// Stronger than pause (affects multiple symbols)
// Requires master approval for re-enabling
```

### Admin Control Business Rules
- ✅ **Every action logged** in AuditLog with actorId, action, target, reason
- ✅ **Real-time events** emitted to affected users and master panel
- ✅ **Reason required** for all user-impacting actions
- ✅ **Visible to master** - All admin actions appear in master panel
- ✅ **Cannot freeze master** - Master accounts immune to admin actions
- ✅ **Cannot modify master limits** - Master has unlimited permissions
- ✅ **Force-close requires reason** - Logged for compliance
- ✅ **Market controls** require notification to all affected users
- ✅ **Reversible actions** - Master can undo admin freezes/locks

## 🔟 MASTER CONTROL MODULE

### Files Structure
```
master/
├── master.controller.js  - HTTP request handlers
└── master.service.js     - Master business logic
```

### Master Capabilities

**System Rules**

**setBinaryPayoutRatios(symbol, winRate)**
```javascript
// Configures payout structure for binary options
// Parameters:
//   symbol: specific trading pair or "ALL" for global
//   winRate: percentage (e.g., 0.85 for 85% payout)
//
// Process:
//   1. Validate winRate (typically 0.70-0.95)
//   2. Update system configuration
//   3. Log change in AuditLog
//   4. Broadcast SYSTEM_ALERT to all users
//   5. Apply to new trades (existing trades unchanged)
//
// House edge = 1 - winRate
```

**setAILimits(maxTradesPerDay, maxAmountPerTrade)**
```javascript
// Sets global limits for AI arbitrage
// Parameters:
//   maxTradesPerDay: maximum AI trades per user per day
//   maxAmountPerTrade: maximum stake per AI trade
//
// Prevents:
//   - AI overtrading
//   - Excessive risk exposure
//   - System abuse
//
// Logged in AuditLog
```

**setTradingHours(markets)**
```javascript
// Configures market trading hours
// Parameters:
//   markets: { symbol, openTime, closeTime, timezone }
//
// Example:
//   { symbol: "BTC/USDT", open: "00:00", close: "23:59", tz: "UTC" }
//   { symbol: "US_STOCKS", open: "09:30", close: "16:00", tz: "EST" }
//
// Enforced by trading engine
// Outside hours: trades rejected with "Market closed"
```

**Admin Governance**

**createAdmin(email, password, permissions)**
```javascript
// Creates new admin account
// Process:
//   1. Validate email uniqueness
//   2. Hash password (bcrypt)
//   3. Create Admin record with active=true
//   4. Log admin creation in AuditLog
//   5. Emit ADMIN_CREATED event
//
// Permissions can be customized (future enhancement)
```

**disableAdmin(adminId, masterId, reason)**
```javascript
// Disables admin account
// Process:
//   1. Set admin.active = false
//   2. Revoke all active admin sessions (invalidate tokens)
//   3. Log in AuditLog with reason
//   4. Emit ADMIN_DISABLED event
//
// Admin can no longer login or perform actions
// Cannot be re-enabled without master intervention
```

**reviewAdminActions(filters)**
```javascript
// Queries AuditLog for admin activity
// Filters:
//   - adminId: specific admin
//   - action: type of action (e.g., "FREEZE_USER")
//   - dateRange: start and end timestamps
//   - target: affected userId or resource
//
// Returns:
//   Array of audit logs with full metadata
//   Sorted by timestamp (newest first)
//
// Used for:
//   - Compliance reviews
//   - Suspicious activity detection
//   - Performance monitoring
```

**System Safety**

**enableMaintenanceMode(reason)**
```javascript
// Activates system-wide maintenance mode
// Process:
//   1. Set system.maintenanceMode = true
//   2. Broadcast SYSTEM_ALERT to all connected clients
//   3. Block new trades (reject with "Under maintenance")
//   4. Allow viewing data (read-only)
//   5. Allow closing existing positions
//   6. Log activation in AuditLog
//
// Users see banner: "System under maintenance"
```

**emergencyShutdown(masterId, reason)**
```javascript
// Emergency system shutdown
// Process:
//   1. Force-close ALL open trades at current market price
//   2. Settle all positions
//   3. Disable all trading operations
//   4. Disable withdrawals
//   5. Disconnect all user sockets
//   6. Log in AuditLog with detailed reason
//   7. Notify all admins
//
// ⚠️ CRITICAL: Only used in severe circumstances
// Requires master approval + reason
```

### Master Control Business Rules
- ✅ **Full system access** - No restrictions on master account
- ✅ **Cannot be frozen** - Immune to admin freeze actions
- ✅ **All actions logged** - Complete audit trail
- ✅ **System configuration** - Can modify payout rates, limits, hours
- ✅ **Admin oversight** - Create, disable, monitor admins
- ✅ **Emergency powers** - Maintenance mode, emergency shutdown
- ✅ **Read-only restrictions during maintenance** - Users can view but not trade
- ✅ **Reversible admin actions** - Can unfreeze users, unlock wallets

## 1️⃣1️⃣ REAL-TIME SOCKET SYSTEM

### Files Structure
```
sockets/
├── socket.js   - Socket.IO server setup and authentication
└── events.js   - Event definitions and handlers
```

### Socket Events

**PRICE_UPDATE**
```javascript
// Emitted by: Market data module
// Frequency: On every price change (real-time)
// To: All connected clients (public, admin, master)
// Payload: {
//   symbol: "BTC/USDT",
//   price: Decimal,
//   timestamp: DateTime,
//   source: "Binance"
// }
// Used for: Live charts, trade execution validation
```

**TRADE_OPENED**
```javascript
// Emitted by: Trading engine
// To: user:{userId} room
// Payload: {
//   tradeId: string,
//   userId: string,
//   symbol: string,
//   type: "LONG" | "SHORT",
//   amount: Decimal,
//   entryPrice: Decimal,
//   timestamp: DateTime
// }
// Used for: User notification, dashboard update
```

**TRADE_CLOSED**
```javascript
// Emitted by: Trading engine
// To: user:{userId} room
// Payload: {
//   tradeId: string,
//   userId: string,
//   exitPrice: Decimal,
//   pnl: Decimal,
//   finalBalance: Decimal,
//   timestamp: DateTime
// }
// Used for: User notification, balance update
```

**BINARY_RESOLVED**
```javascript
// Emitted by: Binary options engine
// To: user:{userId} room
// Payload: {
//   tradeId: string,
//   result: "WIN" | "LOSS",
//   entryPrice: Decimal,
//   exitPrice: Decimal,
//   payout: Decimal,
//   timestamp: DateTime
// }
// Used for: User notification, balance update
```

**BALANCE_UPDATED**
```javascript
// Emitted by: Wallet service
// To: user:{userId} room
// Payload: {
//   userId: string,
//   newBalance: Decimal,
//   change: Decimal,
//   reason: string,
//   timestamp: DateTime
// }
// Used for: Real-time balance display
```

**ADMIN_ACTION**
```javascript
// Emitted by: Admin service
// To: master room
// Payload: {
//   adminId: string,
//   action: string,
//   target: string,
//   metadata: object,
//   timestamp: DateTime
// }
// Used for: Master oversight, audit trail
```

**SYSTEM_ALERT**
```javascript
// Emitted by: Master service
// To: All connected clients
// Payload: {
//   type: "MAINTENANCE" | "EMERGENCY" | "ANNOUNCEMENT",
//   message: string,
//   severity: "INFO" | "WARNING" | "CRITICAL",
//   timestamp: DateTime
// }
// Used for: System-wide notifications
```

### Socket System Characteristics

**Authenticated**
```javascript
// All socket connections require JWT token
// Sent via: socket.handshake.auth.token
// Verified on connection before joining rooms
// Invalid token → connection rejected
```

**Role-Aware**
```javascript
// Users join role-specific rooms:
//   - user:{userId} - Individual user room
//   - admin - All admins
//   - master - Master account only
//
// Events filtered by role:
//   - PRICE_UPDATE → broadcast to all
//   - TRADE_OPENED → only to affected user
//   - ADMIN_ACTION → only to master
```

**State-Synchronized**
```javascript
// On reconnect:
//   1. Fetch current wallet balance
//   2. Fetch open trades
//   3. Fetch pending transactions
//   4. Resume real-time updates
//
// Ensures UI always shows correct state
// No data loss on temporary disconnects
```

### Socket Business Rules
- ✅ **Authentication required** - No anonymous connections
- ✅ **Room-based broadcasting** - Events sent to appropriate recipients
- ✅ **Automatic reconnection** - Client handles disconnects
- ✅ **State sync on reconnect** - Fetch current state after reconnect
- ✅ **Event logging** - Critical events logged in AuditLog
- ✅ **Rate limiting** - Prevent socket spam/abuse
- ✅ **Graceful shutdown** - Notify users before maintenance

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
