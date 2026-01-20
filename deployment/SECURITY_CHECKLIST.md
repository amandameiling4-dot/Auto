# 🔒 Production Security Hardening Checklist

## ✅ Pre-Deployment Security

### Environment Configuration
- [ ] All `CHANGE_THIS` values in `.env` replaced with strong secrets
- [ ] JWT_SECRET is 64+ character random string (never reused)
- [ ] Database password is 20+ characters with special characters
- [ ] Master admin password changed immediately after creation
- [ ] `.env` file permissions set to `600` (chmod 600 .env)
- [ ] `.env` added to `.gitignore` (never committed)
- [ ] No hardcoded secrets in source code

### Database Security
- [ ] PostgreSQL configured to allow local connections only
- [ ] Database user has minimal required permissions
- [ ] Database backups encrypted
- [ ] Database audit logging enabled
- [ ] Connection pooling configured
- [ ] Prepared statements used (SQL injection prevention)

### API Security
- [ ] CORS restricted to production domain only
- [ ] Rate limiting enabled on all routes
- [ ] Stricter limits on login endpoint (5 requests/minute)
- [ ] JWT tokens expire in reasonable time (12-24 hours)
- [ ] Request size limits enforced (10MB max)
- [ ] Request timeout configured (30 seconds)

### Authentication & Authorization
- [ ] Passwords hashed with bcrypt (12+ rounds)
- [ ] No password length limits (allow long passwords)
- [ ] Account lockout after 5 failed login attempts
- [ ] Session cookies HTTP-only and secure
- [ ] Role-based access control enforced on all routes
- [ ] JWT validation on every protected endpoint

---

## 🚫 Production Rules (STRICTLY ENFORCED)

### ❌ NEVER in Production

#### Test Data
- ❌ No mock market feeds
- ❌ No test user accounts with weak passwords
- ❌ No dummy transaction data
- ❌ No simulated balance credits
- ❌ No hardcoded test API keys

#### Development Features
- ❌ No debug mode enabled
- ❌ No console.log in production code
- ❌ No source maps exposed to public
- ❌ No development dependencies in production
- ❌ No hot reload or watch mode

#### Client-Side Operations
- ❌ NO client-side balance calculations
- ❌ NO client-side trade settlement
- ❌ NO client-side transaction approval
- ❌ NO client-side PnL calculations
- ❌ NO client-side wallet updates

**Rule:** ALL financial operations MUST be server-side, atomic, and logged.

---

## ✅ Server-Side Only Operations

### Trading
```javascript
// ✅ CORRECT: Server calculates and settles
const pnl = calculatePnL(trade, marketPrice);  // Backend
await updateWalletBalance(userId, pnl);        // Atomic TX
await createAuditLog(...);                     // Logged

// ❌ WRONG: Client sends calculated PnL
// Frontend: const pnl = entryPrice - exitPrice;
// Frontend: axios.post('/trade/close', { pnl });
```

### Balance Updates
```javascript
// ✅ CORRECT: Admin triggers, server executes
async creditBalance(userId, amount, reason) {
  await prisma.$transaction([
    prisma.wallet.update({ where: { userId }, data: { balance: { increment: amount } } }),
    prisma.transaction.create({ data: { userId, amount, type: 'CREDIT', status: 'COMPLETED' } }),
    prisma.auditLog.create({ data: { actorId, action: 'BALANCE_CREDITED', target: userId } })
  ]);
}

// ❌ WRONG: Client sets balance directly
// Frontend: setBalance(balance + amount);
```

### Transaction Settlement
```javascript
// ✅ CORRECT: All validation and settlement on server
async approveTransaction(txId, adminId) {
  const tx = await prisma.transaction.findUnique({ where: { id: txId } });
  const user = await prisma.user.findUnique({ where: { id: tx.userId }, include: { wallet: true } });
  
  // Server validates
  if (user.status === 'FROZEN') throw new Error('User frozen');
  if (user.wallet.locked) throw new Error('Wallet locked');
  if (tx.type === 'WITHDRAWAL' && tx.amount > user.wallet.balance) {
    throw new Error('Insufficient balance');
  }
  
  // Server settles atomically
  await prisma.$transaction([...]);
}

// ❌ WRONG: Client performs validation
// if (user.status === 'ACTIVE') { /* approve */ }
```

---

## 🔐 Admin Actions Logging

### Every Admin Action MUST:
1. ✅ Create AuditLog entry with:
   - `actorId`: Admin/Master who performed action
   - `actorRole`: 'ADMIN' or 'MASTER'
   - `action`: Descriptive action type
   - `target`: Affected resource (userId, txId, etc.)
   - `metadata`: Contextual data (reason, old value, new value)
   - `timestamp`: Precise action time

2. ✅ Emit Socket.IO event to master panel:
   ```javascript
   io.to('master').emit('ADMIN_ACTION', {
     adminId,
     action: 'USER_FROZEN',
     target: userId,
     metadata: { reason },
     timestamp: new Date()
   });
   ```

3. ✅ Notify affected user (if applicable):
   ```javascript
   io.to(`user:${userId}`).emit('USER_FROZEN', {
     reason,
     freezedBy: adminId,
     timestamp: new Date()
   });
   ```

### Audit Log Retention
- ✅ Logs retained for 1 year minimum (regulatory compliance)
- ✅ Logs are immutable (no updates or deletes)
- ✅ Logs backed up daily
- ✅ Logs queryable by master only

---

## 👑 Master Override Authority

### Master Privileges
- ✅ Can disable any admin account
- ✅ Can view all admin actions in real-time
- ✅ Can override system settings
- ✅ Can trigger emergency shutdown
- ✅ Can unfreeze users frozen by admins
- ✅ Can modify system-wide limits

### Master Account Security
- [ ] Only ONE master account exists
- [ ] Master account uses 2FA (future enhancement)
- [ ] Master password is 30+ characters
- [ ] Master account never used for routine operations
- [ ] Master login attempts heavily rate-limited (1 per minute)
- [ ] Master login IP whitelisted (optional)

### Admin Limitations
- ❌ Admins CANNOT freeze master account
- ❌ Admins CANNOT view master credentials
- ❌ Admins CANNOT modify system settings
- ❌ Admins CANNOT disable other admins
- ❌ Admins CANNOT delete audit logs
- ❌ Admins CANNOT bypass transaction approval workflow

---

## 🛡️ Security Best Practices

### Input Validation
- [ ] All user inputs sanitized
- [ ] SQL injection prevention (use Prisma)
- [ ] XSS prevention (escape HTML)
- [ ] CSRF tokens on state-changing requests
- [ ] File upload validation (if applicable)

### Network Security
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] TLS 1.2+ only (no older protocols)
- [ ] Strong cipher suites configured
- [ ] HSTS header enabled
- [ ] Firewall rules: Allow 80, 443, 22 only

### Application Security
- [ ] No sensitive data in logs
- [ ] No stack traces sent to client
- [ ] Error messages are generic (no system details)
- [ ] Dependencies updated regularly (`npm audit`)
- [ ] Security headers configured (X-Frame-Options, CSP, etc.)

### Monitoring & Alerts
- [ ] Failed login attempts monitored
- [ ] Unusual transaction patterns detected
- [ ] High-value transactions flagged
- [ ] Admin actions monitored in real-time
- [ ] System resource usage monitored
- [ ] Database connection pool monitored

---

## 🚨 Incident Response

### If Breach Detected:
1. **Immediate**: Trigger emergency shutdown (master only)
2. **Within 1 hour**: Identify compromised accounts
3. **Within 4 hours**: Notify affected users
4. **Within 24 hours**: Full security audit
5. **Within 7 days**: Implement fixes and redeploy

### Emergency Contacts:
- Master Admin: master@onchainweb.app
- Security Team: security@onchainweb.app
- Hosting Provider: [provider support]

---

## 📋 Pre-Launch Checklist

### Infrastructure
- [ ] Domain DNS configured
- [ ] SSL certificate installed and auto-renew enabled
- [ ] Nginx configured and tested
- [ ] PM2 running with auto-restart
- [ ] Database migrations completed
- [ ] Database backups scheduled

### Application
- [ ] All environment variables set correctly
- [ ] Production API endpoints working
- [ ] Socket.IO connections working over HTTPS
- [ ] Real market data feeds connected (no test feeds)
- [ ] Cron jobs running (binary auto-resolution)
- [ ] Email notifications working (SMTP configured)

### Testing
- [ ] User registration/login working
- [ ] Binary options trading end-to-end tested
- [ ] Admin approval workflow tested
- [ ] Real-time Socket.IO events verified
- [ ] Balance updates atomic and logged
- [ ] Transaction settlement correct
- [ ] Load testing completed (expected concurrent users)

### Security Audit
- [ ] Penetration testing completed
- [ ] Security headers verified (securityheaders.com)
- [ ] SSL configuration tested (ssllabs.com)
- [ ] Rate limiting tested
- [ ] Authentication tested (password reset, lockout)
- [ ] Authorization tested (role-based access)

### Documentation
- [ ] Admin user guide created
- [ ] Master user guide created
- [ ] API documentation complete
- [ ] Deployment runbook written
- [ ] Disaster recovery plan documented

---

## 🔄 Post-Deployment Monitoring

### Daily Checks
- [ ] PM2 processes running
- [ ] Database connections healthy
- [ ] Market data feeds active
- [ ] Error logs reviewed
- [ ] Failed login attempts reviewed

### Weekly Checks
- [ ] Database backups verified
- [ ] Disk space usage checked
- [ ] SSL certificate expiry checked
- [ ] Dependency updates reviewed
- [ ] Performance metrics analyzed

### Monthly Checks
- [ ] Security audit logs reviewed
- [ ] User feedback analyzed
- [ ] System capacity planning
- [ ] Disaster recovery drill
- [ ] Security patches applied

---

## 🎯 Key Takeaways

### Critical Rules (NEVER VIOLATED):
1. ✅ **All settlements server-side** - Never trust client calculations
2. ✅ **Admin actions logged** - Every action in immutable AuditLog
3. ✅ **Master override only** - Master has final authority
4. ❌ **No test feeds in production** - Real market data only
5. ❌ **No mock balances** - Real financial data only
6. ❌ **No client-side math** - Server validates and calculates

### Success Criteria:
- ✅ Zero trust architecture (always validate)
- ✅ Defense in depth (multiple security layers)
- ✅ Fail secure (errors don't expose data)
- ✅ Audit everything (complete paper trail)
- ✅ Least privilege (users/admins have minimal permissions)

---

**⚠️ THIS IS A CUSTODIAL PLATFORM - USER FUNDS ARE YOUR RESPONSIBILITY**

Every line of code must treat user funds with extreme care. When in doubt, err on the side of caution. Security is not optional—it's the foundation of trust.
