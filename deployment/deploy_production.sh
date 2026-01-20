#!/bin/bash
# Production Deployment Script
# Usage: ./deploy_production.sh

set -e  # Exit on error

echo "🚀 Starting OnChainWeb Production Deployment..."

# Configuration
DOMAIN="onchainweb.app"
APP_DIR="/var/www/onchainweb"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_PUBLIC_DIR="$APP_DIR/frontend-public"
FRONTEND_ADMIN_DIR="$APP_DIR/frontend-admin"
NGINX_CONF="/etc/nginx/sites-available/onchainweb"
DB_NAME="onchainweb_prod"
DB_USER="onchainweb_user"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}➜ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root (use sudo)"
    exit 1
fi

# 1. System Updates
print_info "Updating system packages..."
apt update && apt upgrade -y
print_success "System updated"

# 2. Install Dependencies
print_info "Installing required packages..."
apt install -y curl wget git nginx postgresql certbot python3-certbot-nginx ufw

# Install Node.js 18.x
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    print_success "Node.js installed"
else
    print_success "Node.js already installed ($(node -v))"
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    print_success "PM2 installed"
else
    print_success "PM2 already installed"
fi

# 3. PostgreSQL Setup
print_info "Configuring PostgreSQL..."
if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    sudo -u postgres psql <<EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
EOF
    print_success "Database created: $DB_NAME"
else
    print_success "Database already exists: $DB_NAME"
fi

# 4. Application Setup
print_info "Setting up application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# Clone or pull repository
if [ ! -d ".git" ]; then
    print_info "Cloning repository..."
    git clone https://github.com/amandameiling4-dot/Auto.git .
else
    print_info "Pulling latest changes..."
    git pull origin main
fi
print_success "Repository updated"

# 5. Backend Setup
print_info "Setting up backend..."
cd $BACKEND_DIR

# Create .env file
cat > .env <<EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
JWT_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=https://$DOMAIN
EOF
print_success ".env file created"

# Install dependencies
npm install --production
print_success "Backend dependencies installed"

# Run database migrations
npx prisma migrate deploy
print_success "Database migrations completed"

# Generate Prisma Client
npx prisma generate
print_success "Prisma client generated"

# 6. Frontend Builds
print_info "Building frontend applications..."

# Public App
cd $FRONTEND_PUBLIC_DIR
npm install
# Update API URL for production
cat > src/api.js <<EOF
export const API = "https://$DOMAIN/api";
EOF
npm run build
print_success "Public app built"

# Admin Panel
cd $FRONTEND_ADMIN_DIR
npm install
# Update API URL for production
cat > src/api.js <<EOF
export const API = "https://$DOMAIN/api";
EOF
npm run build
print_success "Admin panel built"

# 7. Deploy Built Files
print_info "Deploying frontend files..."
mkdir -p /var/www/onchainweb/{public,admin}
cp -r $FRONTEND_PUBLIC_DIR/dist/* /var/www/onchainweb/public/
cp -r $FRONTEND_ADMIN_DIR/dist/* /var/www/onchainweb/admin/
chown -R www-data:www-data /var/www/onchainweb
print_success "Frontend deployed"

# 8. Nginx Configuration
print_info "Configuring Nginx..."
cp deployment/nginx/onchainweb.conf $NGINX_CONF
ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
print_success "Nginx configured"

# 9. SSL Certificate
print_info "Setting up SSL certificate..."
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN
    print_success "SSL certificate obtained"
else
    print_success "SSL certificate already exists"
fi

# 10. Firewall Configuration
print_info "Configuring firewall..."
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable
print_success "Firewall configured"

# 11. PM2 Setup
print_info "Starting application with PM2..."
cd $APP_DIR
pm2 delete onchainweb-backend 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER
print_success "Application started with PM2"

# 12. Monitoring Setup
print_info "Setting up monitoring..."
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
print_success "Log rotation configured"

# 13. Create Systemd Service (Backup)
cat > /etc/systemd/system/onchainweb.service <<EOF
[Unit]
Description=OnChainWeb Backend Service
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=$BACKEND_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=onchainweb

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
print_success "Systemd service created"

# 14. Database Backup Setup
print_info "Setting up database backups..."
mkdir -p /var/backups/onchainweb
cat > /usr/local/bin/backup-onchainweb-db.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/onchainweb"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump onchainweb_prod > $BACKUP_DIR/backup_$DATE.sql
# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
EOF
chmod +x /usr/local/bin/backup-onchainweb-db.sh

# Add cron job for daily backups at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-onchainweb-db.sh") | crontab -
print_success "Database backups configured"

# 15. Health Check
print_info "Running health checks..."
sleep 5

# Check PM2 status
if pm2 describe onchainweb-backend &>/dev/null; then
    print_success "PM2 process running"
else
    print_error "PM2 process not running"
fi

# Check Nginx status
if systemctl is-active --quiet nginx; then
    print_success "Nginx running"
else
    print_error "Nginx not running"
fi

# Check PostgreSQL status
if systemctl is-active --quiet postgresql; then
    print_success "PostgreSQL running"
else
    print_error "PostgreSQL not running"
fi

# Check API health
if curl -f -s https://$DOMAIN/health &>/dev/null; then
    print_success "API health check passed"
else
    print_error "API health check failed"
fi

# 16. Final Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_success "DEPLOYMENT COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Public App:    https://$DOMAIN"
echo "🔐 Admin Panel:   https://$DOMAIN/admin"
echo "🔧 API Endpoint:  https://$DOMAIN/api"
echo ""
echo "Useful Commands:"
echo "  pm2 status                 - Check PM2 processes"
echo "  pm2 logs onchainweb        - View application logs"
echo "  pm2 restart onchainweb     - Restart application"
echo "  nginx -t                   - Test Nginx config"
echo "  systemctl status nginx     - Check Nginx status"
echo ""
print_info "Don't forget to:"
echo "  1. Create admin user via Prisma Studio"
echo "  2. Configure DNS records (A record to server IP)"
echo "  3. Set up monitoring alerts"
echo "  4. Configure backup notifications"
echo "  5. Review security settings"
echo ""
