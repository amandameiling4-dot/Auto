#!/bin/bash

# 🔍 Docker Setup Verification Script
# Verifies all Part 3 components are correctly configured

# Don't exit on error - we want to count all failures
set +e

echo "🔍 OnChainWeb Part 3 Verification"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ $1${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ $1 (missing)${NC}"
        ((FAILED++))
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅ $1/${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ $1/ (missing)${NC}"
        ((FAILED++))
    fi
}

echo -e "${BLUE}1. Checking Docker Files...${NC}"
check_file "backend/Dockerfile"
check_file "backend/.dockerignore"
check_file "frontend-public/Dockerfile"
check_file "frontend-public/nginx.conf"
check_file "frontend-admin/Dockerfile"
check_file "frontend-admin/nginx.conf"
check_file "frontend-master/Dockerfile"
check_file "frontend-master/nginx.conf"
echo ""

echo -e "${BLUE}2. Checking Orchestration Files...${NC}"
check_file "docker-compose.yml"
check_file ".env.docker"
echo ""

echo -e "${BLUE}3. Checking CI/CD Files...${NC}"
check_file ".github/workflows/deploy.yml"
echo ""

echo -e "${BLUE}4. Checking Monitoring Files...${NC}"
check_file "backend/src/metrics.js"
check_file "deployment/prometheus/prometheus.yml"
check_file "deployment/prometheus/rules/alerts.yml"
check_dir "deployment/grafana/dashboards"
check_dir "deployment/grafana/datasources"
echo ""

echo -e "${BLUE}5. Checking Documentation...${NC}"
check_file "DOCKER_DEPLOYMENT.md"
check_file "MONITORING_GUIDE.md"
check_file "PART3_COMPLETE.md"
check_file "QUICK_START_DOCKER.md"
echo ""

echo -e "${BLUE}6. Checking Integration...${NC}"

# Check if prom-client is in package.json
if grep -q "prom-client" backend/package.json; then
    echo -e "${GREEN}✅ prom-client in package.json${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ prom-client not in package.json${NC}"
    ((FAILED++))
fi

# Check if metrics are imported in app.js
if grep -q "metrics.js" backend/src/app.js; then
    echo -e "${GREEN}✅ metrics.js imported in app.js${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ metrics.js not imported in app.js${NC}"
    ((FAILED++))
fi

# Check if /metrics endpoint exists in app.js
if grep -q "/metrics" backend/src/app.js; then
    echo -e "${GREEN}✅ /metrics endpoint in app.js${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ /metrics endpoint not in app.js${NC}"
    ((FAILED++))
fi

# Check if /health endpoint exists in app.js
if grep -q "/health" backend/src/app.js; then
    echo -e "${GREEN}✅ /health endpoint in app.js${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ /health endpoint not in app.js${NC}"
    ((FAILED++))
fi

echo ""

# Check docker-compose services
echo -e "${BLUE}7. Checking docker-compose.yml Services...${NC}"

SERVICES=("db" "redis" "api" "frontend-public" "frontend-admin" "frontend-master" "prometheus" "grafana")

for service in "${SERVICES[@]}"; do
    if grep -q "$service:" docker-compose.yml; then
        echo -e "${GREEN}✅ Service: $service${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ Service: $service (missing)${NC}"
        ((FAILED++))
    fi
done

echo ""

# Check Prometheus alert rules
echo -e "${BLUE}8. Checking Prometheus Alert Rules...${NC}"

ALERTS=("APIDown" "HighErrorRate" "DatabaseConnectionFailure" "MarketFeedDisconnected" "WalletBalanceMismatch" "AdminAbusePattern")

for alert in "${ALERTS[@]}"; do
    if [ -f "deployment/prometheus/rules/alerts.yml" ] && grep -q "$alert" deployment/prometheus/rules/alerts.yml; then
        echo -e "${GREEN}✅ Alert: $alert${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ Alert: $alert (missing)${NC}"
        ((FAILED++))
    fi
done

echo ""

# Test Docker installation
echo -e "${BLUE}9. Checking Docker Installation...${NC}"

if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker installed${NC}"
    ((PASSED++))
    docker --version
else
    echo -e "${RED}❌ Docker not installed${NC}"
    ((FAILED++))
fi

if command -v docker compose &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose installed${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Docker Compose not installed${NC}"
    ((FAILED++))
fi

echo ""

# Summary
echo "=========================================="
echo -e "${BLUE}Verification Summary${NC}"
echo "=========================================="
echo ""
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Part 3 is complete.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run: npm install (in backend/)"
    echo "2. Run: ./setup-monitoring.sh"
    echo "3. Access services at http://localhost:*"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please review the output above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "- Missing files: Re-run the setup script"
    echo "- Docker not installed: Visit https://docs.docker.com/get-docker/"
    exit 1
fi
