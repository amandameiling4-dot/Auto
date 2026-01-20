const http = require('http');

function makeRequest(data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);

        const options = {
            hostname: 'localhost',
            port: 4000,
            path: '/auth/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                console.log(`Response: ${body}\n`);
                resolve();
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function createUsers() {
    console.log('Creating admin user...');
    await makeRequest({ username: 'admin', password: 'admin123', role: 'admin' });

    console.log('Creating regular user...');
    await makeRequest({ username: 'user', password: 'user123', role: 'user' });

    console.log('Done! You can now login with:');
    console.log('  Admin: admin/admin123');
    console.log('  User: user/user123');
}

createUsers().catch(console.error);
