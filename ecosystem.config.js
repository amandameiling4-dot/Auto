# PM2 Ecosystem Configuration
# File: ecosystem.config.js

module.exports = {
    apps: [
        {
            name: 'onchainweb-backend',
            script: './src/server.js',
            cwd: './backend',

            // Runtime Configuration
            instances: 2, // Run 2 instances for load balancing
            exec_mode: 'cluster',

            // Environment Variables
            env: {
                NODE_ENV: 'development',
                PORT: 3000,
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3000,
            },

            // Restart Strategy
            watch: false, // Disable watch in production
            max_memory_restart: '1G',
            min_uptime: '10s',
            max_restarts: 10,
            autorestart: true,

            // Logging
            error_file: './logs/backend-error.log',
            out_file: './logs/backend-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,

            // Advanced Features
            kill_timeout: 5000,
            listen_timeout: 3000,

            // Cron Restart (optional - restart daily at 3 AM)
            cron_restart: '0 3 * * *',

            // Environment-specific settings
            node_args: '--max-old-space-size=2048',
        }
    ],

    // Deployment Configuration
    deploy: {
        production: {
            user: 'ubuntu',
            host: 'onchainweb.app',
            ref: 'origin/main',
            repo: 'git@github.com:amandameiling4-dot/Auto.git',
            path: '/var/www/onchainweb',
            'pre-deploy-local': '',
            'post-deploy': 'npm install && npx prisma migrate deploy && pm2 reload ecosystem.config.js --env production',
            'pre-setup': '',
            ssh_options: 'ForwardAgent=yes'
        },
        staging: {
            user: 'ubuntu',
            host: 'staging.onchainweb.app',
            ref: 'origin/develop',
            repo: 'git@github.com:amandameiling4-dot/Auto.git',
            path: '/var/www/onchainweb-staging',
            'post-deploy': 'npm install && npx prisma migrate deploy && pm2 reload ecosystem.config.js --env staging',
        }
    }
};
