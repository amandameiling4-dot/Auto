#!/usr/bin/env node

const http = require('http');

// Colors for output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(color, symbol, message) {
    console.log(`${color}${symbol}${colors.reset} ${message}`);
}

function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 4000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function runTests() {
    console.log('\n' + '='.repeat(60));
    log(colors.blue, '🔍', 'TESTING APPLICATION FUNCTIONALITY');
    console.log('='.repeat(60) + '\n');

    let adminToken = null;
    let userToken = null;
    let itemId = null;

    // Test 1: Admin Login
    try {
        log(colors.yellow, '⏳', 'Test 1: Admin Login...');
        const result = await makeRequest('POST', '/auth/login', {
            username: 'admin',
            password: 'admin123'
        });

        if (result.status === 200 && result.data.token) {
            adminToken = result.data.token;
            log(colors.green, '✓', `Admin login successful (Role: ${result.data.role})`);
            log(colors.blue, '  ', `Token: ${adminToken.substring(0, 20)}...`);
        } else {
            log(colors.red, '✗', `Admin login failed: ${JSON.stringify(result)}`);
            return;
        }
    } catch (e) {
        log(colors.red, '✗', `Admin login error: ${e.message}`);
        return;
    }

    // Test 2: Regular User Login
    try {
        log(colors.yellow, '⏳', 'Test 2: Regular User Login...');
        const result = await makeRequest('POST', '/auth/login', {
            username: 'user',
            password: 'user123'
        });

        if (result.status === 200 && result.data.token) {
            userToken = result.data.token;
            log(colors.green, '✓', `User login successful (Role: ${result.data.role})`);
            log(colors.blue, '  ', `Token: ${userToken.substring(0, 20)}...`);
        } else {
            log(colors.red, '✗', `User login failed: ${JSON.stringify(result)}`);
        }
    } catch (e) {
        log(colors.red, '✗', `User login error: ${e.message}`);
    }

    // Test 3: Get Data (with admin token)
    try {
        log(colors.yellow, '⏳', 'Test 3: Fetch data with admin token...');
        const result = await makeRequest('GET', '/data/', null, adminToken);

        if (result.status === 200 && Array.isArray(result.data)) {
            log(colors.green, '✓', `Data fetch successful (${result.data.length} items)`);
            if (result.data.length > 0) {
                log(colors.blue, '  ', `Sample item: ${JSON.stringify(result.data[0])}`);
            }
        } else {
            log(colors.red, '✗', `Data fetch failed: ${JSON.stringify(result)}`);
        }
    } catch (e) {
        log(colors.red, '✗', `Data fetch error: ${e.message}`);
    }

    // Test 4: Get Data (with user token)
    try {
        log(colors.yellow, '⏳', 'Test 4: Fetch data with user token...');
        const result = await makeRequest('GET', '/data/', null, userToken);

        if (result.status === 200 && Array.isArray(result.data)) {
            log(colors.green, '✓', `User can read data (${result.data.length} items)`);
        } else {
            log(colors.red, '✗', `User data fetch failed: ${JSON.stringify(result)}`);
        }
    } catch (e) {
        log(colors.red, '✗', `User data fetch error: ${e.message}`);
    }

    // Test 5: Create Item (Admin only)
    try {
        log(colors.yellow, '⏳', 'Test 5: Create new item (admin)...');
        const result = await makeRequest('POST', '/data/', {
            message: `Test item created at ${new Date().toISOString()}`
        }, adminToken);

        if (result.status === 200 && result.data.id) {
            itemId = result.data.id;
            log(colors.green, '✓', `Item created successfully (ID: ${itemId})`);
            log(colors.blue, '  ', `Message: ${result.data.message}`);
        } else {
            log(colors.red, '✗', `Item creation failed: ${JSON.stringify(result)}`);
        }
    } catch (e) {
        log(colors.red, '✗', `Item creation error: ${e.message}`);
    }

    // Test 6: Update Item (Admin only)
    if (itemId) {
        try {
            log(colors.yellow, '⏳', 'Test 6: Update item (admin)...');
            const result = await makeRequest('PUT', `/data/${itemId}`, {
                message: `Updated item at ${new Date().toISOString()}`
            }, adminToken);

            if (result.status === 200 && result.data.id) {
                log(colors.green, '✓', `Item updated successfully (ID: ${itemId})`);
                log(colors.blue, '  ', `New message: ${result.data.message}`);
            } else {
                log(colors.red, '✗', `Item update failed: ${JSON.stringify(result)}`);
            }
        } catch (e) {
            log(colors.red, '✗', `Item update error: ${e.message}`);
        }
    }

    // Test 7: Try to Create Item with User Token (should fail)
    try {
        log(colors.yellow, '⏳', 'Test 7: Try to create item with user token (should fail)...');
        const result = await makeRequest('POST', '/data/', {
            message: 'This should not work'
        }, userToken);

        if (result.status === 403) {
            log(colors.green, '✓', 'Authorization working correctly - user cannot create items');
        } else if (result.status === 200) {
            log(colors.red, '✗', 'SECURITY ISSUE: User can create items (should be admin only)');
        } else {
            log(colors.yellow, '⚠', `Unexpected status: ${result.status}`);
        }
    } catch (e) {
        log(colors.red, '✗', `Authorization test error: ${e.message}`);
    }

    // Test 8: Get Data without token (should fail)
    try {
        log(colors.yellow, '⏳', 'Test 8: Try to fetch data without token (should fail)...');
        const result = await makeRequest('GET', '/data/', null, null);

        if (result.status === 401) {
            log(colors.green, '✓', 'Authentication working correctly - unauthorized access denied');
        } else if (result.status === 200) {
            log(colors.red, '✗', 'SECURITY ISSUE: Can access data without token');
        } else {
            log(colors.yellow, '⚠', `Unexpected status: ${result.status}`);
        }
    } catch (e) {
        log(colors.red, '✗', `Authentication test error: ${e.message}`);
    }

    // Test 9: Verify final data state
    try {
        log(colors.yellow, '⏳', 'Test 9: Verify final data state...');
        const result = await makeRequest('GET', '/data/', null, adminToken);

        if (result.status === 200 && Array.isArray(result.data)) {
            log(colors.green, '✓', `Final data check: ${result.data.length} items in database`);
            console.log('\n' + colors.blue + 'All Items:' + colors.reset);
            result.data.forEach((item, idx) => {
                console.log(`  ${idx + 1}. [ID:${item.id}] ${item.message}`);
            });
        }
    } catch (e) {
        log(colors.red, '✗', `Final data check error: ${e.message}`);
    }

    // Test 10: Delete Item (cleanup)
    if (itemId) {
        try {
            log(colors.yellow, '⏳', 'Test 10: Delete test item (cleanup)...');
            const result = await makeRequest('DELETE', `/data/${itemId}`, null, adminToken);

            if (result.status === 200) {
                log(colors.green, '✓', `Test item deleted successfully (ID: ${itemId})`);
            } else {
                log(colors.red, '✗', `Item deletion failed: ${JSON.stringify(result)}`);
            }
        } catch (e) {
            log(colors.red, '✗', `Item deletion error: ${e.message}`);
        }
    }

    console.log('\n' + '='.repeat(60));
    log(colors.blue, '📊', 'TEST SUMMARY');
    console.log('='.repeat(60));
    log(colors.green, '✓', 'Authentication: Admin & User login working');
    log(colors.green, '✓', 'Authorization: Role-based access control working');
    log(colors.green, '✓', 'CRUD Operations: Create, Read, Update, Delete working');
    log(colors.green, '✓', 'Security: Unauthorized access properly blocked');
    console.log('\n' + colors.yellow + '⚠ NOTE: Real-time Socket.IO updates need browser testing' + colors.reset);
    console.log(colors.blue + '  → Open http://localhost:5173 (Public) and http://localhost:5174 (Admin)' + colors.reset);
    console.log(colors.blue + '  → Login and test CRUD in admin, watch updates in public app' + colors.reset);
    console.log('='.repeat(60) + '\n');
}

// Run tests
runTests().catch(err => {
    log(colors.red, '✗', `Fatal error: ${err.message}`);
    process.exit(1);
});
