#!/bin/bash

###############################################################################
# PART 4 VERIFICATION SCRIPT
# Verifies Redis + Job Queues + KYC/AML Compliance Implementation
###############################################################################

echo "=========================================="
echo "🚀 PART 4 VERIFICATION - Redis + Queues + KYC/AML"
echo "=========================================="
echo ""

PASS_COUNT=0
FAIL_COUNT=0
TOTAL_CHECKS=20

function check_pass() {
    echo "✅ PASS: $1"
    ((PASS_COUNT++))
}

function check_fail() {
    echo "❌ FAIL: $1"
    ((FAIL_COUNT++))
}

###############################################################################
# 1. REDIS INFRASTRUCTURE
###############################################################################
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. REDIS INFRASTRUCTURE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Redis client file
if [ -f "backend/src/redis/redis.client.js" ]; then
    if grep -q "getRedisClient" backend/src/redis/redis.client.js && \
       grep -q "disconnectRedis" backend/src/redis/redis.client.js; then
        check_pass "Redis client module exists with getRedisClient() and disconnectRedis()"
    else
        check_fail "Redis client missing required functions"
    fi
else
    check_fail "Redis client file not found"
fi

# Check distributed lock file
if [ -f "backend/src/redis/distributed-lock.js" ]; then
    if grep -q "DistributedLock" backend/src/redis/distributed-lock.js && \
       grep -q "lockTrade" backend/src/redis/distributed-lock.js && \
       grep -q "lockWallet" backend/src/redis/distributed-lock.js; then
        check_pass "Distributed lock module exists with helper functions"
    else
        check_fail "Distributed lock missing required functions"
    fi
else
    check_fail "Distributed lock file not found"
fi

# Check Redis dependency
if grep -q "\"ioredis\"" backend/package.json; then
    check_pass "ioredis dependency added to package.json"
else
    check_fail "ioredis dependency not found"
fi

###############################################################################
# 2. JOB QUEUES (BULLMQ)
###############################################################################
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. JOB QUEUES (BULLMQ)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check binary queue
if [ -f "backend/src/queues/binary.queue.js" ]; then
    if grep -q "binaryQueue" backend/src/queues/binary.queue.js && \
       grep -q "scheduleBinaryResolution" backend/src/queues/binary.queue.js && \
       grep -q "binaryWorker" backend/src/queues/binary.queue.js; then
        check_pass "Binary options queue exists with scheduler and worker"
    else
        check_fail "Binary queue missing required components"
    fi
else
    check_fail "Binary queue file not found"
fi

# Check AI queue
if [ -f "backend/src/queues/ai.queue.js" ]; then
    if grep -q "aiQueue" backend/src/queues/ai.queue.js && \
       grep -q "scheduleRecurringAIScans" backend/src/queues/ai.queue.js && \
       grep -q "aiWorker" backend/src/queues/ai.queue.js; then
        check_pass "AI arbitrage queue exists with recurring scans"
    else
        check_fail "AI queue missing required components"
    fi
else
    check_fail "AI queue file not found"
fi

# Check KYC queue
if [ -f "backend/src/queues/kyc.queue.js" ]; then
    if grep -q "kycQueue" backend/src/queues/kyc.queue.js && \
       grep -q "scheduleKYCVerification" backend/src/queues/kyc.queue.js && \
       grep -q "kycWorker" backend/src/queues/kyc.queue.js; then
        check_pass "KYC verification queue exists with scheduler and worker"
    else
        check_fail "KYC queue missing required components"
    fi
else
    check_fail "KYC queue file not found"
fi

# Check email queue
if [ -f "backend/src/queues/email.queue.js" ]; then
    if grep -q "emailQueue" backend/src/queues/email.queue.js && \
       grep -q "sendWelcomeEmail" backend/src/queues/email.queue.js && \
       grep -q "emailWorker" backend/src/queues/email.queue.js; then
        check_pass "Email notification queue exists with helper functions"
    else
        check_fail "Email queue missing required components"
    fi
else
    check_fail "Email queue file not found"
fi

# Check queue initialization
if [ -f "backend/src/queues/index.js" ]; then
    if grep -q "initQueues" backend/src/queues/index.js && \
       grep -q "getAllQueueMetrics" backend/src/queues/index.js; then
        check_pass "Queue initialization module exists"
    else
        check_fail "Queue initialization missing required functions"
    fi
else
    check_fail "Queue initialization file not found"
fi

# Check BullMQ dependency
if grep -q "\"bullmq\"" backend/package.json; then
    check_pass "bullmq dependency added to package.json"
else
    check_fail "bullmq dependency not found"
fi

###############################################################################
# 3. KYC/AML COMPLIANCE
###############################################################################
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. KYC/AML COMPLIANCE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check KYC service
if [ -f "backend/src/kyc/kyc.service.js" ]; then
    if grep -q "startKYC" backend/src/kyc/kyc.service.js && \
       grep -q "adminApproveKYC" backend/src/kyc/kyc.service.js && \
       grep -q "canUserWithdraw" backend/src/kyc/kyc.service.js; then
        check_pass "KYC service exists with complete workflow functions"
    else
        check_fail "KYC service missing required functions"
    fi
else
    check_fail "KYC service file not found"
fi

# Check AML engine
if [ -f "backend/src/aml/aml.engine.js" ]; then
    if grep -q "runAMLChecks" backend/src/aml/aml.engine.js && \
       grep -q "checkVelocity" backend/src/aml/aml.engine.js && \
       grep -q "freezeUserForAML" backend/src/aml/aml.engine.js; then
        check_pass "AML rules engine exists with check functions"
    else
        check_fail "AML engine missing required functions"
    fi
else
    check_fail "AML engine file not found"
fi

# Check KYC controller
if [ -f "backend/src/kyc/kyc.controller.js" ]; then
    if grep -q "startKYCVerification" backend/src/kyc/kyc.controller.js && \
       grep -q "adminApproveKYCHandler" backend/src/kyc/kyc.controller.js; then
        check_pass "KYC controller exists with endpoint handlers"
    else
        check_fail "KYC controller missing required handlers"
    fi
else
    check_fail "KYC controller file not found"
fi

# Check KYC routes
if [ -f "backend/src/kyc/kyc.routes.js" ]; then
    if grep -q "router.post.*start" backend/src/kyc/kyc.routes.js && \
       grep -q "router.put.*approve" backend/src/kyc/kyc.routes.js; then
        check_pass "KYC routes defined with user and admin endpoints"
    else
        check_fail "KYC routes missing required endpoints"
    fi
else
    check_fail "KYC routes file not found"
fi

# Check Prisma schema KYC model
if [ -f "backend/prisma/schema.prisma" ]; then
    if grep -q "model KYC" backend/prisma/schema.prisma && \
       grep -q "KYCStatus" backend/prisma/schema.prisma && \
       grep -q "model AMLCheck" backend/prisma/schema.prisma; then
        check_pass "Prisma schema includes KYC and AMLCheck models"
    else
        check_fail "Prisma schema missing KYC/AML models"
    fi
else
    check_fail "Prisma schema file not found"
fi

###############################################################################
# 4. HORIZONTAL SCALING
###############################################################################
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. HORIZONTAL SCALING"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Socket.IO Redis adapter
if [ -f "backend/src/sockets/socket.js" ]; then
    if grep -q "@socket.io/redis-adapter" backend/src/sockets/socket.js && \
       grep -q "pubClient" backend/src/sockets/socket.js && \
       grep -q "createAdapter" backend/src/sockets/socket.js; then
        check_pass "Socket.IO Redis adapter integrated"
    else
        check_fail "Socket.IO Redis adapter not properly configured"
    fi
else
    check_fail "Socket.IO socket file not found"
fi

# Check Socket.IO Redis adapter dependency
if grep -q "@socket.io/redis-adapter" backend/package.json; then
    check_pass "@socket.io/redis-adapter dependency added to package.json"
else
    check_fail "@socket.io/redis-adapter dependency not found"
fi

###############################################################################
# 5. INTEGRATION
###############################################################################
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. INTEGRATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check KYC routes in app.js
if [ -f "backend/src/app.js" ]; then
    if grep -q "kycRoutes" backend/src/app.js && \
       grep -q "app.use.*kyc.*kycRoutes" backend/src/app.js; then
        check_pass "KYC routes integrated into app.js"
    else
        check_fail "KYC routes not integrated into app.js"
    fi
else
    check_fail "app.js file not found"
fi

# Check queue initialization in server.js
if [ -f "backend/src/server.js" ]; then
    if grep -q "initQueues" backend/src/server.js; then
        check_pass "Queue initialization called in server.js"
    else
        check_fail "Queue initialization not called in server.js"
    fi
else
    check_fail "server.js file not found"
fi

###############################################################################
# SUMMARY
###############################################################################
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 VERIFICATION SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total Checks: $TOTAL_CHECKS"
echo "✅ Passed: $PASS_COUNT"
echo "❌ Failed: $FAIL_COUNT"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo "🎉 ALL CHECKS PASSED! Part 4 implementation verified."
    echo ""
    echo "Next Steps:"
    echo "1. Run Prisma migrations: cd backend && npx prisma migrate dev"
    echo "2. Start Redis: docker-compose up -d redis"
    echo "3. Test KYC workflow: curl -X POST http://localhost:3000/kyc/start"
    echo "4. Monitor queues: Check BullMQ dashboard or queue metrics endpoint"
    exit 0
else
    echo "⚠️  VERIFICATION INCOMPLETE: $FAIL_COUNT checks failed."
    echo "Please review the failed checks above and complete the implementation."
    exit 1
fi
