# FRONTEND STRUCTURE - Phase 5

## PUBLIC APP (frontend-public)

### Page Flow:
```
/login
  ↓
/dashboard (Home)
  ├─ /charts (Live Market Charts)
  ├─ /trade (Open Trade - LONG/SHORT)
  ├─ /binary (Binary Options - UP/DOWN)
  ├─ /ai (AI Arbitrage Panel)
  ├─ /wallet (Balance & History)
  ├─ /transactions (Transaction History)
  └─ /trades (Open Trades)
```

### Key Components:

#### 1. `/login` - Authentication
- Email + password form
- JWT token stored in localStorage
- Redirect to /dashboard on success

#### 2. `/dashboard` - User Home
- Welcome message with username
- **Wallet balance** (real-time via Socket.IO)
- Quick stats: open trades count, total PnL
- Recent transactions (last 5)
- Quick action buttons: Trade, Binary, Deposit, Withdraw
- **Market ticker** (live price updates)

Socket Events:
- `BALANCE_UPDATED` → Update wallet display
- `TRADE_OPENED` → Update open trades count
- `TRADE_CLOSED` → Update PnL
- `PRICE_UPDATE` → Update ticker

#### 3. `/charts` - Live Market Charts
- Symbol selector (BTC/USDT, ETH/USDT, BNB/USDT)
- Candlestick chart (using Chart.js or similar)
- Timeframe selector (1m, 5m, 15m, 1h, 4h, 1d)
- **Live price updates** via Socket.IO (`PRICE_UPDATE` event)
- Technical indicators (optional)

#### 4. `/trade` - Open Trade
- Symbol selector
- Trade type: LONG or SHORT
- Amount input (with max balance check)
- Leverage selector (optional)
- Current market price display
- **Estimated PnL calculator**
- "Open Trade" button

API: `POST /trades/open`
Socket: `TRADE_OPENED` event

#### 5. `/binary` - Binary Options
- Symbol selector
- Direction buttons: **UP** or **DOWN**
- Expiry selector: 60s, 5min, 15min, 1hr
- Stake amount input
- Current price display
- **Payout rate display** (e.g., "85% profit on win")
- **Countdown timer** for active trades
- "Predict" button

Active Trades Display:
- Entry price (locked)
- Current price (live)
- Time remaining (countdown)
- Potential payout

API: `POST /binary/open`
Socket Events:
- `BINARY_OPENED` (on creation)
- `BINARY_RESOLVED` (on expiry)

#### 6. `/ai` - AI Arbitrage Panel
- **AI trading toggle** (enable/disable)
- Risk level selector: LOW, MEDIUM, HIGH
- Max stake per AI trade
- Daily AI trade limit
- **AI performance stats**: win rate, total profit
- Recent AI trades history
- Terms & conditions checkbox

Features:
- User must **explicitly opt-in**
- Can disable AI at any time
- View AI trade history
- Transparency in AI decisions

API: `PUT /ai/settings`, `GET /ai/opportunities`
Socket: `AI_TRADE_EXECUTED` (when AI opens trade)

#### 7. `/wallet` - Wallet Management
- **Current balance** (large display)
- Available balance (balance - exposure)
- Locked in trades (exposure amount)
- **Deposit button** (creates DEPOSIT transaction)
- **Withdrawal form** (amount + submit)
- Transaction history (paginated)

Transaction History:
- Type badges (DEPOSIT/WITHDRAWAL/CREDIT/DEBIT)
- Status badges (PENDING/APPROVED/REJECTED/COMPLETED)
- Amount (color-coded: +green, -red)
- Timestamp
- Admin approval indicator

API:
- `GET /wallets/balance`
- `POST /transactions/withdraw`
- `GET /transactions/history`

Socket Events:
- `BALANCE_UPDATED` → Update balance
- `TX_STATUS_UPDATED` → Update transaction status

#### 8. `/transactions` - Transaction History
- Filter by type (ALL/DEPOSIT/WITHDRAWAL/CREDIT/DEBIT)
- Filter by status (ALL/PENDING/APPROVED/REJECTED/COMPLETED)
- Date range filter
- Sortable columns
- Export to CSV (optional)

Columns:
- Transaction ID
- Type
- Amount
- Status
- Created At
- Approved/Rejected At
- Admin ID (if approved)

#### 9. `/trades` - Open Trades
- List of open trades (LONG/SHORT)
- Entry price
- **Current price** (live via Socket.IO)
- **Current PnL** (calculated real-time)
- PnL percentage
- Duration (time since opened)
- **"Close" button** (triggers close trade API)

Live Updates:
- `PRICE_UPDATE` → Recalculate PnL
- `TRADE_CLOSED` → Remove from list

API: `DELETE /trades/:id`

---

## ADMIN PANEL (frontend-admin)

### Page Flow:
```
/admin/login
  ↓
/admin/dashboard
  ├─ /admin/users (User List)
  ├─ /admin/trades (Live Trades)
  ├─ /admin/transactions (Approve/Reject)
  ├─ /admin/credit (Credit Balance)
  └─ /admin/market (Market Controls)
```

### Key Components:

#### 1. `/admin/login` - Admin Authentication
- Separate login for admin access
- JWT token with ADMIN role
- Role validation (must be ADMIN or MASTER)
- Security: IP whitelist (optional)

#### 2. `/admin/users` - User Management
- **Searchable user table** (by email, ID)
- Status indicators (ACTIVE/FROZEN/SUSPENDED)
- Wallet balance display
- Quick actions per user:
  - **Credit Balance** button
  - **Freeze Account** button
  - **Lock Wallet** button
  - View Details button

Columns:
- User ID
- Email
- Status (badge)
- Balance
- Open Trades
- Last Login
- Actions

API: `GET /admin/users`
Socket: `USER_FROZEN` (when admin freezes)

#### 3. `/admin/trades` - Live Trades Monitor
- **All open trades** across all users
- Filter by symbol, user, trade type
- Sort by amount, PnL, duration
- **Current PnL** (live updates)
- Risk indicators (high leverage, large amounts)
- **Force close button** (with reason input)

Columns:
- Trade ID
- User Email
- Symbol
- Type (LONG/SHORT)
- Amount
- Entry Price
- Current Price
- **PnL (live)**
- Duration
- Actions (Force Close)

API: `GET /admin/trades/live`
Socket Events:
- `PRICE_UPDATE` → Update PnL
- `TRADE_OPENED` → Add to list
- `TRADE_CLOSED` → Remove from list

#### 4. `/admin/transactions` - Transaction Approvals
- List of **PENDING transactions**
- Filter by type (WITHDRAWAL/DEPOSIT)
- User details display
- Balance verification
- **Approve/Reject buttons**
- Reason input for rejection

Transaction Card:
- User email
- Transaction type
- Amount
- Current user balance
- Requested date
- User status (ACTIVE/FROZEN)
- Action buttons

API:
- `GET /admin/transactions/pending`
- `PUT /admin/transactions/:id/approve`
- `PUT /admin/transactions/:id/reject`

Socket Events:
- `TX_CREATED` → Add to pending list
- `TX_APPROVED` → Remove from list

#### 5. `/admin/credit` - Manual Balance Credit
- **User selector** (search by email/ID)
- Amount input (positive for credit)
- **Reason textarea** (required)
- Current balance display
- Preview new balance
- Confirm button

Validations:
- Amount must be positive
- Reason required (min 10 chars)
- User must be ACTIVE

Confirmation Modal:
- "Credit $X to user@email.com?"
- Shows current and new balance
- Double confirmation

API: `POST /admin/credit`
Socket Events:
- `BALANCE_UPDATED` → User sees update
- `ADMIN_ACTION` → Master sees action

#### 6. `/admin/market` - Market Controls
- List of all tradeable symbols
- Status indicators (ACTIVE/PAUSED)
- **Pause/Resume buttons**
- Disable product toggle
- Reason input required

Use Cases:
- Pause symbol during high volatility
- Disable binary options temporarily
- Emergency market freeze

API: `PUT /admin/market/pause`

---

## MASTER PANEL (frontend-master)

### Page Flow:
```
/master-admin/login
  ↓
/master-admin/dashboard
  ├─ /master-admin/admins (Admin Management)
  ├─ /master-admin/audit (Audit Logs)
  ├─ /master-admin/system (System Settings)
  └─ /master-admin/emergency (Emergency Controls)
```

### Key Components:

#### 1. `/master-admin/login` - Master Authentication
- Master credentials only
- Two-factor authentication (optional)
- JWT token with MASTER role
- IP whitelist enforcement

#### 2. `/master-admin/admins` - Admin Management
- **Admin list** with active status
- Create new admin button
- **Disable/Enable toggles**
- View admin activity button
- Last login display

Admin Actions Table:
- Recent actions by each admin
- Filter by admin, date range
- Action type (freeze, approve, credit)
- Target users affected
- Timestamp

Create Admin Modal:
- Email input
- Password input
- Permissions selector (future)

API:
- `GET /master/admins`
- `POST /master/admins/create`
- `PUT /master/admins/:id/disable`
- `GET /master/admins/:id/actions`

#### 3. `/master-admin/audit` - Audit Log Viewer
- **Full audit log access** (all events)
- Advanced filters:
  - Actor (user/admin/master ID)
  - Actor role (USER/ADMIN/MASTER/SYSTEM)
  - Action type (dropdown)
  - Target (userId, tradeId, etc.)
  - Date range

- Export to CSV/JSON
- Real-time log stream (optional)

Log Display:
- Timestamp
- Actor (role + ID)
- Action type
- Target resource
- **Metadata** (expandable JSON viewer)

API: `GET /master/audit/logs`
Socket: `ADMIN_ACTION` event

#### 4. `/master-admin/system` - System Settings
Sections:

**Binary Options Settings:**
- Default payout rate (70-95%)
- Symbol-specific payout rates
- Available expiry durations
- Max stake limits

**AI Arbitrage Settings:**
- **Global enable/disable toggle**
- Max trades per day per user
- Max amount per AI trade
- Minimum confidence threshold

**Trading Hours:**
- Market open/close times by symbol
- Timezone configuration
- Holiday schedule

**Transaction Limits:**
- Min/max withdrawal amounts
- Min/max deposit amounts
- Daily withdrawal limits

API: `PUT /master/system/config`
Socket: `SYSTEM_CONFIG_UPDATED`

#### 5. `/master-admin/emergency` - Emergency Controls
**Maintenance Mode:**
- Toggle switch
- Reason input
- Estimated duration
- Affects all users (read-only)

**Emergency Shutdown:**
- **Red button** with confirmation
- Requires reason
- Force-closes ALL open trades
- Disables all trading operations
- Notifies all admins

API:
- `PUT /master/system/maintenance`
- `POST /master/system/emergency-shutdown`

Socket: `SYSTEM_ALERT` (critical notifications)

---

## Shared Components

**Reusable UI Components:**
- `Button` (Primary, Secondary, Danger)
- `Input` (Text, Number, Email with validation)
- `Select` (Dropdown with search)
- `Badge` (Status indicators - color-coded)
- `Card` (Container with header/body/footer)
- `Table` (Sortable, filterable, paginated)
- `Modal` (Confirmation, Info, Form)
- `Toast` (Success, Error, Warning notifications)
- `Chart` (Candlestick, Line, Bar)
- `Loader` (Spinner, Skeleton, Progress bar)

**API Integration Pattern:**
```javascript
// frontend-*/src/api.js
// Centralized API calls
// Axios interceptors for:
//   - JWT token injection
//   - Error handling
//   - Retry logic
//   - Loading state management
```

**Socket.IO Integration:**
```javascript
// Connect on login with JWT token
// Join role-specific rooms
// Global event listeners in App.jsx
// Event handlers update React state
// Auto-reconnect on disconnect
// State sync on reconnect
```

---

## Frontend Business Rules

✅ **JWT Authentication** - All routes require valid token  
✅ **Role-based routing** - Public/Admin/Master separate apps  
✅ **Real-time updates** - Socket.IO for live data  
✅ **Responsive design** - Mobile-friendly interfaces  
✅ **Error handling** - User-friendly error messages  
✅ **Loading states** - Skeleton screens during data fetch  
✅ **Confirmation modals** - Critical actions require confirmation  
✅ **Session management** - Auto-logout on token expiry  
✅ **State persistence** - LocalStorage for non-sensitive data  
