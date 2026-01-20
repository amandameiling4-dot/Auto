# 🐳 Docker Deployment Guide - OnChainWeb Platform

## Complete containerized deployment with monitoring

---

## 📦 What's Included

### **Services (8 containers)**
1. **api** - Backend API (Node.js + Express)
2. **frontend-public** - Public app (React + Nginx)
3. **frontend-admin** - Admin panel (React + Nginx)
4. **frontend-master** - Master panel (React + Nginx)
5. **db** - PostgreSQL 15 database
6. **redis** - Redis cache
7. **prometheus** - Metrics collection
8. **grafana** - Monitoring dashboards

---

## 🚀 Quick Start

### **1. Prerequisites**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

---

### **2. Environment Configuration**
```bash
# Copy environment template
cp .env.docker .env

# Generate JWT secret
echo "JWT_SECRET=$(openssl rand -base64 64)" >> .env

# Edit .env with your values
nano .env
```

**Required variables:**
```bash
DB_NAME=onchainweb
DB_USER=onchain
DB_PASSWORD=<strong_password>
JWT_SECRET=<64_character_secret>
CORS_ORIGIN=https://onchainweb.app
```

---

### **3. Build and Start**
```bash
# Build all images
docker compose build

# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Check status
docker compose ps
```

---

### **4. Initialize Database**
```bash
# Run migrations
docker compose exec api npx prisma migrate deploy

# Seed database (create test users)
docker compose exec api node /app/create-users.js

# Verify database
docker compose exec db psql -U onchain -d onchainweb -c "\dt"
```

---

## 🌐 Access Services

| Service | URL | Description |
|---------|-----|-------------|
| **Backend API** | http://localhost:3000 | API endpoints |
| **Public App** | http://localhost:8080 | User interface |
| **Admin Panel** | http://localhost:8081 | Admin interface |
| **Master Panel** | http://localhost:8082 | Master interface |
| **Prometheus** | http://localhost:9090 | Metrics |
| **Grafana** | http://localhost:3001 | Dashboards |
| **PostgreSQL** | localhost:5432 | Database |
| **Redis** | localhost:6379 | Cache |

---

## 📊 Monitoring

### **Prometheus Metrics**
Visit http://localhost:9090

**Key metrics:**
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Response times
- `websocket_connections_active` - Active WebSocket connections
- `trades_open_count` - Open trades
- `wallet_balance_total` - Total platform balance
- `admin_actions_total` - Admin actions
- `failed_login_attempts_total` - Failed logins

---

### **Grafana Dashboards**
Visit http://localhost:3001

**Default credentials:**
- Username: `admin`
- Password: `admin123` (change in .env)

**Pre-configured dashboards:**
1. **OnChainWeb Platform Overview**
   - HTTP requests per second
   - API response times
   - Active WebSocket connections
   - Open trades count
   - Total wallet balance
   - Failed login attempts
   - Trades per minute
   - Admin actions
   - Error rates
   - System resources (CPU, memory)

---

## 🔧 Management Commands

### **Container Management**
```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Restart specific service
docker compose restart api

# View logs
docker compose logs -f api

# Execute command in container
docker compose exec api npm run migrate

# Shell access
docker compose exec api sh
```

---

### **Database Management**
```bash
# Backup database
docker compose exec db pg_dump -U onchain onchainweb > backup.sql

# Restore database
cat backup.sql | docker compose exec -T db psql -U onchain onchainweb

# Access PostgreSQL
docker compose exec db psql -U onchain -d onchainweb

# View tables
docker compose exec db psql -U onchain -d onchainweb -c "\dt"
```

---

### **Scaling**
```bash
# Scale API to 3 instances
docker compose up -d --scale api=3

# Scale with load balancer (Nginx)
# Edit nginx.conf upstream block
```

---

## 🔍 Health Checks

All services include health checks:

```bash
# Check API health
curl http://localhost:3000/health

# Check frontend health
curl http://localhost:8080/health

# View health status
docker compose ps
```

**Expected output:**
```
NAME                   STATUS              PORTS
onchainweb-api         Up (healthy)        0.0.0.0:3000->3000/tcp
onchainweb-public      Up (healthy)        0.0.0.0:8080->80/tcp
onchainweb-admin       Up (healthy)        0.0.0.0:8081->80/tcp
onchainweb-master      Up (healthy)        0.0.0.0:8082->80/tcp
onchainweb-db          Up (healthy)        0.0.0.0:5432->5432/tcp
onchainweb-redis       Up (healthy)        0.0.0.0:6379->6379/tcp
onchainweb-prometheus  Up                  0.0.0.0:9090->9090/tcp
onchainweb-grafana     Up                  0.0.0.0:3001->3000/tcp
```

---

## 🚨 Troubleshooting

### **Issue: Services won't start**
```bash
# Check logs
docker compose logs

# Check disk space
df -h

# Clean up old images
docker system prune -a
```

---

### **Issue: Database connection error**
```bash
# Wait for database to be ready
docker compose logs db

# Check database health
docker compose exec db pg_isready -U onchain

# Restart database
docker compose restart db
```

---

### **Issue: Port already in use**
```bash
# Check what's using the port
sudo lsof -i :3000

# Edit docker-compose.yml to use different ports
ports:
  - "3001:3000"  # Change external port
```

---

### **Issue: Out of memory**
```bash
# Check container resources
docker stats

# Increase Docker memory limit
# Docker Desktop: Settings > Resources > Memory
```

---

## 🔐 Production Security

### **1. Change Default Passwords**
```bash
# PostgreSQL password
DB_PASSWORD=<strong_random_password>

# Grafana password
GRAFANA_PASSWORD=<strong_random_password>

# JWT secret
JWT_SECRET=$(openssl rand -base64 64)
```

---

### **2. Use Docker Secrets**
```yaml
# docker-compose.yml
services:
  api:
    secrets:
      - db_password
      - jwt_secret

secrets:
  db_password:
    file: ./secrets/db_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
```

---

### **3. Network Isolation**
```yaml
# Only expose necessary ports
services:
  db:
    ports: []  # Don't expose externally
    expose:
      - "5432"  # Internal only
```

---

### **4. Read-Only Filesystems**
```yaml
services:
  api:
    read_only: true
    tmpfs:
      - /tmp
      - /app/logs
```

---

## 📈 Performance Optimization

### **1. Build Caching**
```bash
# Use BuildKit for faster builds
export DOCKER_BUILDKIT=1
docker compose build
```

---

### **2. Multi-Stage Builds**
Already implemented in Dockerfiles:
- **Stage 1**: Build dependencies
- **Stage 2**: Runtime (smaller image)

---

### **3. Image Size Optimization**
```bash
# Check image sizes
docker images | grep onchainweb

# Expected sizes:
# backend: ~200MB
# frontend: ~50MB (nginx + static files)
```

---

## 🔄 Updates & Rollbacks

### **Update Services**
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose up -d --build

# Zero-downtime update (one service at a time)
docker compose up -d --no-deps --build api
docker compose up -d --no-deps --build frontend-public
```

---

### **Rollback**
```bash
# Revert code
git reset --hard HEAD~1

# Rebuild and restart
docker compose up -d --force-recreate
```

---

## 📦 Backup & Restore

### **Automated Backup Script**
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
docker compose exec -T db pg_dump -U onchain onchainweb | gzip > backup_db_$DATE.sql.gz

# Backup volumes
docker run --rm -v onchainweb_pgdata:/data -v $(pwd):/backup alpine tar czf /backup/backup_pgdata_$DATE.tar.gz /data

# Keep last 7 days
find . -name "backup_*" -mtime +7 -delete

echo "Backup complete: backup_db_$DATE.sql.gz"
```

---

### **Restore from Backup**
```bash
# Stop services
docker compose down

# Restore database
gunzip -c backup_db_20260120.sql.gz | docker compose exec -T db psql -U onchain onchainweb

# Restore volumes
docker run --rm -v onchainweb_pgdata:/data -v $(pwd):/backup alpine tar xzf /backup/backup_pgdata_20260120.tar.gz -C /

# Start services
docker compose up -d
```

---

## 🌍 Production Deployment

### **1. Server Setup**
```bash
# SSH to production server
ssh user@onchainweb.app

# Clone repository
cd /apps
git clone https://github.com/your-org/onchainweb.git
cd onchainweb

# Copy production env
cp .env.production .env
```

---

### **2. SSL/TLS with Nginx**
```bash
# Create nginx proxy for SSL termination
# See deployment/nginx/onchainweb.conf

# Use Let's Encrypt
sudo certbot --nginx -d onchainweb.app -d www.onchainweb.app
```

---

### **3. Firewall Configuration**
```bash
# Allow only necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# Block direct access to containers
sudo ufw deny 3000/tcp  # Block direct API access
```

---

### **4. Monitoring Setup**
```bash
# Configure alert channels
# Edit deployment/prometheus/alertmanager.yml

# Set up Slack webhook
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Test alerts
curl -X POST http://localhost:9090/-/reload
```

---

## ✅ Deployment Checklist

- [ ] Environment variables configured
- [ ] JWT secret generated (64+ characters)
- [ ] Database password changed
- [ ] Grafana password changed
- [ ] SSL certificates installed
- [ ] Firewall configured
- [ ] Backups automated
- [ ] Monitoring dashboards configured
- [ ] Alert channels set up
- [ ] Health checks verified
- [ ] Log rotation configured
- [ ] Docker auto-restart enabled

---

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Redis Docker Hub](https://hub.docker.com/_/redis)

---

**✅ Docker deployment complete! All services containerized and monitored. 🐳**
