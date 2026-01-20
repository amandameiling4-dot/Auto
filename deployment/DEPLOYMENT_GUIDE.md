# 🚀 Production Deployment Guide

## Overview

This guide covers the complete deployment process for OnChainWeb trading platform to a production server.

---

## 📋 Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04 LTS or 22.04 LTS
- **RAM**: Minimum 4GB (8GB recommended)
- **CPU**: 2+ cores
- **Storage**: 50GB+ SSD
- **Domain**: Configured with DNS pointing to server IP

### Required Software (will be installed by script)
- Node.js 18.x
- PostgreSQL 15
- Nginx
- Certbot (Let's Encrypt)
- PM2
- Git

---

## 🔧 Initial Server Setup

### 1. Connect to Server
```bash
ssh root@your-server-ip
```

### 2. Create Deploy User (Optional but Recommended)
```bash
adduser deploy
usermod -aG sudo deploy
su - deploy
```

### 3. Configure Firewall
```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 4. Set Hostname
```bash
sudo hostnamectl set-hostname onchainweb
```

---

## 🚀 Automated Deployment

### Method 1: Full Production Deployment (Recommended for First Deploy)

```bash
# 1. Clone repository
git clone https://github.com/amandameiling4-dot/Auto.git
cd Auto

# 2. Set database password
export DB_PASSWORD="your_strong_password_here"

# 3. Run deployment script
sudo ./deployment/deploy_production.sh
```

**This script will:**
- ✅ Install all dependencies (Node.js, PostgreSQL, Nginx, PM2, Certbot)
- ✅ Create and configure PostgreSQL database
- ✅ Build frontend applications
- ✅ Deploy frontend files to `/var/www/onchainweb/`
- ✅ Configure Nginx with SSL (Let's Encrypt)
- ✅ Start backend with PM2
- ✅ Set up database backups (daily at 2 AM)
- ✅ Configure log rotation
- ✅ Run health checks

**Duration**: ~15-20 minutes

### Method 2: Quick Deploy (For Updates)

```bash
# Use this for subsequent deployments after initial setup
sudo ./deployment/quick_deploy.sh
```

**This script will:**
- ✅ Pull latest code
- ✅ Install/update dependencies
- ✅ Run database migrations
- ✅ Build frontends
- ✅ Deploy frontend files
- ✅ Restart backend with zero downtime
- ✅ Reload Nginx

**Duration**: ~2-3 minutes

---

## 🔐 Post-Deployment Configuration

### 1. Configure Environment Variables

```bash
cd /var/www/onchainweb/backend

# Edit .env file
sudo nano .env
```

**Important variables to set:**
```bash
DATABASE_URL=postgresql://onchainweb_user:YOUR_PASSWORD@localhost:5432/onchainweb_prod
JWT_SECRET=<generate with: openssl rand -base64 64>
CORS_ORIGIN=https://onchainweb.app
BINANCE_API_KEY=your_real_api_key
BINANCE_API_SECRET=your_real_secret
```

See [`.env.production.template`](/.env.production.template) for all available options.

### 2. Create Master Admin Account

```bash
cd /var/www/onchainweb/backend
npx prisma studio
```

Or use SQL:
```sql
-- Connect to database
sudo -u postgres psql onchainweb_prod

-- Create master admin
INSERT INTO "Admin" (id, email, password, active, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'master@onchainweb.app',
  '$2b$12$HASHED_PASSWORD',  -- Use bcrypt to hash password
  true,
  NOW(),
  NOW()
);

-- Create master user
INSERT INTO "User" (id, email, password, role, status, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'master@onchainweb.app',
  '$2b$12$SAME_HASHED_PASSWORD',
  'MASTER',
  'ACTIVE',
  NOW(),
  NOW()
);
```

### 3. Verify Deployment

**Check Services:**
```bash
# Backend running?
pm2 status

# View logs
pm2 logs onchainweb-backend

# Nginx running?
sudo systemctl status nginx

# Database running?
sudo systemctl status postgresql

# Test API
curl https://onchainweb.app/health
```

**Expected Response:**
```
OK
```

**Test Frontend:**
- Public App: https://onchainweb.app
- Admin Panel: https://onchainweb.app/admin

### 4. Configure DNS

Add these records to your domain registrar:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_SERVER_IP | 300 |
| A | www | YOUR_SERVER_IP | 300 |
| CNAME | admin | onchainweb.app | 300 |

Wait 5-10 minutes for DNS propagation.

---

## 📊 Monitoring Setup

### PM2 Monitoring

```bash
# Real-time monitor
pm2 monit

# View logs
pm2 logs onchainweb-backend --lines 100

# Process status
pm2 status

# Memory usage
pm2 describe onchainweb-backend
```

### Nginx Logs

```bash
# Access log
sudo tail -f /var/log/nginx/onchainweb.access.log

# Error log
sudo tail -f /var/log/nginx/onchainweb.error.log
```

### Database Monitoring

```bash
# Check connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname='onchainweb_prod';"

# Database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('onchainweb_prod'));"

# Active queries
sudo -u postgres psql onchainweb_prod -c "SELECT pid, usename, application_name, client_addr, state, query FROM pg_stat_activity WHERE datname='onchainweb_prod';"
```

---

## 🔄 Update/Rollback Procedures

### Update to Latest Version

```bash
cd /var/www/onchainweb
sudo ./deployment/quick_deploy.sh
```

### Rollback to Previous Version

```bash
cd /var/www/onchainweb

# 1. Check git log
git log --oneline -10

# 2. Checkout previous commit
git checkout <commit-hash>

# 3. Rebuild and restart
sudo ./deployment/quick_deploy.sh
```

### Database Rollback

```bash
# List migrations
cd backend
npx prisma migrate status

# Rollback last migration
npx prisma migrate resolve --rolled-back <migration-name>
```

---

## 💾 Backup & Restore

### Manual Database Backup

```bash
# Backup
sudo -u postgres pg_dump onchainweb_prod > backup_$(date +%Y%m%d).sql

# Compress
gzip backup_$(date +%Y%m%d).sql

# Copy to safe location
scp backup_$(date +%Y%m%d).sql.gz user@backup-server:/backups/
```

### Restore Database

```bash
# Extract backup
gunzip backup_20260120.sql.gz

# Restore
sudo -u postgres psql onchainweb_prod < backup_20260120.sql
```

### Automated Backups

Backups run daily at 2 AM via cron (set up by deployment script).

**Check backup:**
```bash
ls -lh /var/backups/onchainweb/
```

---

## 🐛 Troubleshooting

### Backend Not Starting

```bash
# Check PM2 logs
pm2 logs onchainweb-backend --err

# Check environment variables
cd /var/www/onchainweb/backend
cat .env | grep -v PASSWORD

# Test database connection
cd backend
node -e "require('./src/database/prisma.js').prisma.\$connect().then(() => console.log('✓ DB Connected')).catch(console.error)"

# Restart manually
pm2 restart onchainweb-backend
```

### Nginx 502 Bad Gateway

```bash
# Check if backend is running
pm2 status

# Check Nginx error log
sudo tail -f /var/log/nginx/onchainweb.error.log

# Test backend directly
curl http://localhost:3000/health

# Restart Nginx
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Test SSL
curl https://onchainweb.app/health

# Renew certificate manually
sudo certbot renew --dry-run
sudo certbot renew --force-renewal

# Check certificate expiry
sudo certbot certificates
```

### Database Connection Errors

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
sudo -u postgres psql -c "\conninfo"

# Check database exists
sudo -u postgres psql -l | grep onchainweb

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Socket.IO Connection Failing

```bash
# Check WebSocket proxy in Nginx
sudo nginx -t

# Check if port 3000 is listening
sudo netstat -tlnp | grep 3000

# Test WebSocket connection
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" https://onchainweb.app/socket.io/

# Check CORS settings
grep CORS_ORIGIN /var/www/onchainweb/backend/.env
```

---

## 🔒 Security Hardening

After deployment, run through the [Security Checklist](SECURITY_CHECKLIST.md):

**Critical Items:**
- [ ] Change all default passwords
- [ ] Set strong JWT_SECRET
- [ ] Configure firewall (UFW)
- [ ] Set up fail2ban for SSH protection
- [ ] Enable PostgreSQL SSL connections
- [ ] Configure Nginx security headers
- [ ] Set up automated security updates
- [ ] Review audit logs regularly

---

## 📈 Performance Optimization

### Enable Gzip Compression (Nginx)

```nginx
# Add to /etc/nginx/nginx.conf
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
```

### Database Performance

```sql
-- Create indexes (if not exist)
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_wallet_userid ON "Wallet"("userId");
CREATE INDEX idx_transaction_userid ON "Transaction"("userId");
CREATE INDEX idx_transaction_status ON "Transaction"(status);
CREATE INDEX idx_trade_userid ON "Trade"("userId");
CREATE INDEX idx_binary_userid ON "BinaryTrade"("userId");
CREATE INDEX idx_binary_expiry ON "BinaryTrade"(expiry);

-- Analyze tables
ANALYZE;
```

### PM2 Cluster Mode

```bash
# Scale to use all CPU cores
pm2 scale onchainweb-backend max
```

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks

**Daily:**
- Check PM2 status: `pm2 status`
- Review error logs: `pm2 logs --err --lines 100`
- Check disk space: `df -h`

**Weekly:**
- Review audit logs (Master panel)
- Check database size
- Verify backups exist
- Update dependencies: `npm audit`

**Monthly:**
- Security updates: `sudo apt update && sudo apt upgrade`
- Review admin actions
- Capacity planning
- Performance analysis

### Contact Information

- Technical Support: tech@onchainweb.app
- Security Issues: security@onchainweb.app
- Master Admin: master@onchainweb.app

---

## 🎯 Success Criteria

Deployment is successful when:

✅ **Infrastructure:**
- PM2 shows backend running (status: online)
- Nginx returns 200 on https://onchainweb.app/health
- PostgreSQL accepting connections
- SSL certificate valid

✅ **Functionality:**
- Public app loads at https://onchainweb.app
- Admin panel loads at https://onchainweb.app/admin
- User can register and login
- Market prices update in real-time
- Binary trades can be placed
- Admin can approve transactions

✅ **Security:**
- All traffic over HTTPS
- Rate limiting active
- Security headers present
- Audit logs recording actions

✅ **Monitoring:**
- PM2 logs accessible
- Database backups scheduled
- Health checks passing

---

## 📚 Additional Resources

- [PM2 Commands](PM2_COMMANDS.md)
- [Security Checklist](SECURITY_CHECKLIST.md)
- [Environment Variables](.env.production.template)
- [Nginx Configuration](nginx/onchainweb.conf)
- [Frontend Testing Guide](../FRONTEND_TESTING_GUIDE.md)

---

**🎉 You're now running OnChainWeb in production!**

For any issues, check the troubleshooting section or contact support.
