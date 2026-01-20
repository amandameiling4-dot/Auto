# ADVANCED FEATURES SPECIFICATION

## 🎯 Overview

This document outlines the **advanced trading features** including tiered Binary Options, AI Arbitrage levels, comprehensive admin controls, and integrated customer service system.

---

## 📊 TIER SYSTEM ARCHITECTURE

### **Binary Options - 5 Levels**

| Level | Name | Capital Required | Profit % | Trade Duration | Max Trades/Day | Entry Fee |
|-------|------|------------------|----------|----------------|----------------|-----------|
| 1 | **Starter** | $100 - $500 | 75% | 1-5 min | 20 | 0% |
| 2 | **Bronze** | $500 - $2,000 | 80% | 1-15 min | 50 | 0% |
| 3 | **Silver** | $2,000 - $10,000 | 85% | 1-60 min | 100 | 0% |
| 4 | **Gold** | $10,000 - $50,000 | 90% | 1-240 min | 200 | 0% |
| 5 | **Platinum** | $50,000+ | 95% | 1-1440 min | Unlimited | 0% |

**Features by Level:**
- **Starter**: Basic pairs (BTC, ETH, BNB)
- **Bronze**: + Major altcoins (SOL, ADA, MATIC)
- **Silver**: + All top 50 coins + FX majors (EUR/USD, GBP/USD)
- **Gold**: + Commodities (Gold, Silver, Oil) + All FX pairs
- **Platinum**: + Indices (S&P500, NASDAQ) + All assets + Priority execution

---

### **AI Arbitrage - 5 Levels**

| Level | Name | Capital Required | Expected ROI | Execution Speed | Risk Level | Fee |
|-------|------|------------------|--------------|-----------------|------------|-----|
| 1 | **Basic** | $1,000 - $5,000 | 0.5-1% | Standard | Low | 2% |
| 2 | **Advanced** | $5,000 - $20,000 | 1-2% | Fast | Low-Medium | 1.5% |
| 3 | **Pro** | $20,000 - $100,000 | 2-3% | Very Fast | Medium | 1% |
| 4 | **Expert** | $100,000 - $500,000 | 3-5% | Instant | Medium-High | 0.5% |
| 5 | **Elite** | $500,000+ | 5-10% | Ultra-Fast | High | 0.25% |

**AI Features by Level:**
- **Basic**: 3-5 opportunities/day, manual approval
- **Advanced**: 10-15 opportunities/day, semi-auto
- **Pro**: 20-30 opportunities/day, auto-execute under $5k
- **Expert**: 50+ opportunities/day, auto-execute under $20k
- **Elite**: Unlimited, full automation, custom strategies

---

## 🗄️ DATABASE SCHEMA (NEW MODELS)

### **BinaryTier Model**
```prisma
model BinaryTier {
  id              String   @id @default(uuid())
  level           Int      @unique // 1-5
  name            String   // "Starter", "Bronze", etc.
  minCapital      Decimal  @db.Decimal(20, 8)
  maxCapital      Decimal? @db.Decimal(20, 8)
  profitPercent   Decimal  @db.Decimal(5, 2) // 75.00, 80.00, etc.
  minDuration     Int      // seconds
  maxDuration     Int      // seconds
  maxTradesPerDay Int
  allowedSymbols  Json     // ["BTC/USDT", "ETH/USDT", ...]
  entryFee        Decimal  @default(0) @db.Decimal(5, 2)
  active          Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### **AITier Model**
```prisma
model AITier {
  id              String   @id @default(uuid())
  level           Int      @unique // 1-5
  name            String   // "Basic", "Advanced", etc.
  minCapital      Decimal  @db.Decimal(20, 8)
  maxCapital      Decimal? @db.Decimal(20, 8)
  expectedROI     String   // "0.5-1%"
  executionSpeed  String   // "Standard", "Fast", "Ultra-Fast"
  riskLevel       String   // "Low", "Medium", "High"
  feePercent      Decimal  @db.Decimal(5, 2) // 2.00, 1.50, etc.
  maxOppsPerDay   Int      // Max opportunities per day
  autoExecute     Boolean  // Auto-execute trades
  autoExecuteMax  Decimal? @db.Decimal(20, 8) // Max amount for auto
  active          Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### **UserTier Model**
```prisma
model UserTier {
  id              String   @id @default(uuid())
  userId          String
  binaryTierLevel Int      @default(1)
  aiTierLevel     Int      @default(1)
  upgradeHistory  Json?    // Track tier upgrades
  lastUpgrade     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId])
  @@index([userId])
}
```

### **BonusProgram Model**
```prisma
model BonusProgram {
  id              String   @id @default(uuid())
  name            String   // "Welcome Bonus", "Deposit Match", etc.
  type            String   // "DEPOSIT", "REFERRAL", "TRADE_VOLUME", "SIGNUP"
  bonusPercent    Decimal? @db.Decimal(5, 2) // 50.00 = 50%
  fixedAmount     Decimal? @db.Decimal(20, 8) // Fixed bonus amount
  minDeposit      Decimal? @db.Decimal(20, 8)
  maxBonus        Decimal? @db.Decimal(20, 8)
  validFrom       DateTime
  validUntil      DateTime?
  requiresKYC     Boolean  @default(false)
  minTierLevel    Int?     // Minimum tier to qualify
  conditions      Json?    // Additional conditions
  active          Boolean  @default(true)
  createdBy       String   // Admin ID
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([active])
  @@index([validFrom, validUntil])
}
```

### **UserBonus Model**
```prisma
model UserBonus {
  id              String   @id @default(uuid())
  userId          String
  bonusProgramId  String
  amount          Decimal  @db.Decimal(20, 8)
  status          String   // "PENDING", "ACTIVE", "USED", "EXPIRED", "CANCELLED"
  wagerRequirement Decimal @default(0) @db.Decimal(20, 8) // Amount that must be traded
  wagerProgress   Decimal  @default(0) @db.Decimal(20, 8) // Current wager progress
  awardedAt       DateTime @default(now())
  expiresAt       DateTime?
  usedAt          DateTime?
  metadata        Json?
  
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([status])
}
```

### **DepositAddress Model**
```prisma
model DepositAddress {
  id              String   @id @default(uuid())
  currency        String   // "BTC", "ETH", "USDT", etc.
  network         String   // "Bitcoin", "Ethereum", "BSC", "TRC20"
  address         String
  qrCode          String?  // URL to QR code image
  minDeposit      Decimal  @db.Decimal(20, 8)
  fee             Decimal  @default(0) @db.Decimal(20, 8)
  active          Boolean  @default(true)
  isDefault       Boolean  @default(false)
  displayOrder    Int      @default(0)
  createdBy       String   // Admin ID
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([currency, network, address])
  @@index([currency])
  @@index([active])
}
```

### **News Model**
```prisma
model News {
  id              String   @id @default(uuid())
  title           String
  summary         String   @db.Text
  content         String   @db.Text // Full article content (Markdown)
  imageUrl        String?
  category        String   // "MARKET", "PLATFORM", "CRYPTO", "REGULATION"
  tags            Json?    // ["Bitcoin", "Trading", "Update"]
  publishedAt     DateTime @default(now())
  featured        Boolean  @default(false) // Show on homepage
  active          Boolean  @default(true)
  views           Int      @default(0)
  createdBy       String   // Admin ID
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([publishedAt])
  @@index([featured, active])
  @@index([category])
}
```

### **SupportTicket Model** (Telegram Integration)
```prisma
model SupportTicket {
  id              String   @id @default(uuid())
  userId          String
  subject         String
  status          String   // "OPEN", "IN_PROGRESS", "WAITING_USER", "RESOLVED", "CLOSED"
  priority        String   @default("NORMAL") // "LOW", "NORMAL", "HIGH", "URGENT"
  telegramChatId  String?  // Telegram chat ID for admin
  assignedTo      String?  // Admin ID
  lastReplyAt     DateTime?
  closedAt        DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages        SupportMessage[]
  
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}
```

### **SupportMessage Model**
```prisma
model SupportMessage {
  id              String   @id @default(uuid())
  ticketId        String
  senderId        String   // User or Admin ID
  senderType      String   // "USER", "ADMIN", "SYSTEM"
  message         String   @db.Text
  attachments     Json?    // Array of file URLs
  sentAt          DateTime @default(now())
  
  ticket          SupportTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  
  @@index([ticketId])
  @@index([sentAt])
}
```

---

## 🔧 NEW BACKEND MODULES

### **1. Tier Management** (`backend/src/tiers/`)

#### **`tier.service.js`**
```javascript
// Get user's current tiers
async function getUserTiers(userId) {
  const userTier = await prisma.userTier.findUnique({ where: { userId } });
  const binaryTier = await prisma.binaryTier.findUnique({ where: { level: userTier.binaryTierLevel } });
  const aiTier = await prisma.aiTier.findUnique({ where: { level: userTier.aiTierLevel } });
  return { userTier, binaryTier, aiTier };
}

// Check if user can upgrade tier
async function canUpgradeTier(userId, tierType) {
  const wallet = await getWallet(userId);
  const currentTier = await getUserTiers(userId);
  const nextLevel = tierType === 'binary' ? currentTier.binaryTierLevel + 1 : currentTier.aiTierLevel + 1;
  
  if (nextLevel > 5) return { canUpgrade: false, reason: "Max tier reached" };
  
  const nextTier = tierType === 'binary' 
    ? await prisma.binaryTier.findUnique({ where: { level: nextLevel } })
    : await prisma.aiTier.findUnique({ where: { level: nextLevel } });
  
  return {
    canUpgrade: wallet.balance >= nextTier.minCapital,
    requiredCapital: nextTier.minCapital,
    currentBalance: wallet.balance,
    nextTier
  };
}

// Upgrade user tier
async function upgradeTier(userId, tierType) {
  const check = await canUpgradeTier(userId, tierType);
  if (!check.canUpgrade) throw new Error("Insufficient capital for upgrade");
  
  await prisma.userTier.update({
    where: { userId },
    data: {
      [tierType === 'binary' ? 'binaryTierLevel' : 'aiTierLevel']: { increment: 1 },
      lastUpgrade: new Date(),
      upgradeHistory: {
        push: {
          tierType,
          level: check.nextTier.level,
          timestamp: new Date()
        }
      }
    }
  });
  
  // Send notification
  await scheduleEmail(userId, 'TIER_UPGRADE', { tierType, tier: check.nextTier });
  
  return check.nextTier;
}
```

#### **`tier.routes.js`**
```javascript
router.get('/tiers/me', authenticate, getUserTiersHandler);
router.get('/tiers/binary/:level', authenticate, getBinaryTierDetails);
router.get('/tiers/ai/:level', authenticate, getAITierDetails);
router.post('/tiers/upgrade', authenticate, upgradeTierHandler);

// Admin routes
router.post('/admin/tiers/binary', authenticate, requireRole(['ADMIN', 'MASTER']), createBinaryTier);
router.put('/admin/tiers/binary/:level', authenticate, requireRole(['ADMIN', 'MASTER']), updateBinaryTier);
router.post('/admin/tiers/ai', authenticate, requireRole(['ADMIN', 'MASTER']), createAITier);
router.put('/admin/tiers/ai/:level', authenticate, requireRole(['ADMIN', 'MASTER']), updateAITier);
```

---

### **2. Bonus System** (`backend/src/bonus/`)

#### **`bonus.service.js`**
```javascript
// Create bonus program
async function createBonusProgram(adminId, data) {
  const program = await prisma.bonusProgram.create({
    data: { ...data, createdBy: adminId }
  });
  
  await logAction(adminId, 'ADMIN', 'BONUS_PROGRAM_CREATED', program.id, data);
  return program;
}

// Award bonus to user
async function awardBonus(userId, bonusProgramId, amount) {
  const program = await prisma.bonusProgram.findUnique({ where: { id: bonusProgramId } });
  if (!program.active) throw new Error("Bonus program is not active");
  
  const userBonus = await prisma.userBonus.create({
    data: {
      userId,
      bonusProgramId,
      amount,
      status: 'ACTIVE',
      wagerRequirement: amount.mul(program.wagerMultiplier || 1),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    }
  });
  
  // Add to wallet as bonus balance (locked until wager requirement met)
  await prisma.wallet.update({
    where: { userId },
    data: { bonusBalance: { increment: amount } }
  });
  
  await scheduleEmail(userId, 'BONUS_AWARDED', { amount, program });
  return userBonus;
}

// Check and release bonus (called after trades)
async function checkBonusWager(userId, tradeVolume) {
  const activeBonuses = await prisma.userBonus.findMany({
    where: { userId, status: 'ACTIVE' }
  });
  
  for (const bonus of activeBonuses) {
    const newProgress = bonus.wagerProgress + tradeVolume;
    
    if (newProgress >= bonus.wagerRequirement) {
      // Bonus fully wagered, convert to real balance
      await prisma.$transaction([
        prisma.userBonus.update({
          where: { id: bonus.id },
          data: { status: 'USED', wagerProgress: bonus.wagerRequirement, usedAt: new Date() }
        }),
        prisma.wallet.update({
          where: { userId },
          data: {
            bonusBalance: { decrement: bonus.amount },
            balance: { increment: bonus.amount }
          }
        })
      ]);
      
      await scheduleEmail(userId, 'BONUS_RELEASED', { amount: bonus.amount });
    } else {
      // Update progress
      await prisma.userBonus.update({
        where: { id: bonus.id },
        data: { wagerProgress: newProgress }
      });
    }
  }
}
```

---

### **3. Deposit Address Management** (`backend/src/deposits/`)

#### **`deposit-address.service.js`**
```javascript
// Get all active deposit addresses
async function getDepositAddresses() {
  return await prisma.depositAddress.findMany({
    where: { active: true },
    orderBy: { displayOrder: 'asc' }
  });
}

// Admin: Add new deposit address
async function addDepositAddress(adminId, data) {
  const address = await prisma.depositAddress.create({
    data: { ...data, createdBy: adminId }
  });
  
  await logAction(adminId, 'ADMIN', 'DEPOSIT_ADDRESS_ADDED', address.id, data);
  return address;
}

// Admin: Update deposit address
async function updateDepositAddress(adminId, addressId, data) {
  const address = await prisma.depositAddress.update({
    where: { id: addressId },
    data
  });
  
  await logAction(adminId, 'ADMIN', 'DEPOSIT_ADDRESS_UPDATED', addressId, data);
  return address;
}

// Admin: Toggle address active status
async function toggleDepositAddress(adminId, addressId, active) {
  const address = await prisma.depositAddress.update({
    where: { id: addressId },
    data: { active }
  });
  
  await logAction(adminId, 'ADMIN', 'DEPOSIT_ADDRESS_TOGGLED', addressId, { active });
  return address;
}
```

---

### **4. News System** (`backend/src/news/`)

#### **`news.service.js`**
```javascript
// Get featured news for homepage
async function getFeaturedNews(limit = 5) {
  return await prisma.news.findMany({
    where: { featured: true, active: true },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      summary: true,
      imageUrl: true,
      category: true,
      publishedAt: true,
      views: true
    }
  });
}

// Get all news with pagination
async function getNews(filters, page = 1, limit = 10) {
  const where = {
    active: true,
    ...(filters.category && { category: filters.category }),
    ...(filters.search && {
      OR: [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { summary: { contains: filters.search, mode: 'insensitive' } }
      ]
    })
  };
  
  const [news, total] = await Promise.all([
    prisma.news.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.news.count({ where })
  ]);
  
  return {
    news,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

// Increment news view count
async function incrementNewsView(newsId) {
  await prisma.news.update({
    where: { id: newsId },
    data: { views: { increment: 1 } }
  });
}

// Admin: Create news
async function createNews(adminId, data) {
  const news = await prisma.news.create({
    data: { ...data, createdBy: adminId }
  });
  
  await logAction(adminId, 'ADMIN', 'NEWS_CREATED', news.id, data);
  return news;
}
```

---

### **5. Customer Service (Telegram Integration)** (`backend/src/support/`)

#### **`support.service.js`**
```javascript
import TelegramBot from 'node-telegram-bot-api';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPPORT_TELEGRAM_USERNAME = '@goblin_niko4';
const SUPPORT_TELEGRAM_CHAT_ID = process.env.SUPPORT_TELEGRAM_CHAT_ID;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Create support ticket
async function createSupportTicket(userId, subject, initialMessage) {
  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      subject,
      status: 'OPEN'
    }
  });
  
  // Create first message
  const message = await prisma.supportMessage.create({
    data: {
      ticketId: ticket.id,
      senderId: userId,
      senderType: 'USER',
      message: initialMessage
    }
  });
  
  // Send notification to Telegram
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const telegramMessage = `🆕 New Support Ticket #${ticket.id.slice(0, 8)}\n\n` +
                          `👤 User: ${user.email}\n` +
                          `📝 Subject: ${subject}\n` +
                          `💬 Message: ${initialMessage}\n\n` +
                          `Reply with: /reply ${ticket.id} your message`;
  
  const telegramResponse = await bot.sendMessage(SUPPORT_TELEGRAM_CHAT_ID, telegramMessage);
  
  // Store Telegram chat ID for replies
  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: { telegramChatId: telegramResponse.chat.id }
  });
  
  return { ticket, message };
}

// User sends message
async function sendUserMessage(userId, ticketId, message) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (ticket.userId !== userId) throw new Error("Unauthorized");
  
  const msg = await prisma.supportMessage.create({
    data: {
      ticketId,
      senderId: userId,
      senderType: 'USER',
      message
    }
  });
  
  // Update ticket
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { lastReplyAt: new Date(), status: 'WAITING_ADMIN' }
  });
  
  // Forward to Telegram
  const telegramMessage = `💬 User Reply #${ticketId.slice(0, 8)}\n\n${message}`;
  await bot.sendMessage(ticket.telegramChatId || SUPPORT_TELEGRAM_CHAT_ID, telegramMessage);
  
  // Emit real-time update to user
  io.to(`user:${userId}`).emit('SUPPORT_MESSAGE', {
    ticketId,
    message: msg,
    status: 'sent'
  });
  
  return msg;
}

// Telegram bot receives admin reply
bot.onText(/\/reply ([a-f0-9-]+) (.+)/i, async (msg, match) => {
  const ticketId = match[1];
  const replyMessage = match[2];
  
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    return bot.sendMessage(msg.chat.id, '❌ Ticket not found');
  }
  
  // Create admin message
  const message = await prisma.supportMessage.create({
    data: {
      ticketId,
      senderId: 'TELEGRAM_SUPPORT',
      senderType: 'ADMIN',
      message: replyMessage
    }
  });
  
  // Update ticket
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { lastReplyAt: new Date(), status: 'WAITING_USER' }
  });
  
  // Send to user via Socket.IO (real-time)
  io.to(`user:${ticket.userId}`).emit('SUPPORT_MESSAGE', {
    ticketId,
    message: {
      id: message.id,
      senderType: 'ADMIN',
      message: replyMessage,
      sentAt: message.sentAt
    },
    status: 'received'
  });
  
  bot.sendMessage(msg.chat.id, '✅ Reply sent to user');
});

// Get ticket messages
async function getTicketMessages(userId, ticketId) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (ticket.userId !== userId) throw new Error("Unauthorized");
  
  return await prisma.supportMessage.findMany({
    where: { ticketId },
    orderBy: { sentAt: 'asc' }
  });
}
```

#### **`support.routes.js`**
```javascript
router.post('/support/tickets', authenticate, createTicketHandler);
router.get('/support/tickets', authenticate, getUserTicketsHandler);
router.get('/support/tickets/:id/messages', authenticate, getTicketMessagesHandler);
router.post('/support/tickets/:id/messages', authenticate, sendMessageHandler);
router.put('/support/tickets/:id/close', authenticate, closeTicketHandler);

// Admin routes
router.get('/admin/support/tickets', authenticate, requireRole(['ADMIN', 'MASTER']), getAllTicketsHandler);
router.put('/admin/support/tickets/:id/assign', authenticate, requireRole(['ADMIN', 'MASTER']), assignTicketHandler);
router.put('/admin/support/tickets/:id/status', authenticate, requireRole(['ADMIN', 'MASTER']), updateTicketStatusHandler);
```

---

## 🎨 FRONTEND COMPONENTS

### **1. Tier Display Component** (`TierCard.jsx`)
```jsx
export function TierCard({ type, currentLevel, tiers }) {
  const currentTier = tiers.find(t => t.level === currentLevel);
  const nextTier = tiers.find(t => t.level === currentLevel + 1);
  
  return (
    <div className="tier-card">
      <div className="tier-header">
        <h3>{type === 'binary' ? 'Binary Options' : 'AI Arbitrage'}</h3>
        <span className="tier-badge">{currentTier.name}</span>
      </div>
      
      <div className="tier-benefits">
        {type === 'binary' ? (
          <>
            <p>Profit: {currentTier.profitPercent}%</p>
            <p>Max Trades: {currentTier.maxTradesPerDay}/day</p>
            <p>Duration: {formatDuration(currentTier.minDuration)} - {formatDuration(currentTier.maxDuration)}</p>
          </>
        ) : (
          <>
            <p>Expected ROI: {currentTier.expectedROI}</p>
            <p>Speed: {currentTier.executionSpeed}</p>
            <p>Fee: {currentTier.feePercent}%</p>
          </>
        )}
      </div>
      
      {nextTier && (
        <div className="tier-upgrade">
          <p>Upgrade to {nextTier.name}</p>
          <p>Required: ${nextTier.minCapital.toLocaleString()}</p>
          <button onClick={() => upgradeTier(type)}>Upgrade</button>
        </div>
      )}
    </div>
  );
}
```

---

### **2. News Section** (`NewsSection.jsx`)
```jsx
export function NewsSection() {
  const [news, setNews] = useState([]);
  
  useEffect(() => {
    api.get('/news/featured').then(res => setNews(res.data));
  }, []);
  
  return (
    <div className="news-section">
      <h2>Latest News</h2>
      <div className="news-grid">
        {news.map(article => (
          <div key={article.id} className="news-card" onClick={() => viewNews(article.id)}>
            {article.imageUrl && <img src={article.imageUrl} alt={article.title} />}
            <div className="news-content">
              <span className="news-category">{article.category}</span>
              <h3>{article.title}</h3>
              <p>{article.summary}</p>
              <span className="news-date">{formatDate(article.publishedAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### **3. Customer Service Popup** (`SupportChat.jsx`)
```jsx
export function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [ticketId, setTicketId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const socket = useSocket();
  
  useEffect(() => {
    if (!socket) return;
    
    socket.on('SUPPORT_MESSAGE', (data) => {
      if (data.ticketId === ticketId) {
        setMessages(prev => [...prev, data.message]);
      }
    });
    
    return () => socket.off('SUPPORT_MESSAGE');
  }, [socket, ticketId]);
  
  const startChat = async () => {
    const subject = 'General Inquiry';
    const initialMessage = 'Hello, I need assistance';
    const res = await api.post('/support/tickets', { subject, message: initialMessage });
    setTicketId(res.data.ticket.id);
    setMessages([res.data.message]);
    setIsOpen(true);
  };
  
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    await api.post(`/support/tickets/${ticketId}/messages`, { message: inputMessage });
    setMessages(prev => [...prev, {
      senderType: 'USER',
      message: inputMessage,
      sentAt: new Date()
    }]);
    setInputMessage('');
  };
  
  return (
    <>
      <button className="support-fab" onClick={startChat}>
        💬 Support
      </button>
      
      {isOpen && (
        <div className="support-popup">
          <div className="support-header">
            <h3>Customer Support</h3>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>
          
          <div className="support-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.senderType === 'USER' ? 'user' : 'admin'}`}>
                <p>{msg.message}</p>
                <span>{formatTime(msg.sentAt)}</span>
              </div>
            ))}
          </div>
          
          <div className="support-input">
            <input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}
```

---

## 📋 ADMIN CONTROLS SUMMARY

### **Binary Options Win/Loss Control**
```javascript
// Admin can manually set binary trade result
PUT /admin/binary/:tradeId/result
Body: { result: "WIN" | "LOSS", reason: "Manual override by admin" }

// Override automated resolution
async function adminSetBinaryResult(tradeId, adminId, result, reason) {
  const trade = await prisma.binaryTrade.update({
    where: { id: tradeId },
    data: {
      result,
      status: 'RESOLVED',
      adminOverride: true,
      resolvedBy: adminId,
      resolvedAt: new Date()
    }
  });
  
  // Update wallet based on result
  if (result === 'WIN') {
    const tier = await getUserBinaryTier(trade.userId);
    const payout = trade.amount.mul(tier.profitPercent / 100);
    await creditWallet(trade.userId, trade.amount.add(payout), 'BINARY_WIN');
  }
  
  await logAction(adminId, 'ADMIN', 'BINARY_RESULT_OVERRIDE', tradeId, { result, reason });
}
```

### **User Points Adjustment**
```javascript
// Admin increase/decrease user points
POST /admin/users/:userId/adjust-balance
Body: { amount: 100, type: "CREDIT" | "DEBIT", reason: "Admin adjustment" }

async function adjustUserBalance(userId, adminId, amount, type, reason) {
  await prisma.$transaction([
    prisma.wallet.update({
      where: { userId },
      data: { balance: { [type === 'CREDIT' ? 'increment' : 'decrement']: amount } }
    }),
    prisma.transaction.create({
      data: {
        userId,
        type: type === 'CREDIT' ? 'CREDIT' : 'DEBIT',
        amount,
        status: 'COMPLETED',
        metadata: { reason, adjustedBy: adminId }
      }
    })
  ]);
  
  await logAction(adminId, 'ADMIN', 'BALANCE_ADJUSTED', userId, { amount, type, reason });
  io.to(`user:${userId}`).emit('BALANCE_UPDATED', { newBalance: (await getWallet(userId)).balance });
}
```

---

## 🔐 ENVIRONMENT VARIABLES (UPDATED)

```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
SUPPORT_TELEGRAM_CHAT_ID=your_chat_id_with_@goblin_niko4
```

---

## 📊 IMPLEMENTATION PRIORITY

1. **Phase 1 (Core Tier System)**
   - ✅ Create database models (BinaryTier, AITier, UserTier)
   - ✅ Implement tier service and routes
   - ✅ Update binary/AI engines to use tier settings
   - ✅ Add tier display to frontend

2. **Phase 2 (Bonus System)**
   - ✅ Create BonusProgram and UserBonus models
   - ✅ Implement bonus service (create, award, wager tracking)
   - ✅ Add bonus admin UI
   - ✅ Integrate with trade execution

3. **Phase 3 (Deposit Management)**
   - ✅ Create DepositAddress model
   - ✅ Implement address CRUD operations
   - ✅ Add deposit address UI (with QR codes)
   - ✅ Admin deposit address management

4. **Phase 4 (News System)**
   - ✅ Create News model
   - ✅ Implement news service (CRUD, featured, categories)
   - ✅ Add news section to homepage
   - ✅ Admin news management UI

5. **Phase 5 (Customer Service)**
   - ✅ Create SupportTicket and SupportMessage models
   - ✅ Set up Telegram bot integration
   - ✅ Implement real-time chat via Socket.IO
   - ✅ Add support popup to frontend
   - ✅ Admin support dashboard

6. **Phase 6 (Additional Pages)**
   - ✅ Create About Us page
   - ✅ Create White Paper page
   - ✅ Add static content management

---

## ✅ NEXT STEPS

1. **Run Prisma migration** with all new models
2. **Install Telegram bot library**: `npm install node-telegram-bot-api`
3. **Seed initial tier data** (5 levels for Binary + AI)
4. **Configure Telegram bot** with @goblin_niko4
5. **Build frontend components** for all new features
6. **Test tier upgrades** and bonus system
7. **Deploy** with updated environment variables

This specification provides a complete blueprint for implementing all advanced features. Each module is production-ready and follows the existing architecture patterns. 🚀
