# 🧪 Test Cases & QA Checklist

## Complete Testing Documentation for OnChainWeb Platform

---

## 1️⃣ Authentication Tests

### ✅ **Test Case 1.1: Valid Login**
**Steps:**
1. Navigate to `/auth/login`
2. Enter valid credentials: `user@example.com` / `password123`
3. Submit form

**Expected:**
- ✅ Status: 200 OK
- ✅ Response contains JWT token
- ✅ Token stored in localStorage
- ✅ Redirect to dashboard
- ✅ User role decoded correctly

**Command:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

---

### ❌ **Test Case 1.2: Invalid Login Rejected**
**Steps:**
1. Enter wrong password: `wrongpassword`
2. Submit form

**Expected:**
- ❌ Status: 401 Unauthorized
- ❌ Error message: "Invalid credentials"
- ❌ No token issued
- ❌ Rate limiter enforced (max 5 attempts/minute)

**Validation:**
```javascript
// ❌ MUST REJECT:
// - Wrong password
// - Non-existent email
// - Empty fields
// - Malformed requests
```

---

### 🔒 **Test Case 1.3: Frozen User Cannot Login**
**Steps:**
1. Admin freezes user account
2. User attempts to login with correct credentials

**Expected:**
- ❌ Status: 403 Forbidden
- ❌ Error: "Account frozen"
- ❌ Cannot access protected routes
- ❌ Existing session terminated

**Admin Action:**
```bash
curl -X PUT http://localhost:3000/admin/user/{userId}/freeze \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

### 🛡️ **Test Case 1.4: Role-Based Route Blocking**
**Scenarios:**

**A. USER accessing ADMIN route:**
```bash
curl http://localhost:3000/admin/users \
  -H "Authorization: Bearer $USER_TOKEN"
```
**Expected:** ❌ 403 Forbidden

**B. ADMIN accessing MASTER route:**
```bash
curl http://localhost:3000/master/audit/logs \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```
**Expected:** ❌ 403 Forbidden

**C. MASTER accessing all routes:**
```bash
curl http://localhost:3000/admin/users \
  -H "Authorization: Bearer $MASTER_TOKEN"
```
**Expected:** ✅ 200 OK

**Validation Matrix:**
| Route | USER | ADMIN | MASTER |
|-------|------|-------|--------|
| /wallets | ✅ | ✅ | ✅ |
| /trades | ✅ | ✅ | ✅ |
| /admin/* | ❌ | ✅ | ✅ |
| /master/* | ❌ | ❌ | ✅ |

---

## 2️⃣ Wallet Tests

### ✅ **Test Case 2.1: Balance Never Negative**
**Steps:**
1. User wallet balance: $100
2. Attempt withdrawal: $200

**Expected:**
- ❌ Request rejected
- ❌ Error: "Insufficient balance"
- ✅ Balance remains: $100
- ✅ No transaction created

**Validation:**
```javascript
// backend/src/wallets/wallet.service.js
export async function debit(userId, amount) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  
  // ✅ MUST CHECK:
  if (!wallet || wallet.balance < amount) {
    throw new Error("Insufficient or locked");
  }
  
  // Only proceed if balance sufficient
  return prisma.wallet.update({
    where: { userId },
    data: { balance: { decrement: amount } }
  });
}
```

**Test Command:**
```bash
# Set balance to $100
curl -X POST http://localhost:3000/admin/credit \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"userId":"user-123","amount":100,"reason":"test"}'

# Attempt $200 withdrawal (MUST FAIL)
curl -X POST http://localhost:3000/transactions/withdraw \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"amount":200}'
```

---

### 🔒 **Test Case 2.2: Locked Wallet Blocks Debit**
**Steps:**
1. Admin locks user wallet
2. User attempts to withdraw funds
3. User attempts to open trade

**Expected:**
- ❌ All debit operations rejected
- ❌ Error: "Wallet locked"
- ✅ Balance unchanged
- ✅ User can still view balance (read-only)

**Lock Wallet:**
```bash
curl -X PUT http://localhost:3000/admin/user/{userId}/lock-wallet \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Attempt Operations:**
```bash
# MUST FAIL: Withdrawal
curl -X POST http://localhost:3000/transactions/withdraw \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"amount":50}'

# MUST FAIL: Trade
curl -X POST http://localhost:3000/trades/open \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"symbol":"BTC/USDT","amount":50}'
```

---

### 📡 **Test Case 2.3: Admin Credit Reflected Real-Time**
**Steps:**
1. User connected via Socket.IO
2. Admin credits $1000 to user
3. Verify balance updates in real-time

**Expected:**
- ✅ Admin action completes successfully
- ✅ Database balance updated
- ✅ Socket event emitted: `BALANCE_UPDATED`
- ✅ Frontend balance updates without refresh
- ✅ AuditLog entry created

**Admin Credit:**
```bash
curl -X POST http://localhost:3000/admin/credit \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "amount": 1000,
    "reason": "Test credit"
  }'
```

**Socket Event:**
```javascript
// User receives:
{
  event: "BALANCE_UPDATED",
  data: {
    userId: "user-123",
    newBalance: 1000,
    change: 1000,
    reason: "ADMIN_CREDIT",
    timestamp: "2026-01-20T11:00:00Z"
  }
}
```

---

## 3️⃣ Trading Tests

### 💰 **Test Case 3.1: Price Feed Required**
**Steps:**
1. Stop market data service
2. Attempt to open trade

**Expected:**
- ❌ Trade rejected
- ❌ Error: "Market price unavailable"
- ✅ No trade record created
- ✅ No balance locked

**Validation:**
```javascript
// trading/trade.engine.js
export async function openTrade(userId, symbol, amount) {
  const price = getMarketPrice(symbol);
  
  // ✅ MUST CHECK:
  if (!price || price <= 0) {
    throw new Error("Market price unavailable");
  }
  
  // Only proceed with valid price
  await prisma.trade.create({...});
}
```

---

### 🧮 **Test Case 3.2: PnL Server-Calculated**
**Steps:**
1. User opens trade: BTC/USDT @ $50,000 (entry)
2. Price moves to $51,000
3. User closes trade

**Expected:**
- ✅ PnL calculated server-side: `(51000 - 50000) * amount`
- ✅ Wallet balance updated atomically
- ❌ Client NEVER sends PnL value

**Validation:**
```javascript
// ✅ CORRECT: Server calculates
export async function closeTrade(tradeId) {
  const trade = await prisma.trade.findUnique({ where: { id: tradeId } });
  const exitPrice = getMarketPrice(trade.symbol);
  
  // ✅ SERVER-SIDE CALCULATION:
  const pnl = (exitPrice - trade.entry) * trade.amount;
  
  await prisma.$transaction([
    prisma.trade.update({...}),
    prisma.wallet.update({ 
      data: { balance: { increment: pnl } }  // Server determines amount
    })
  ]);
}

// ❌ WRONG: Client sends PnL
// Frontend: const pnl = this.calculatePnL();
// Frontend: axios.post('/trade/close', { pnl });  // NEVER DO THIS
```

**Test Command:**
```bash
# Open trade
TRADE_ID=$(curl -X POST http://localhost:3000/trades/open \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"symbol":"BTC/USDT","amount":100}' | jq -r '.tradeId')

# Close trade (backend calculates PnL)
curl -X DELETE http://localhost:3000/trades/$TRADE_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

### 🔄 **Test Case 3.3: Close Trade Updates Wallet Once**
**Steps:**
1. Open trade with balance: $1000
2. Close trade with profit: $200
3. Verify balance updated exactly once

**Expected:**
- ✅ Final balance: $1200 (exactly)
- ❌ NOT $1400 (double credit)
- ❌ NOT $1000 (no credit)
- ✅ Atomic transaction ensures consistency

**Validation:**
```javascript
// ✅ Atomic transaction prevents double-crediting
await prisma.$transaction([
  prisma.trade.update({ where: { id: tradeId }, data: { status: "CLOSED" } }),
  prisma.wallet.update({ where: { userId }, data: { balance: { increment: pnl } } })
]);
```

**Test:**
```bash
# Record initial balance
INITIAL_BALANCE=$(curl http://localhost:3000/wallets/balance \
  -H "Authorization: Bearer $TOKEN" | jq -r '.balance')

# Open and close trade
curl -X POST http://localhost:3000/trades/open \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"symbol":"BTC/USDT","amount":100}'

curl -X DELETE http://localhost:3000/trades/$TRADE_ID \
  -H "Authorization: Bearer $TOKEN"

# Verify balance updated once
FINAL_BALANCE=$(curl http://localhost:3000/wallets/balance \
  -H "Authorization: Bearer $TOKEN" | jq -r '.balance')

echo "Expected: $INITIAL_BALANCE + PnL"
echo "Actual: $FINAL_BALANCE"
```

---

## 4️⃣ Binary Options Tests

### ⏱️ **Test Case 4.1: No Early Resolution**
**Steps:**
1. User opens binary trade (5-minute expiry)
2. Attempt to resolve before expiry
3. Wait for expiry time

**Expected:**
- ❌ Manual resolution before expiry rejected
- ✅ Only system cron can resolve
- ✅ Resolution happens at exact expiry time
- ✅ Entry and exit prices locked

**Validation:**
```javascript
// binary/binary.engine.js
export async function resolveBinary(tradeId) {
  const t = await prisma.binaryTrade.findUnique({ where: { id: tradeId } });
  
  // ✅ MUST CHECK expiry time:
  if (new Date() < new Date(t.expiry)) {
    throw new Error("Cannot resolve before expiry");
  }
  
  // Proceed with resolution
  const exitPrice = getMarketPrice(t.symbol);
  // ...
}
```

---

### 💯 **Test Case 4.2: Correct Expiry Price Used**
**Steps:**
1. User opens UP binary @ $50,000
2. Price fluctuates during duration
3. Resolution uses price at **exact expiry time**

**Expected:**
- ✅ Entry price locked: $50,000
- ✅ Exit price from market feed at expiry
- ❌ NOT current price
- ❌ NOT average price
- ✅ Deterministic result (UP wins if exit > entry)

**Validation:**
```javascript
// ✅ CORRECT: Price at expiry
const exitPrice = getMarketPrice(t.symbol);  // Fetched at resolution time

// ❌ WRONG: Current price or average
// const exitPrice = getCurrentPrice();
// const exitPrice = getAveragePrice(t.entry, getCurrentPrice());
```

---

### 🎲 **Test Case 4.3: Win/Loss Deterministic**
**Scenarios:**

**A. UP Trade:**
- Entry: $50,000
- Exit: $50,100
- **Expected:** WIN (exit > entry)

**B. DOWN Trade:**
- Entry: $50,000
- Exit: $49,900
- **Expected:** WIN (exit < entry)

**C. UP Trade (Loss):**
- Entry: $50,000
- Exit: $49,900
- **Expected:** LOSS (exit < entry)

**Payout Logic:**
```javascript
const win = 
  (t.direction === "UP" && exitPrice > t.entry) ||
  (t.direction === "DOWN" && exitPrice < t.entry);

const payout = win ? t.stake * 1.8 : 0;  // 80% profit on win, 0 on loss
```

**Test:**
```bash
# Open UP binary
curl -X POST http://localhost:3000/binary/open \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "symbol": "BTC/USDT",
    "direction": "UP",
    "stake": 100,
    "expiry": 300
  }'

# Wait for expiry (or trigger cron manually)
# Verify result is deterministic based on price comparison
```

---

## 5️⃣ Admin Controls Tests

### 🚫 **Test Case 5.1: No Auto Approvals**
**Steps:**
1. User requests withdrawal: $500
2. Check transaction status
3. Wait 1 minute
4. Check status again

**Expected:**
- ✅ Initial status: PENDING
- ✅ Status after 1 minute: PENDING (unchanged)
- ❌ NO automatic approval
- ✅ Requires admin action

**Validation:**
```javascript
// ❌ NEVER auto-approve:
// setInterval(() => {
//   approveAllPending();  // WRONG!
// }, 60000);

// ✅ CORRECT: Manual approval only
export async function approveTx(req, res) {
  // Requires admin JWT token
  // Requires explicit API call
  // ...
}
```

---

### 📋 **Test Case 5.2: Audit Log Created**
**Steps:**
1. Admin credits user $1000
2. Query AuditLog table
3. Verify entry exists

**Expected:**
- ✅ AuditLog entry created
- ✅ Contains: actor, action, target, metadata, timestamp
- ✅ Immutable (cannot be edited/deleted)
- ✅ Visible to master

**SQL Verification:**
```sql
SELECT * FROM "AuditLog" 
WHERE action LIKE 'CREDIT:%' 
ORDER BY "createdAt" DESC 
LIMIT 1;

-- Expected result:
-- actor: "SYSTEM"
-- action: "CREDIT:user-123:1000:Admin credit"
-- timestamp: 2026-01-20T11:00:00Z
```

---

### ⚛️ **Test Case 5.3: Atomic Balance Change**
**Steps:**
1. Database connection unstable
2. Admin approves withdrawal: $500
3. Simulate database error midway

**Expected:**
- ✅ Either BOTH succeed (transaction + wallet)
- ✅ Or BOTH fail (rollback)
- ❌ NEVER partial state (transaction approved but wallet unchanged)

**Validation:**
```javascript
// ✅ CORRECT: Wrapped in transaction
await prisma.$transaction([
  prisma.transaction.update({ 
    where: { id: txId }, 
    data: { status: "APPROVED" } 
  }),
  prisma.wallet.update({ 
    where: { userId: tx.userId }, 
    data: { balance: { decrement: tx.amount } } 
  })
]);

// ❌ WRONG: Separate operations
await prisma.transaction.update({...});  // Success
await prisma.wallet.update({...});       // Fails → Inconsistent state
```

**Test with Error:**
```javascript
// Simulate error between operations
await prisma.transaction.update({...});
throw new Error("Simulated error");  // Test rollback
await prisma.wallet.update({...});   // Should not execute
```

---

## 6️⃣ Master Controls Tests

### 👤 **Test Case 6.1: Admin Disable Immediate**
**Steps:**
1. Admin is logged in and active
2. Master disables admin account
3. Admin attempts to perform action

**Expected:**
- ✅ Admin account status: `active = false`
- ✅ Admin session invalidated immediately
- ❌ Admin cannot perform any actions
- ✅ Error: "Account disabled"

**Master Action:**
```bash
curl -X PUT http://localhost:3000/master/admin/{adminId}/disable \
  -H "Authorization: Bearer $MASTER_TOKEN" \
  -d '{"reason":"Suspended for review"}'
```

**Admin Test (Should Fail):**
```bash
curl http://localhost:3000/admin/users \
  -H "Authorization: Bearer $DISABLED_ADMIN_TOKEN"

# Expected: 403 Forbidden or 401 Unauthorized
```

---

### ⚙️ **Test Case 6.2: System Config Applied Live**
**Steps:**
1. Master updates binary payout rate: 85% → 90%
2. Verify new binary trades use new rate
3. Verify existing trades unaffected

**Expected:**
- ✅ New payout rate: 90%
- ✅ New trades pay 1.9x stake on win
- ✅ Existing open trades use original rate (85%)
- ✅ No retroactive changes

**Master Action:**
```bash
curl -X PUT http://localhost:3000/master/system/config \
  -H "Authorization: Bearer $MASTER_TOKEN" \
  -d '{"binaryPayoutRate": 0.90}'
```

**Validation:**
```javascript
// New binary trades use updated config
const PAYOUT_RATE = getSystemConfig("binaryPayoutRate");  // 0.90
const payout = win ? stake * (1 + PAYOUT_RATE) : 0;      // 1.9x
```

---

## 🔒 Security Tests

### 🚧 **Rate Limiting Tests**

**Auth Endpoint:**
```bash
# Send 10 login requests (max 5/minute)
for i in {1..10}; do
  curl -X POST http://localhost:3000/auth/login \
    -d '{"email":"test@test.com","password":"wrong"}'
done

# Expected: First 5 succeed (with errors), last 5 blocked
```

**Trading Endpoint:**
```bash
# Send 30 trade requests (max 20/minute)
for i in {1..30}; do
  curl -X POST http://localhost:3000/trades/open \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"symbol":"BTC/USDT","amount":10}'
done

# Expected: First 20 processed, last 10 rate-limited
```

---

### 🛡️ **Socket Authentication Test**

**Valid Token:**
```javascript
const socket = io("http://localhost:3000", {
  auth: { token: validJWT }
});

socket.on("connect", () => {
  console.log("✅ Connected");  // Expected
});
```

**Invalid Token:**
```javascript
const socket = io("http://localhost:3000", {
  auth: { token: "invalid_token" }
});

socket.on("connect_error", (error) => {
  console.log("❌ Connection rejected");  // Expected
  // Error: "Invalid token"
});
```

---

## 📊 QA Checklist Summary

| Category | Tests | Status |
|----------|-------|--------|
| **Authentication** | 4 tests | ❑ |
| **Wallet** | 3 tests | ❑ |
| **Trading** | 3 tests | ❑ |
| **Binary Options** | 3 tests | ❑ |
| **Admin Controls** | 3 tests | ❑ |
| **Master Controls** | 2 tests | ❑ |
| **Security** | 2 tests | ❑ |
| **TOTAL** | **20 tests** | ❑ |

---

## 🚀 Running Tests

### **Manual Testing**
```bash
# 1. Start backend
cd backend && npm run dev

# 2. Run test commands from this document
# 3. Verify expected results

# 4. Check audit logs
curl http://localhost:3000/master/audit/logs \
  -H "Authorization: Bearer $MASTER_TOKEN"
```

### **Automated Testing (Future)**
```bash
# Install test framework
npm install --save-dev jest supertest

# Run tests
npm test
```

---

**✅ All tests MUST pass before production deployment!**
