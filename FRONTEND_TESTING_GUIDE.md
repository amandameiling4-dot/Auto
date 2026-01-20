# Frontend Testing Guide

## 🚀 Quick Start

### Prerequisites
Backend must be running on port 3000 (or update API in frontend/src/api.js)

### Start Public App
```bash
cd frontend-public
npm install  # If not already done
npm run dev
```
**Opens on:** http://localhost:5173

### Start Admin Panel
```bash
cd frontend-admin
npm install  # If not already done
npm run dev
```
**Opens on:** http://localhost:5174

---

## 🧪 Test Scenarios

### Public App Testing

#### 1. Login Flow
**Test:** User login
```
URL: http://localhost:5173/login
Email: user@example.com
Password: password123
```
**Expected:**
- ✅ Redirect to /dashboard
- ✅ Token stored in localStorage
- ✅ Socket.IO connection established
- ✅ Dashboard shows user email

**Validation:**
- ❌ Login with admin email → "Invalid credentials for public app"
- ❌ Wrong password → "Login failed"

#### 2. Dashboard
**Test:** Live data display
```
Navigate to: /dashboard
```
**Expected:**
- ✅ Wallet balance displays
- ✅ Open trades count shows
- ✅ Total P&L calculated
- ✅ Recent transactions table (if any)
- ✅ Live market price ticker updates every 2s
- ✅ Quick action buttons visible

**Check Console:**
```javascript
// Should see:
✅ Socket connected: <socket-id>
```

#### 3. Binary Options Trading
**Test:** Open binary trade
```
Navigate to: /binary
```
**Steps:**
1. Select symbol: BTC/USDT
2. Click direction: 📈 UP
3. Select expiry: 60 seconds
4. Enter stake: 10
5. Click "🎯 Place Prediction"

**Expected:**
- ✅ Current price displays (live updates)
- ✅ Potential return calculated (stake * 1.85)
- ✅ Alert: "Binary trade opened! Entry Price: $X Expires in 60s"
- ✅ Trade appears in "Active Binary Trades" section
- ✅ Countdown timer starts (0:60 → 0:59 → ...)
- ✅ Live price updates during trade

**Wait 60 seconds:**
- ✅ Alert: "Binary trade resolved: WIN/LOSS Payout: $X"
- ✅ Balance updates automatically
- ✅ Trade removed from active list

**Validation:**
- ❌ Stake > balance → "Insufficient balance"
- ❌ Stake ≤ 0 → "Please enter valid stake amount"

#### 4. Real-Time Socket Events
**Test:** Balance update via Socket.IO

**Trigger:** Admin credits balance in admin panel

**Expected in Public App:**
- ✅ Balance updates WITHOUT page refresh
- ✅ Dashboard balance display changes
- ✅ Binary page balance changes

**Check Console:**
```javascript
// Should see:
BALANCE_UPDATED event received: { newBalance: X }
```

---

### Admin Panel Testing

#### 1. Admin Login
**Test:** Admin authentication
```
URL: http://localhost:5174/login
Email: admin@example.com
Password: admin123
```
**Expected:**
- ✅ Redirect to /users
- ✅ Navigation bar visible
- ✅ No "MASTER" badge (only for master role)

**With Master:**
```
Email: master@example.com
Password: master123
```
**Expected:**
- ✅ "MASTER" badge appears in nav bar

**Validation:**
- ❌ Login with user role → "Access denied: Admin privileges required"

#### 2. User Management
**Test:** View and manage users
```
Navigate to: /users
```
**Expected:**
- ✅ User table displays all users
- ✅ Search bar filters by email/ID
- ✅ Status badges show (ACTIVE/FROZEN)
- ✅ Wallet status shows (Active/Locked)
- ✅ Balance displays
- ✅ Action buttons visible

**Test: Freeze User**
1. Click "❄️ Freeze" on active user
2. Enter reason: "Suspicious activity"
3. Click OK

**Expected:**
- ✅ Alert: "User frozen successfully"
- ✅ User status changes to FROZEN
- ✅ Button changes to "✅ Unfreeze"
- ✅ Backend logs action in AuditLog
- ✅ Master receives ADMIN_ACTION event

**Test: Lock Wallet**
1. Click "🔒 Lock" on user
2. Enter reason: "Risk management"

**Expected:**
- ✅ Wallet status changes to 🔒 Locked
- ✅ Button changes to "🔓 Unlock"

**Test: Credit Balance**
1. Click "💰 Credit" on user
2. Enter amount: 100
3. Enter reason: "Promotion bonus"

**Expected:**
- ✅ Alert: "Credited $100 successfully"
- ✅ User balance increases by $100
- ✅ User receives BALANCE_UPDATED event

#### 3. Transaction Approvals
**Test:** Approve pending withdrawal
```
Navigate to: /transactions
```

**Prerequisites:** User must have submitted withdrawal request

**Expected Display:**
- ✅ Transaction cards in grid layout
- ✅ Card shows:
  * Type badge (WITHDRAWAL)
  * Amount
  * User email
  * User status (ACTIVE)
  * Current balance
  * Wallet status (Active)
  * Validation checks
  * Approve/Reject buttons

**Test: Approve Valid Withdrawal**
1. User: Status ACTIVE, Wallet Active, Balance $500
2. Withdrawal: $200
3. Click "✅ Approve"
4. Confirm

**Expected:**
- ✅ Alert: "Transaction approved successfully"
- ✅ Card disappears from pending list
- ✅ Backend:
  * TX status: COMPLETED
  * User balance: $500 → $300
  * AuditLog entry created
- ✅ User receives BALANCE_UPDATED event
- ✅ Master receives ADMIN_ACTION event

**Test: Reject Withdrawal**
1. Click "❌ Reject"
2. Enter reason: "Insufficient documentation"
3. Click OK

**Expected:**
- ✅ Alert: "Transaction rejected successfully"
- ✅ Card disappears
- ✅ Backend: TX status REJECTED, reason stored
- ✅ User notified

**Validation Tests:**
- ⚠️ Frozen user → "User account is frozen" (approve disabled)
- ⚠️ Locked wallet → "User wallet is locked" (approve disabled)
- ❌ Withdrawal > balance → "Insufficient balance" (approve disabled)

---

## 🔧 Developer Tools Testing

### Check localStorage
```javascript
// In browser console (Public App):
localStorage.getItem('token')
// Should return JWT string

localStorage.getItem('user')
// Should return: {"id":"...","email":"...","role":"USER"}
```

### Check Socket.IO Connection
```javascript
// In browser console:
// Look for these logs:
✅ Socket connected: <socket-id>

// To manually emit event (for testing):
socket.emit('test', { data: 'test' })
```

### Network Tab Testing
**Public App Login:**
```
POST http://localhost:3000/auth/login
Request: { "email": "user@example.com", "password": "..." }
Response: { "token": "eyJ...", "user": {...} }
```

**Admin Approve Transaction:**
```
PUT http://localhost:3000/admin/tx/<tx-id>/approve
Headers: { "Authorization": "Bearer eyJ..." }
Response: { "transaction": {...}, "message": "..." }
```

---

## 🐛 Common Issues

### Issue: "Socket not connected"
**Cause:** Backend not running or wrong API URL
**Fix:**
```bash
# Check backend is running:
cd backend && npm run dev

# Check API constant:
# frontend-*/src/api.js
export const API = "http://localhost:3000";  // Ensure correct port
```

### Issue: "Login failed"
**Cause:** Backend auth routes not implemented or user doesn't exist
**Fix:**
```bash
# Check backend auth route:
# backend/src/auth/auth.routes.js

# Create test user via Prisma Studio:
cd backend && npx prisma studio
# Or seed database
```

### Issue: "CORS error"
**Cause:** Backend CORS not configured for frontend origin
**Fix:**
```javascript
// backend/src/app.js
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true
}));
```

### Issue: "Balance not updating in real-time"
**Cause:** Socket.IO not emitting BALANCE_UPDATED event
**Check:**
```javascript
// backend/src/admin/admin.controller.js
// After balance update:
io.to(`user:${userId}`).emit("BALANCE_UPDATED", {
  userId,
  newBalance,
  change,
  reason
});
```

### Issue: "Binary trade not auto-resolving"
**Cause:** Cron job not running
**Check:**
```javascript
// backend/src/server.js
initCronJobs();  // Ensure called on startup

// backend/src/utils/cron.js
// Cron should run every 10 seconds
```

---

## 📊 Expected Console Output

### Public App (Normal Operation)
```
✅ Socket connected: qwerty123
PRICE_UPDATE received: { BTC/USDT: 45234, ETH/USDT: 2456 }
PRICE_UPDATE received: { BTC/USDT: 45238, ETH/USDT: 2457 }
BALANCE_UPDATED received: { newBalance: 1200.50, change: 100, reason: "ADMIN_CREDIT" }
BINARY_RESOLVED received: { result: "WIN", payout: 185 }
```

### Admin Panel (Normal Operation)
```
✅ Admin Socket connected: asdfgh456
USER_FROZEN event received
ADMIN_ACTION event received: { adminId: "...", action: "FREEZE_USER" }
TX_CREATED event received
TX_STATUS_UPDATED event received
```

---

## ✅ Full Test Checklist

### Public App
- [ ] Login with valid USER credentials
- [ ] Login fails with ADMIN credentials
- [ ] Dashboard displays balance
- [ ] Live market prices update every 2s
- [ ] Recent transactions display (if any)
- [ ] Navigate to /binary
- [ ] Open binary trade with valid stake
- [ ] See countdown timer
- [ ] Wait for auto-resolution (60s)
- [ ] Receive resolution alert
- [ ] Balance updates automatically
- [ ] Logout redirects to /login

### Admin Panel
- [ ] Login with ADMIN credentials
- [ ] Navigation bar displays
- [ ] MASTER badge shows for master role
- [ ] View users table
- [ ] Search filters work
- [ ] Freeze user (requires reason)
- [ ] Unfreeze user works
- [ ] Lock wallet (requires reason)
- [ ] Unlock wallet works
- [ ] Credit balance (requires amount + reason)
- [ ] Navigate to /transactions
- [ ] View pending transactions
- [ ] Approve valid transaction
- [ ] Reject transaction (requires reason)
- [ ] Validation warnings display correctly
- [ ] Real-time updates work

### Cross-App Testing
- [ ] Admin credits balance → User sees update in real-time
- [ ] Admin approves withdrawal → User balance decreases
- [ ] User places binary trade → Admin can see in future "Live Trades" page
- [ ] System resolves binary → User balance updates → Admin sees balance change

---

## 🎯 Performance Benchmarks

### Load Times (Target)
- Initial page load: < 1s
- Login API call: < 500ms
- Dashboard data fetch: < 1s
- Socket.IO connection: < 300ms

### Real-Time Updates
- Price update frequency: Every 2s
- Balance update latency: < 100ms (from event to UI)
- Transaction approval: < 1s (from click to confirmation)

---

## 📝 Notes

1. **Backend Required:** All frontend features require corresponding backend endpoints
2. **Test Data:** Create test users/admins via Prisma Studio or seed script
3. **Socket.IO:** Ensure backend Socket.IO server is running on same port as API
4. **Real-Time:** Open both apps side-by-side to see cross-app real-time updates
5. **Production:** Change API constant to production URL before deployment

---

## 🔗 Related Files

- Backend Admin Controller: `backend/src/admin/admin.controller.js`
- Backend Socket Events: `backend/src/sockets/events.js`
- Backend Auth Routes: `backend/src/auth/auth.routes.js`
- Frontend Socket Client: `frontend-public/src/socket.js`
- Frontend Binary Page: `frontend-public/src/pages/Binary.jsx`
- Admin Transaction Page: `frontend-admin/src/pages/Transactions.jsx`

---

**Happy Testing! 🚀**
