#!/bin/bash

# Part 2 Implementation Verification Script
# Tests security middleware, rate limiting, and API functionality

echo "🔍 Part 2 Implementation Verification"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API URL
API_URL="http://localhost:3000"

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

echo "1️⃣ Testing Security Middleware"
echo "--------------------------------"

# Test Helmet Headers
echo -n "Testing Helmet headers... "
HELMET_HEADERS=$(curl -s -I $API_URL/health | grep -i "x-content-type-options\|x-frame-options\|strict-transport-security")
if [ -n "$HELMET_HEADERS" ]; then
    print_status 0 "Helmet headers present"
else
    print_status 1 "Helmet headers missing"
fi

# Test CORS
echo -n "Testing CORS configuration... "
CORS_HEADER=$(curl -s -I $API_URL/health -H "Origin: http://localhost:5173" | grep -i "access-control-allow-origin")
if [ -n "$CORS_HEADER" ]; then
    print_status 0 "CORS configured"
else
    print_status 1 "CORS not configured"
fi

echo ""
echo "2️⃣ Testing Rate Limiting"
echo "-------------------------"

# Test Auth Rate Limiter (max 5 requests)
echo -n "Testing auth rate limiter (5 req/min)... "
RATE_LIMITED=false
for i in {1..7}; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API_URL/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"test@test.com","password":"wrong"}')
    if [ "$HTTP_CODE" == "429" ]; then
        RATE_LIMITED=true
        break
    fi
done

if [ "$RATE_LIMITED" = true ]; then
    print_status 0 "Rate limiting working (got 429)"
else
    print_status 1 "Rate limiting not working (no 429 after 7 requests)"
fi

echo ""
echo "3️⃣ Testing API Endpoints"
echo "-------------------------"

# Test Health Endpoint
echo -n "Testing /health endpoint... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health)
if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "404" ]; then
    print_status 0 "Backend responding"
else
    print_status 1 "Backend not responding (HTTP $HTTP_CODE)"
fi

# Test Auth Endpoint Exists
echo -n "Testing /auth/login endpoint... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API_URL/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}')
if [ "$HTTP_CODE" == "400" ] || [ "$HTTP_CODE" == "401" ] || [ "$HTTP_CODE" == "200" ]; then
    print_status 0 "Auth endpoint available"
else
    print_status 1 "Auth endpoint not responding (HTTP $HTTP_CODE)"
fi

echo ""
echo "4️⃣ Checking File Structure"
echo "---------------------------"

# Check if security middleware files exist
FILES=(
    "backend/src/middleware/rateLimiter.js"
    "backend/src/middleware/security.js"
    "backend/src/master/master.controller.js"
    "backend/src/master/master.routes.js"
    "frontend-public/src/pages/Trade.jsx"
    "frontend-master/src/pages/Audit.jsx"
    "TEST_CASES_QA.md"
    "SECURITY_HARDENING_COMPLETE.md"
)

for FILE in "${FILES[@]}"; do
    if [ -f "$FILE" ]; then
        print_status 0 "$FILE exists"
    else
        print_status 1 "$FILE missing"
    fi
done

echo ""
echo "5️⃣ Checking Dependencies"
echo "-------------------------"

cd backend
echo -n "Checking express-rate-limit... "
if npm list express-rate-limit &>/dev/null; then
    print_status 0 "express-rate-limit installed"
else
    print_status 1 "express-rate-limit not installed"
fi

echo -n "Checking helmet... "
if npm list helmet &>/dev/null; then
    print_status 0 "helmet installed"
else
    print_status 1 "helmet not installed"
fi

cd ..

echo ""
echo "======================================"
echo "✅ Verification Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Start backend: cd backend && npm run dev"
echo "2. Start frontends: cd frontend-public && npm run dev (ports 5173, 5174, 5175)"
echo "3. Run test cases from TEST_CASES_QA.md"
echo "4. Review SECURITY_HARDENING_COMPLETE.md"
echo "5. Deploy using deployment/deploy_production.sh"
echo ""
