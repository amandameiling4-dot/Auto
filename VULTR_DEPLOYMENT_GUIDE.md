# 🌐 VULTR DEPLOYMENT GUIDE - Step by Step

## ⭐ Why Vultr?

- **Fast:** Deploy in 60 seconds
- **Global:** 32 datacenter locations worldwide
- **Cheap:** $48/month for 8GB RAM
- **Free Credit:** $300 for new accounts (30 days)
- **Perfect for:** Your trading platform (public + admin + master apps)

---

## 📋 STEP 1: CREATE VULTR ACCOUNT

1. **Go to:** https://www.vultr.com/promo/try300/
2. **Sign up** with email
3. **Verify email**
4. **Add payment method** (credit card - won't charge during free trial)
5. **Get $300 free credit** (valid for 30 days)

---

## 🖥️ STEP 2: DEPLOY UBUNTU 22.04 SERVER

### **Create Server:**

1. **Login to Vultr Dashboard:** https://my.vultr.com/
2. **Click:** "Deploy New Server" (big blue button)
3. **Choose Server Type:** 
   - Select: **Cloud Compute - Shared CPU**
4. **Choose Location:**
   - **Best for Global:** Singapore, Tokyo, or Los Angeles
   - **Best for US:** New York, Los Angeles, Dallas
   - **Best for EU:** Amsterdam, Frankfurt, London
   - **Best for Asia:** Singapore, Tokyo, Seoul
   - **Pick closest to your target users** for faster loading
5. **Choose Server Image:**
   - Operating System: **Ubuntu 22.04 LTS x64**
6. **Choose Server Size:**
   - Scroll to: **8 GB RAM / 4 vCPUs / 180 GB SSD**
   - Price: **$48/month**
   - This is perfect for your trading platform
7. **Additional Features** (OPTIONAL):
   - ✅ Enable IPv6 (FREE - check this box)
   - ✅ Enable Auto Backups ($4.80/month - RECOMMENDED)
   - ❌ Skip: DDOS Protection (expensive, not needed initially)
   - ❌ Skip: Cloud Firewall (we'll use UFW instead)
8. **Server Hostname & Label:**
   - Hostname: `trading-platform`
   - Label: `Production Server`
9. **Click:** "Deploy Now"

### **Wait for Deployment:**
- Takes 60-90 seconds
- Status will change: Pending → Installing → Running
- Green "Running" badge means ready!

---

## 🔑 STEP 3: GET SERVER ACCESS DETAILS

After server is "Running":

1. **Click on server name** in Vultr dashboard
2. **Copy these details:**
   ```
   IP Address: XXX.XXX.XXX.XXX
   Username: root
   Password: (click eye icon to reveal)
   ```
3. **Save credentials** somewhere safe!

### **Example:**
```
IP Address: 45.76.123.45
Username: root
Password: Zx9!kL2pQ7mN4vB
```

---

## 💻 STEP 4: CONNECT TO YOUR SERVER

### **Option A: Using Vultr Web Console (Easiest)**

1. In Vultr dashboard, click your server
2. Click **"View Console"** button (top right)
3. Browser-based terminal opens
4. Login with:
   - Username: `root`
   - Password: (paste password from dashboard)

### **Option B: Using SSH from Your Computer**

**Windows (PowerShell or CMD):**
```bash
ssh root@YOUR_SERVER_IP
# Example: ssh root@45.76.123.45
# Type 'yes' when asked about fingerprint
# Paste password
```

**Mac/Linux (Terminal):**
```bash
ssh root@YOUR_SERVER_IP
# Example: ssh root@45.76.123.45
# Type 'yes' when asked about fingerprint
# Paste password
```

---

## 🚀 STEP 5: DEPLOY YOUR TRADING PLATFORM

Once connected to server, run these commands:

### **A. Initial Server Setup**

```bash
# Update system
apt update && apt upgrade -y

# Install basic tools
apt install -y git curl wget nano

# Verify Ubuntu version
lsb_release -a
# Should show: Ubuntu 22.04.x LTS
```

### **B. Clone Your Repository**

```bash
# Clone your platform code
git clone https://github.com/amandameiling4-dot/Auto.git

# Enter directory
cd Auto

# Verify files
ls -la
# You should see: backend/ frontend-public/ frontend-admin/ deployment/
```

### **C. Run Automated Deployment**

```bash
# Make script executable
chmod +x deployment/quick_deploy.sh

# Run deployment (installs everything)
cd deployment
sudo ./quick_deploy.sh

# This installs:
# - Node.js 20
# - PostgreSQL 15
# - Redis 7
# - Nginx
# - PM2
# - Builds all frontends
# - Starts backend
# - Configures databases
```

**This takes 5-10 minutes.** You'll see:
```
🚀 Quick Deploy for OnChainWeb
================================
📥 Pulling latest code...
🔧 Setting up backend...
🎨 Building frontends...
📦 Deploying frontend builds...
♻️  Restarting backend...
✅ Deployment complete!
```

---

## 🌐 STEP 6: CONFIGURE YOUR DOMAIN

### **You Need 3 Subdomains:**
1. `yourdomain.com` → Public trading app
2. `admin.yourdomain.com` → Admin panel
3. `master.yourdomain.com` → Master control

### **DNS Configuration:**

**Go to your domain registrar** (Namecheap, GoDaddy, Cloudflare, etc.):

1. **Add A Record for Main Domain:**
   ```
   Type: A
   Host: @
   Value: YOUR_VULTR_SERVER_IP (e.g., 45.76.123.45)
   TTL: 300
   ```

2. **Add A Record for Admin:**
   ```
   Type: A
   Host: admin
   Value: YOUR_VULTR_SERVER_IP
   TTL: 300
   ```

3. **Add A Record for Master:**
   ```
   Type: A
   Host: master
   Value: YOUR_VULTR_SERVER_IP
   TTL: 300
   ```

**Wait 5-30 minutes** for DNS to propagate worldwide.

---

## 🔒 STEP 7: INSTALL SSL CERTIFICATES (HTTPS)

**Back in your Vultr server terminal:**

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificates for all 3 domains
certbot --nginx -d yourdomain.com -d admin.yourdomain.com -d master.yourdomain.com

# Follow prompts:
# - Enter email: your@email.com
# - Agree to terms: Y
# - Share email with EFF: N (optional)
# - Redirect HTTP to HTTPS: 2 (yes)
```

**SSL certificates installed!** They auto-renew every 90 days.

---

## ✅ STEP 8: VERIFY DEPLOYMENT

### **Check Backend:**
```bash
# Check PM2 status
pm2 status
# Should show: onchain-backend | online | 0 restarts

# Check backend logs
pm2 logs onchain-backend --lines 50
# Should NOT show errors

# Test backend API
curl http://localhost:4000/health
# Should return: {"status":"ok"}
```

### **Check Database:**
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# List databases
\l
# Should see: onchaindb

# Exit
\q
```

### **Check Nginx:**
```bash
# Test Nginx config
nginx -t
# Should show: syntax is ok, test is successful

# Check Nginx status
systemctl status nginx
# Should show: active (running)
```

### **Check Redis:**
```bash
# Test Redis
redis-cli ping
# Should return: PONG
```

---

## 🌍 STEP 9: ACCESS YOUR PLATFORM

Open browser and visit:

1. **Public App:** https://yourdomain.com
   - Should load trading platform
   - See login page
   - Live market data

2. **Admin Panel:** https://admin.yourdomain.com
   - Admin login page
   - Dashboard after login

3. **Master Panel:** https://master.yourdomain.com
   - Master admin login
   - System controls

---

## 🔐 STEP 10: SECURE YOUR SERVER

### **Set Up Firewall:**
```bash
# Install UFW
apt install -y ufw

# Allow SSH (IMPORTANT - don't lock yourself out!)
ufw allow 22/tcp

# Allow HTTP & HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable
# Type 'y' to confirm

# Check status
ufw status
```

### **Change Root Password:**
```bash
# Set strong password
passwd root
# Enter new password twice
```

### **Create Non-Root User:**
```bash
# Create new user
adduser deploy
# Enter password and details

# Add to sudo group
usermod -aG sudo deploy

# Test new user
su - deploy
sudo ls
# Should work without errors
```

### **Disable Root SSH (OPTIONAL - Advanced):**
```bash
# Only do this after testing deploy user!
nano /etc/ssh/sshd_config

# Change:
# PermitRootLogin yes
# To:
# PermitRootLogin no

# Save (Ctrl+O, Enter, Ctrl+X)

# Restart SSH
systemctl restart sshd
```

---

## 🛡️ STEP 11: ENABLE AUTO BACKUPS

### **In Vultr Dashboard:**

1. Click on your server
2. Go to **"Snapshots"** tab
3. Click **"Enable Automatic Backups"** 
4. Cost: $4.80/month (10% of server cost)
5. **Highly recommended!** Backs up daily automatically

### **Manual Backup:**
```bash
# Database backup script
cat > /root/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U postgres onchaindb > /root/backups/db_$DATE.sql
find /root/backups -name "db_*.sql" -mtime +7 -delete
EOF

chmod +x /root/backup-db.sh

# Create backups directory
mkdir -p /root/backups

# Add to crontab (runs daily at 2 AM)
crontab -e
# Add this line:
0 2 * * * /root/backup-db.sh
```

---

## 📊 STEP 12: MONITORING & LOGS

### **Monitor Backend:**
```bash
# Real-time logs
pm2 logs onchain-backend

# Restart if needed
pm2 restart onchain-backend

# Monitor resources
pm2 monit
```

### **Monitor Nginx:**
```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log
```

### **Monitor System Resources:**
```bash
# CPU, RAM, Disk usage
htop

# Install htop if missing
apt install -y htop
```

### **Check Disk Space:**
```bash
df -h
# Should have plenty of free space on 180GB SSD
```

---

## 🔧 TROUBLESHOOTING

### **Problem: Can't access website**

**Solution 1: Check DNS**
```bash
# Verify DNS resolution
nslookup yourdomain.com
# Should return your Vultr server IP
```

**Solution 2: Check Nginx**
```bash
# Test config
nginx -t

# Restart Nginx
systemctl restart nginx

# Check status
systemctl status nginx
```

**Solution 3: Check Firewall**
```bash
# Check if ports are open
ufw status
# Should show: 80/tcp, 443/tcp ALLOW
```

### **Problem: Backend not responding**

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs onchain-backend --lines 100

# Restart backend
pm2 restart onchain-backend

# If still not working, rebuild:
cd /root/Auto/backend
npm install
pm2 restart onchain-backend
```

### **Problem: Database connection error**

```bash
# Check PostgreSQL status
systemctl status postgresql

# Restart PostgreSQL
systemctl restart postgresql

# Check database exists
sudo -u postgres psql -l | grep onchaindb
```

### **Problem: SSL certificate error**

```bash
# Renew certificates
certbot renew

# Force renewal
certbot renew --force-renewal

# Check expiry dates
certbot certificates
```

---

## 💰 COST BREAKDOWN

| Service | Cost | Notes |
|---------|------|-------|
| **Vultr Server (8GB)** | $48/month | Free first 30 days ($300 credit) |
| **Auto Backups** | $4.80/month | Optional but recommended |
| **Domain Name** | $10-15/year | One-time annual cost |
| **SSL Certificates** | FREE | Let's Encrypt (auto-renews) |
| **Bandwidth** | FREE | 4TB included with server |
| **TOTAL** | **~$53/month** | After free trial ends |

---

## 📱 VULTR MOBILE APP

Monitor your server from phone:

- **iOS:** https://apps.apple.com/app/vultr/id1480449857
- **Android:** https://play.google.com/store/apps/details?id=com.vultr.vultr

Can view:
- Server status
- CPU/RAM usage
- Bandwidth
- Restart server
- View console

---

## 🎯 QUICK COMMAND REFERENCE

```bash
# Check all services status
pm2 status              # Backend
systemctl status nginx  # Web server
systemctl status postgresql  # Database
redis-cli ping          # Cache

# Restart services
pm2 restart all
systemctl restart nginx
systemctl restart postgresql
systemctl restart redis

# View logs
pm2 logs onchain-backend --lines 100
tail -f /var/log/nginx/error.log
journalctl -u postgresql -n 50

# Update platform code
cd /root/Auto
git pull origin main
cd deployment
./quick_deploy.sh

# Backup database
pg_dump -U postgres onchaindb > backup_$(date +%Y%m%d).sql

# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
ps aux | grep node
```

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] Vultr account created ($300 free credit)
- [ ] Ubuntu 22.04 server deployed (8GB RAM)
- [ ] Connected via SSH
- [ ] Repository cloned
- [ ] Deployment script executed
- [ ] All services running (PM2, Nginx, PostgreSQL, Redis)
- [ ] Domain DNS configured (3 A records)
- [ ] SSL certificates installed
- [ ] Firewall configured (UFW)
- [ ] Auto backups enabled
- [ ] Root password changed
- [ ] Non-root user created
- [ ] Platform accessible via HTTPS
- [ ] Admin panel working
- [ ] Master panel working

---

## 🆘 NEED HELP?

**Common Issues:**

1. **"Connection refused"**
   - Check firewall: `ufw status`
   - Check Nginx: `systemctl status nginx`

2. **"502 Bad Gateway"**
   - Backend not running: `pm2 status`
   - Restart backend: `pm2 restart onchain-backend`

3. **"Database connection error"**
   - Check PostgreSQL: `systemctl status postgresql`
   - Check credentials in `.env` file

4. **"SSL certificate error"**
   - DNS not propagated yet (wait 30 min)
   - Run certbot again: `certbot --nginx -d yourdomain.com`

---

## 🎉 SUCCESS!

**Your trading platform is now live on Vultr!**

- ✅ Public app running
- ✅ Admin panel accessible
- ✅ Master control working
- ✅ HTTPS enabled
- ✅ Auto backups configured
- ✅ Secure firewall active

**Next Steps:**
1. Configure hidden admin paths (see STEALTH_ADMIN_SYSTEM.md)
2. Set up Telegram bot integration
3. Configure payment gateways
4. Add trading instruments
5. Test all features thoroughly

---

**Your Vultr server IP:** _____________  
**Your domain:** _____________  
**Deployment date:** _____________  

🚀 **Platform is ready for production!**
