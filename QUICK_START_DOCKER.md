# ⚡ Quick Start - Docker Deployment

## Get OnChainWeb running in 3 commands

---

## 🚀 One-Line Setup

```bash
./setup-monitoring.sh
```

That's it! The script will:
- ✅ Check Docker installation
- ✅ Install Node dependencies
- ✅ Generate secure JWT secret
- ✅ Create environment file
- ✅ Build all Docker images
- ✅ Start all 8 services
- ✅ Initialize database

---

## 📋 Manual Setup (Alternative)

If you prefer manual setup:

### **Step 1: Install Dependencies**
```bash
cd backend
npm install
cd ..
```

### **Step 2: Configure Environment**
```bash
cp .env.docker .env

# Generate JWT secret
openssl rand -base64 64 | tr -d '\n'

# Edit .env and paste the secret
nano .env
```

### **Step 3: Build & Start**
```bash
# Build all images
docker compose build

# Start services
docker compose up -d

# Initialize database
docker compose exec api npx prisma migrate deploy
```

---

## 🌐 Access Services

After setup, access the platform:

| Service | URL | Credentials |
|---------|-----|-------------|
| **Backend API** | http://localhost:3000 | - |
| **Public App** | http://localhost:8080 | Register new account |
| **Admin Panel** | http://localhost:8081 | Create via seed |
| **Master Panel** | http://localhost:8082 | Create via seed |
| **Prometheus** | http://localhost:9090 | - |
| **Grafana** | http://localhost:3001 | admin / admin123 |

---

## 🔍 Verify Installation

### **1. Check Services**
```bash
docker compose ps
```

All services should show "healthy" status.

### **2. Test API**
```bash
# Health check
curl http://localhost:3000/health

# Expected: {"status":"healthy","timestamp":"..."}
```

### **3. Test Metrics**
```bash
curl http://localhost:3000/metrics
```

Should return Prometheus metrics.

### **4. Test Frontend**
```bash
# Public app
curl -I http://localhost:8080

# Expected: HTTP/1.1 200 OK
```

---

## 📊 View Monitoring

### **Prometheus**
1. Open http://localhost:9090
2. Go to "Status" → "Targets"
3. Verify all targets are "UP"
4. Try query: `rate(http_requests_total[5m])`

### **Grafana**
1. Open http://localhost:3001
2. Login: admin / admin123
3. Go to "Dashboards"
4. Open "OnChainWeb Platform Overview"
5. View real-time metrics

---

## 🚨 Check Alerts

### **View Active Alerts**
```bash
# Prometheus alerts
curl http://localhost:9090/api/v1/alerts
```

### **Trigger Test Alert**
```bash
# Generate errors to trigger HighErrorRate alert
for i in {1..100}; do
  curl http://localhost:3000/nonexistent
done

# Check Prometheus alerts after 5 minutes
```

---

## 🔧 Common Commands

### **Container Management**
```bash
# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f api

# Restart service
docker compose restart api

# Stop all services
docker compose down

# Start all services
docker compose up -d

# Rebuild and restart
docker compose up -d --build
```

### **Database Management**
```bash
# Access database
docker compose exec db psql -U onchain -d onchainweb

# Run migrations
docker compose exec api npx prisma migrate deploy

# Seed database
docker compose exec api npx prisma db seed

# Backup database
docker compose exec db pg_dump -U onchain onchainweb > backup.sql
```

### **Monitoring**
```bash
# View metrics
curl http://localhost:3000/metrics | grep http_requests_total

# Check Prometheus config
docker compose exec prometheus cat /etc/prometheus/prometheus.yml

# Reload Prometheus config
curl -X POST http://localhost:9090/-/reload
```

---

## 🐛 Troubleshooting

### **Service won't start**
```bash
# Check logs
docker compose logs service-name

# Check health
docker compose ps

# Restart service
docker compose restart service-name
```

### **Database connection error**
```bash
# Check database is running
docker compose ps db

# Check database logs
docker compose logs db

# Verify connection string
docker compose exec api printenv | grep DATABASE_URL
```

### **Port already in use**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### **Metrics not showing in Grafana**
```bash
# Check Prometheus is scraping
curl http://localhost:9090/api/v1/targets

# Check metrics endpoint
curl http://localhost:3000/metrics

# Restart Grafana
docker compose restart grafana
```

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change all default passwords in `.env`
- [ ] Generate new JWT_SECRET (64+ characters)
- [ ] Set strong GRAFANA_PASSWORD
- [ ] Set strong DB_PASSWORD
- [ ] Configure firewall (allow only necessary ports)
- [ ] Enable HTTPS (use reverse proxy with SSL)
- [ ] Set up backup schedule
- [ ] Configure alert notifications (Slack/Email)
- [ ] Review Prometheus alert rules
- [ ] Test rollback procedure
- [ ] Document admin credentials securely

---

## 📚 Next Steps

1. **Create Test Users**
   ```bash
   docker compose exec api node scripts/create-test-users.js
   ```

2. **Configure CI/CD**
   - Set up GitHub secrets (SSH_HOST, SSH_USER, SSH_PRIVATE_KEY)
   - Push to main branch to trigger deployment

3. **Set Up Alerts**
   - Configure Alertmanager (Slack/Email)
   - Test alert notifications

4. **Customize Dashboards**
   - Add custom Grafana panels
   - Set up team-specific views

5. **Production Deployment**
   - Follow `DOCKER_DEPLOYMENT.md`
   - Configure Nginx reverse proxy
   - Set up SSL with Let's Encrypt

---

## 📖 Full Documentation

- **Docker Deployment**: [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)
- **Monitoring Guide**: [MONITORING_GUIDE.md](MONITORING_GUIDE.md)
- **Part 3 Summary**: [PART3_COMPLETE.md](PART3_COMPLETE.md)
- **GitHub Actions**: [.github/workflows/deploy.yml](.github/workflows/deploy.yml)

---

**⚡ Need help? Check the troubleshooting section or open an issue on GitHub.**
