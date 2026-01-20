#!/bin/bash

# 🚀 OnChainWeb Monitoring Setup Script
# Sets up Docker + CI/CD + Monitoring infrastructure

set -e

echo "🚀 OnChainWeb Monitoring Setup"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Docker installation
echo -e "${BLUE}1. Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker first.${NC}"
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi
echo -e "${GREEN}✅ Docker installed${NC}"

# Check Docker Compose
echo -e "${BLUE}2. Checking Docker Compose...${NC}"
if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not found.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose installed${NC}"

# Install Node dependencies
echo -e "${BLUE}3. Installing Node dependencies...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi
cd ..

# Create .env file if not exists
echo -e "${BLUE}4. Setting up environment variables...${NC}"
if [ ! -f ".env" ]; then
    cp .env.docker .env
    
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" .env
    
    echo -e "${GREEN}✅ Environment file created${NC}"
    echo -e "${BLUE}ℹ️  Please edit .env to set custom passwords${NC}"
else
    echo -e "${GREEN}✅ Environment file already exists${NC}"
fi

# Create required directories
echo -e "${BLUE}5. Creating required directories...${NC}"
mkdir -p backend/logs
mkdir -p deployment/prometheus/rules
mkdir -p deployment/grafana/dashboards
mkdir -p deployment/grafana/datasources
echo -e "${GREEN}✅ Directories created${NC}"

# Build Docker images
echo -e "${BLUE}6. Building Docker images (this may take a few minutes)...${NC}"
docker compose build
echo -e "${GREEN}✅ Docker images built${NC}"

# Start services
echo -e "${BLUE}7. Starting services...${NC}"
docker compose up -d
echo -e "${GREEN}✅ Services started${NC}"

# Wait for services to be healthy
echo -e "${BLUE}8. Waiting for services to be healthy...${NC}"
sleep 10

# Check service health
echo -e "${BLUE}9. Checking service health...${NC}"
docker compose ps

# Initialize database
echo -e "${BLUE}10. Initializing database...${NC}"
docker compose exec -T api npx prisma migrate deploy || echo "Database already migrated"
echo -e "${GREEN}✅ Database initialized${NC}"

# Show access URLs
echo ""
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "=========================================="
echo "🌐 Service URLs:"
echo "=========================================="
echo ""
echo "Backend API:     http://localhost:3000"
echo "Public App:      http://localhost:8080"
echo "Admin Panel:     http://localhost:8081"
echo "Master Panel:    http://localhost:8082"
echo ""
echo "Prometheus:      http://localhost:9090"
echo "Grafana:         http://localhost:3001"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "=========================================="
echo "🔍 Useful Commands:"
echo "=========================================="
echo ""
echo "View logs:       docker compose logs -f"
echo "Stop services:   docker compose down"
echo "Restart:         docker compose restart"
echo "Health check:    docker compose ps"
echo ""
echo "Metrics:         curl http://localhost:3000/metrics"
echo "Health:          curl http://localhost:3000/health"
echo ""
echo "=========================================="
echo ""
echo -e "${GREEN}🎉 OnChainWeb is now running!${NC}"
echo ""
