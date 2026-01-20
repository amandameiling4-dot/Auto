#!/bin/bash
# Quick Production Deployment Script
# Usage: sudo ./quick_deploy.sh

set -e

echo "🚀 Quick Deploy for OnChainWeb"
echo "================================"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Navigate to project root
cd "$(dirname "$0")/.."

# 1. Pull latest changes
echo "📥 Pulling latest code..."
git pull origin main

# 2. Backend setup
echo "🔧 Setting up backend..."
cd backend
npm install --production
npx prisma generate
npx prisma migrate deploy

# 3. Build frontends
echo "🎨 Building frontends..."
cd ../frontend-public
npm install
npm run build

cd ../frontend-admin
npm install
npm run build

# 4. Deploy frontend builds
echo "📦 Deploying frontend builds..."
sudo mkdir -p /var/www/onchainweb/{public,admin}
sudo cp -r ../frontend-public/dist/* /var/www/onchainweb/public/
sudo cp -r ../frontend-admin/dist/* /var/www/onchainweb/admin/
sudo chown -R www-data:www-data /var/www/onchainweb

# 5. Restart backend with PM2
echo "♻️  Restarting backend..."
cd ..
pm2 restart ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production
pm2 save

# 6. Reload Nginx
echo "🔄 Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Check status:"
echo "  pm2 status"
echo "  pm2 logs onchainweb-backend"
echo ""
