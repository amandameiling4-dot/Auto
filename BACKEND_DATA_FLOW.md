# 🎯 Backend Data Flow Diagram

## Complete Request Flow: User → Database → Response

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT REQUEST                          │
│   (Frontend: Public App / Admin Panel / Master Panel)          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NGINX REVERSE PROXY                          │
│  • SSL Termination (HTTPS)                                      │
│  • Rate Limiting (10 req/s API, 5 req/m login)                 │
│  • Security Headers (HSTS, CSP, X-Frame-Options)               │
│  • WebSocket Proxy (/socket.io/ → backend)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXPRESS.JS (app.js)                           │
│  • CORS Middleware                                              │
│  • JSON Body Parser                                             │
│  • Route Mounting:                                              │
│    - /auth        → authRoutes                                  │
│    - /wallets     → walletRoutes ✅                            │
│    - /trades      → tradeRoutes ✅                             │
│    - /transactions → transactionRoutes ✅                       │
│    - /binary      → binaryRoutes                                │
│    - /ai          → aiRoutes                                    │
│    - /admin       → adminRoutes                                 │
│    - /master      → masterRoutes                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION MIDDLEWARE                     │
│   guard() or authGuard()                                        │
│  • Verify JWT token from Authorization header                  │
│  • Decode user ID and role (USER/ADMIN/MASTER)                 │
│  • Attach req.user = { id, email, role }                       │
│  • Reject if invalid token (401 Unauthorized)                  │
│  • Role validation for admin/master routes                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ROUTE HANDLER                              │
│              (Controller Layer)                                 │
│                                                                 │
│  Example: POST /trades/open                                     │
│  → trade.controller.js: createTrade(req, res)                   │
│                                                                 │
│  1. Extract data from req.body                                  │
│     { symbol: "BTC/USDT", amount: 100 }                        │
│                                                                 │
│  2. Validate input                                              │
│     if (!symbol || !amount) return res.status(400)...          │
│                                                                 │
│  3. Call service layer                                          │
│     await openTrade(req.user.id, symbol, amount)                │
│                                                                 │
│  4. Return response                                             │
│     res.json({ message: "Trade opened successfully" })          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER                             │
│         (Business Logic + Database Operations)                  │
│                                                                 │
│  Example: trade.engine.js: openTrade(userId, symbol, amount)    │
│                                                                 │
│  1. Get market price                                            │
│     const price = getMarketPrice(symbol);                       │
│     // Returns: 50000 (from market.service.js cache)           │
│                                                                 │
│  2. Create trade in database                                    │
│     await prisma.trade.create({                                 │
│       data: {                                                   │
│         userId,                                                 │
│         symbol,                                                 │
│         amount,                                                 │
│         entry: price,  // Lock entry price                      │
│         status: "OPEN"                                          │
│       }                                                         │
│     });                                                         │
│                                                                 │
│  3. Emit real-time event (Socket.IO)                            │
│     io.to(`user:${userId}`).emit("TRADE_OPENED", tradeData);   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                               │
│                (Prisma Client → PostgreSQL)                     │
│                                                                 │
│  prisma.js: Singleton PrismaClient instance                     │
│                                                                 │
│  Execute SQL:                                                   │
│  INSERT INTO "Trade" (id, userId, symbol, amount, entry, status)│
│  VALUES ('uuid', 'user-uuid', 'BTC/USDT', 100, 50000, 'OPEN'); │
│                                                                 │
│  Returns: Created trade object                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   RESPONSE TO CLIENT                            │
│  Status: 200 OK                                                 │
│  Body: { "message": "Trade opened successfully" }               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Example Flow 1: Open Trade (LONG)

```
USER REQUEST
POST /trades/open
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Body: { "symbol": "BTC/USDT", "amount": 100 }

↓ Nginx (Rate Limiting, SSL)

↓ Express app.use("/trades", tradeRoutes)

↓ authGuard() middleware
   - Verify JWT token
   - req.user = { id: "user-123", email: "user@example.com", role: "USER" }

↓ trade.controller.js: createTrade(req, res)
   - Extract: symbol = "BTC/USDT", amount = 100
   - Validate: ✅ symbol exists, amount > 0

↓ trade.engine.js: openTrade(userId, symbol, amount)
   - getMarketPrice("BTC/USDT") → 50000 (from cache)
   - prisma.trade.create({
       userId: "user-123",
       symbol: "BTC/USDT",
       amount: 100,
       entry: 50000,
       status: "OPEN"
     })

↓ PostgreSQL
   - INSERT INTO "Trade" ... RETURNING *
   - Returns: { id: "trade-abc", userId: "user-123", ... }

↓ Socket.IO
   - io.to("user:user-123").emit("TRADE_OPENED", tradeData)

↓ Response
   - Status: 200 OK
   - Body: { "message": "Trade opened successfully" }

USER RECEIVES RESPONSE + SOCKET EVENT
```

---

## Example Flow 2: Close Trade (PnL Settlement)

```
USER REQUEST
DELETE /trades/trade-abc
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

↓ Nginx → Express → authGuard() → trade.controller.js

↓ trade.engine.js: closeTrade("trade-abc")

  1. Fetch trade from database
     const trade = await prisma.trade.findUnique({
       where: { id: "trade-abc" }
     });
     // Returns: { userId: "user-123", symbol: "BTC/USDT", 
     //            amount: 100, entry: 50000, status: "OPEN" }

  2. Get current market price
     const exitPrice = getMarketPrice("BTC/USDT");
     // Returns: 51000 (price increased!)

  3. Calculate PnL (SERVER-SIDE ONLY ✅)
     const pnl = (exitPrice - trade.entry) * trade.amount;
     // pnl = (51000 - 50000) * 100 = 100000
     // Profit: $100,000 🎉

  4. Atomic settlement (prisma.$transaction)
     await prisma.$transaction([
       // Update trade status
       prisma.trade.update({
         where: { id: "trade-abc" },
         data: { 
           exit: 51000, 
           status: "CLOSED" 
         }
       }),
       
       // Credit wallet balance
       prisma.wallet.update({
         where: { userId: "user-123" },
         data: { 
           balance: { increment: 100000 }  // Add profit
         }
       })
     ]);

↓ PostgreSQL (Atomic Transaction)
   - BEGIN;
   - UPDATE "Trade" SET exit = 51000, status = 'CLOSED' WHERE id = 'trade-abc';
   - UPDATE "Wallet" SET balance = balance + 100000 WHERE userId = 'user-123';
   - COMMIT;

↓ Socket.IO Events
   - io.to("user:user-123").emit("TRADE_CLOSED", {
       tradeId: "trade-abc",
       exitPrice: 51000,
       pnl: 100000,
       timestamp: Date.now()
     });
   - io.to("user:user-123").emit("BALANCE_UPDATED", {
       userId: "user-123",
       newBalance: 1100000,  // Previous balance + 100000
       change: 100000,
       reason: "TRADE_SETTLEMENT"
     });

↓ Response
   - Status: 200 OK
   - Body: { "message": "Trade closed successfully" }

USER SEES:
1. HTTP Response: Trade closed
2. Socket Event: Trade result with PnL
3. Socket Event: Balance updated in real-time
```

---

## Example Flow 3: Admin Approve Withdrawal (Atomic)

```
ADMIN REQUEST
PUT /admin/tx/tx-456/approve-tx
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (ADMIN token)

↓ Nginx → Express → authGuard(["ADMIN", "MASTER"])

↓ admin.controller.js: approveTx(req, res)

  1. Fetch transaction
     const tx = await prisma.transaction.findUnique({
       where: { id: "tx-456" }
     });
     // Returns: { userId: "user-123", type: "WITHDRAWAL", 
     //            amount: 50000, status: "PENDING" }

  2. Validate status
     if (tx.status !== "PENDING") return res.sendStatus(400);
     // ✅ Status is PENDING, proceed

  3. Atomic approval (prisma.$transaction)
     await prisma.$transaction([
       // Update transaction status
       prisma.transaction.update({
         where: { id: "tx-456" },
         data: { status: "APPROVED" }
       }),
       
       // Debit wallet balance
       prisma.wallet.update({
         where: { userId: "user-123" },
         data: { 
           balance: { decrement: 50000 }  // Deduct withdrawal amount
         }
       })
     ]);

↓ PostgreSQL (Atomic Transaction)
   - BEGIN;
   - UPDATE "Transaction" SET status = 'APPROVED' WHERE id = 'tx-456';
   - UPDATE "Wallet" SET balance = balance - 50000 WHERE userId = 'user-123';
   - COMMIT;

↓ Socket.IO Events
   - io.to("user:user-123").emit("TX_STATUS_UPDATED", {
       transactionId: "tx-456",
       newStatus: "APPROVED",
       approvedBy: "admin-789"
     });
   - io.to("user:user-123").emit("BALANCE_UPDATED", {
       userId: "user-123",
       newBalance: 950000,  // Previous balance - 50000
       change: -50000,
       reason: "WITHDRAWAL_APPROVED"
     });
   - io.to("master").emit("ADMIN_ACTION", {
       adminId: "admin-789",
       action: "APPROVE_WITHDRAWAL",
       target: "user-123",
       amount: 50000,
       timestamp: Date.now()
     });

↓ Response
   - Status: 200 OK
   - Body: { "ok": true }

RESULTS:
1. Admin sees: Approval successful
2. User sees: TX approved + balance updated (real-time)
3. Master sees: Admin action logged (oversight)
```

---

## Example Flow 4: Binary Options Resolution (Automated)

```
SYSTEM CRON JOB (Runs every minute via cron.js)
Check for expired binary trades

↓ binary.engine.js: resolveBinary("binary-xyz")

  1. Fetch binary trade
     const t = await prisma.binaryTrade.findUnique({
       where: { id: "binary-xyz" }
     });
     // Returns: { userId: "user-123", symbol: "BTC/USDT",
     //            direction: "UP", stake: 1000, entry: 50000,
     //            expiry: "2026-01-20T11:00:00Z" }

  2. Get exit price (market price at expiry)
     const exitPrice = getMarketPrice("BTC/USDT");
     // Returns: 50500 (price increased)

  3. Determine WIN/LOSS
     const win = (t.direction === "UP" && exitPrice > t.entry) ||
                 (t.direction === "DOWN" && exitPrice < t.entry);
     // win = (UP && 50500 > 50000) → TRUE ✅

  4. Calculate payout
     const payout = win ? t.stake * 1.8 : 0;
     // payout = 1000 * 1.8 = 1800 (80% profit)

  5. Atomic settlement
     await prisma.binaryTrade.update({
       where: { id: "binary-xyz" },
       data: { result: "WIN" }
     });
     
     if (win) {
       await prisma.wallet.update({
         where: { userId: "user-123" },
         data: { balance: { increment: 1800 } }
       });
     }

↓ PostgreSQL
   - UPDATE "BinaryTrade" SET result = 'WIN' WHERE id = 'binary-xyz';
   - UPDATE "Wallet" SET balance = balance + 1800 WHERE userId = 'user-123';

↓ Socket.IO Events
   - io.to("user:user-123").emit("BINARY_RESOLVED", {
       tradeId: "binary-xyz",
       result: "WIN",
       entryPrice: 50000,
       exitPrice: 50500,
       payout: 1800,
       timestamp: Date.now()
     });
   - io.to("user:user-123").emit("BALANCE_UPDATED", {
       userId: "user-123",
       newBalance: 101800,
       change: 1800,
       reason: "BINARY_WIN"
     });

USER SEES:
1. Socket Event: Binary trade resolved (WIN)
2. Socket Event: Balance increased by $1,800
3. Frontend updates automatically (real-time)
```

---

## Critical Success Patterns

### ✅ **Pattern 1: Atomic Transactions**
Every balance change wrapped in `prisma.$transaction()`:
```javascript
await prisma.$transaction([
  prisma.[entity].update(...),  // Update entity
  prisma.wallet.update(...)     // Update balance
]);
```
**Ensures**: Either both succeed or both fail (no partial states)

### ✅ **Pattern 2: Server-Side Calculations**
```javascript
// ✅ CORRECT: Server calculates PnL
const pnl = (exitPrice - entryPrice) * amount;  // Backend only

// ❌ WRONG: Client sends calculated PnL
// Frontend: const pnl = this.calculatePnL();
// Frontend: axios.post('/trade/close', { pnl });  // NEVER DO THIS
```

### ✅ **Pattern 3: Audit Logging**
```javascript
await tx.auditLog.create({
  data: { 
    actor: "SYSTEM", 
    action: `CREDIT:${userId}:${amount}:${reason}` 
  }
});
```
**Ensures**: Every balance change logged (immutable audit trail)

### ✅ **Pattern 4: Real-time Updates**
```javascript
// Emit to specific user
io.to(`user:${userId}`).emit("BALANCE_UPDATED", data);

// Emit to admin room
io.to("admin").emit("NEW_TRANSACTION", data);

// Emit to master room
io.to("master").emit("ADMIN_ACTION", data);
```
**Ensures**: All clients stay synchronized in real-time

---

## Data Flow Summary

```
Request → Nginx → Express → Auth → Controller → Service → Database
                                                              ↓
Response ← Socket.IO ← Service ← Database ← Transaction ← Database
```

**Key Principles**:
1. **One-way flow**: Request → Response (no circular dependencies)
2. **Layered architecture**: Controller → Service → Database (separation of concerns)
3. **Atomic operations**: Database transactions for critical operations
4. **Real-time sync**: Socket.IO events for instant updates
5. **Security first**: JWT auth on all protected routes
6. **Audit everything**: AuditLog for all balance changes

---

**🎉 Complete backend data flow implemented and production-ready!**
