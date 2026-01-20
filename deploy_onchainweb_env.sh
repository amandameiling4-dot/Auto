#!/bin/bash
# Advanced multi-environment deployment script for OnChainWeb (Ubuntu)

# -------------------------
# 0. Usage
# -------------------------
# ./deploy_onchainweb_env.sh <environment>
# Example: ./deploy_onchainweb_env.sh prod
ENVIRONMENT=$1
if [[ -z "$ENVIRONMENT" ]]; then
  echo "Usage: $0 <environment> (prod/staging/test)"
  exit 1
fi

# -------------------------
# 1. Environment-specific config
# -------------------------
case $ENVIRONMENT in
  prod)
    PUBLIC_DOMAIN="public.example.com"
    ADMIN_DOMAIN="admin.example.com"
    DB_NAME="onchaindb"
    DB_USER="onchainuser"
    DB_PASS="onchainpass"
    ;;
  staging)
    PUBLIC_DOMAIN="staging-public.example.com"
    ADMIN_DOMAIN="staging-admin.example.com"
    DB_NAME="onchaindb_staging"
    DB_USER="onchainuser_staging"
    DB_PASS="onchainpass_staging"
    ;;
  test)
    PUBLIC_DOMAIN="test-public.example.com"
    ADMIN_DOMAIN="test-admin.example.com"
    DB_NAME="onchaindb_test"
    DB_USER="onchainuser_test"
    DB_PASS="onchainpass_test"
    ;;
  *)
    echo "Invalid environment. Use prod/staging/test."
    exit 1
    ;;
esac

echo "Deploying OnChainWeb [$ENVIRONMENT]"
echo "Public domain: $PUBLIC_DOMAIN"
echo "Admin domain: $ADMIN_DOMAIN"

# -------------------------
# 2. Update & Install tools
# -------------------------
sudo apt update
sudo apt install -y git curl build-essential nginx postgresql postgresql-contrib certbot python3-certbot-nginx

# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# -------------------------
# 3. PostgreSQL Setup
# -------------------------
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" || echo "Database $DB_NAME already exists"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" || echo "User $DB_USER already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# -------------------------
# 4. Clone App (if not exists)
# -------------------------
cd ~
if [ ! -d "Auto" ]; then
  git clone https://github.com/YOUR_GITHUB_REPO/Auto.git
fi
cd Auto

# -------------------------
# 5. Backend Setup
# -------------------------
cd backend
npm install

# Create environment file
cat > .env <<EOL
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
JWT_SECRET="super_secret_key_$ENVIRONMENT"
PORT=4000
EOL

# Prisma migrate
npx prisma migrate deploy

# Start backend with PM2
pm2 start src/index.ts --name "onchain-backend-$ENVIRONMENT" --watch --interpreter ./node_modules/.bin/ts-node || pm2 restart "onchain-backend-$ENVIRONMENT"
pm2 save
pm2 startup

# -------------------------
# 6. Frontend Setup
# -------------------------
# Public App
cd ~/Auto/frontend-public
npm install
npm run build

# Admin App
cd ~/Auto/frontend-admin
npm install
npm run build

# -------------------------
# 7. Configure Nginx
# -------------------------
NGINX_CONF="/etc/nginx/sites-available/onchainweb_$ENVIRONMENT"
sudo tee $NGINX_CONF <<EOF
server {
    listen 80;
    server_name $PUBLIC_DOMAIN;

    root $HOME/Auto/frontend-public/dist;
    index index.html;

    location / {
        try_files \$uri /index.html;
    }

    location /socket.io/ {
        proxy_pass http://localhost:4000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
    }
}

server {
    listen 80;
    server_name $ADMIN_DOMAIN;

    root $HOME/Auto/frontend-admin/dist;
    index index.html;

    location / {
        try_files \$uri /index.html;
    }

    location /socket.io/ {
        proxy_pass http://localhost:4000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
    }
}
EOF

# Enable site
sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# -------------------------
# 8. Enable HTTPS (optional - requires valid domains)
# -------------------------
echo "To enable HTTPS, run:"
echo "sudo certbot --nginx -d $PUBLIC_DOMAIN -d $ADMIN_DOMAIN --non-interactive --agree-tos -m your-email@example.com"

echo "✅ [$ENVIRONMENT] Deployment complete!"
echo "Public App: http://$PUBLIC_DOMAIN (or https:// after certbot)"
echo "Admin App: http://$ADMIN_DOMAIN (or https:// after certbot)"
