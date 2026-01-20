# PM2 Commands Cheat Sheet

## Process Management

### Start Application
```bash
# Start with ecosystem file
pm2 start ecosystem.config.js --env production

# Start specific app
pm2 start backend/src/server.js --name onchainweb-backend

# Start with options
pm2 start backend/src/server.js --name onchainweb --instances 2 --exec-mode cluster
```

### Stop/Restart/Delete
```bash
# Stop application
pm2 stop onchainweb-backend

# Restart application (0 downtime)
pm2 restart onchainweb-backend

# Graceful reload (cluster mode only)
pm2 reload onchainweb-backend

# Delete process
pm2 delete onchainweb-backend

# Delete all processes
pm2 delete all
```

### Status & Monitoring
```bash
# List all processes
pm2 list
pm2 status

# Monitor CPU/Memory in real-time
pm2 monit

# Show process details
pm2 describe onchainweb-backend
pm2 show onchainweb-backend

# Display logs
pm2 logs onchainweb-backend
pm2 logs onchainweb-backend --lines 100
pm2 logs onchainweb-backend --err  # Error logs only
pm2 logs onchainweb-backend --out  # Output logs only

# Clear logs
pm2 flush
```

## Advanced Features

### Auto-Restart on Crash
```bash
# Already enabled by default
# Configure max restarts:
pm2 start server.js --max-restarts 10 --min-uptime 5000
```

### Auto-Restart on File Changes (Dev only)
```bash
pm2 start server.js --watch
pm2 start server.js --watch --ignore-watch="node_modules"
```

### Memory-Based Restart
```bash
pm2 start server.js --max-memory-restart 1G
```

### Cron-Based Restart
```bash
# Restart daily at 3 AM
pm2 start server.js --cron-restart="0 3 * * *"
```

### Startup Script (Auto-start on server reboot)
```bash
# Generate startup script
pm2 startup systemd

# Save current process list
pm2 save

# Disable startup
pm2 unstartup systemd
```

## Cluster Mode

### Scale Application
```bash
# Start with 4 instances
pm2 start server.js -i 4

# Start with max CPU cores
pm2 start server.js -i max

# Scale up/down
pm2 scale onchainweb-backend 6
pm2 scale onchainweb-backend +2
pm2 scale onchainweb-backend -1
```

### Zero-Downtime Reload
```bash
# Reload all instances one by one
pm2 reload ecosystem.config.js
```

## Log Management

### Log Rotation (using pm2-logrotate)
```bash
# Install module
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M       # Rotate when log reaches 10MB
pm2 set pm2-logrotate:retain 7           # Keep 7 rotated logs
pm2 set pm2-logrotate:compress true      # Compress rotated logs
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
```

## Monitoring & Metrics

### PM2 Plus (Cloud Monitoring - Optional)
```bash
# Link to PM2 Plus
pm2 link <secret_key> <public_key>

# Unlink
pm2 unlink
```

### Custom Metrics
```javascript
// In your application code:
const pmx = require('pmx');

// Custom metric
const metric = pmx.probe().metric({
  name: 'Active Users',
  value: () => activeUsers.length
});

// Custom action
pmx.action('clear cache', (reply) => {
  cache.clear();
  reply({ success: true });
});
```

## Useful Commands

### Update PM2
```bash
npm install pm2@latest -g
pm2 update
```

### Environment Variables
```bash
# Pass env vars
pm2 start server.js --env production
pm2 restart server.js --update-env

# Set env var
pm2 set pm2:var VALUE
```

### Process Information
```bash
# Get PID
pm2 pid onchainweb-backend

# Send signal
pm2 sendSignal SIGUSR2 onchainweb-backend

# Trigger GC (if --expose-gc)
pm2 trigger onchainweb-backend gc
```

### Dump & Restore
```bash
# Save process list
pm2 save

# Dump to file
pm2 dump

# Restore from dump
pm2 resurrect
```

## Troubleshooting

### Application Not Starting
```bash
# Check logs
pm2 logs onchainweb-backend --err

# Start in no-daemon mode (see errors)
pm2 start server.js --no-daemon

# Check node version
node -v
pm2 info onchainweb-backend
```

### High Memory Usage
```bash
# Check memory
pm2 monit

# Set memory limit
pm2 start server.js --max-memory-restart 1G

# Trigger manual restart
pm2 restart onchainweb-backend
```

### Application Keeps Crashing
```bash
# Check error logs
pm2 logs onchainweb-backend --err --lines 200

# Increase min uptime before considering stable
pm2 start server.js --min-uptime 10000

# Increase restart delay
pm2 start server.js --restart-delay 5000

# Disable auto-restart temporarily
pm2 start server.js --no-autorestart
```

## Production Best Practices

### Recommended Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'onchainweb-backend',
    script: './src/server.js',
    instances: 2,              // Use cluster mode
    exec_mode: 'cluster',
    max_memory_restart: '1G',  // Auto-restart if memory > 1GB
    min_uptime: '10s',         // Min uptime before considering app stable
    max_restarts: 10,          // Max restarts within min_uptime
    autorestart: true,         // Auto-restart on crash
    cron_restart: '0 3 * * *', // Daily restart at 3 AM
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    env_production: {
      NODE_ENV: 'production'
    }
  }]
}
```

### Security
```bash
# Run as specific user (not root)
pm2 start server.js --uid www-data --gid www-data

# Disable auto-install of dependencies
pm2 set pm2:autodump false
```

### Monitoring Checklist
```bash
# Daily checks
pm2 status                    # All processes running?
pm2 logs --lines 100          # Any errors?
pm2 monit                     # Memory/CPU normal?

# Weekly checks
pm2 list                      # Process uptime
pm2 logs --lines 1000 | grep -i error  # Search for errors
```

## Quick Reference

| Command | Description |
|---------|-------------|
| `pm2 start app.js` | Start application |
| `pm2 restart app` | Restart application |
| `pm2 reload app` | Reload (0-downtime) |
| `pm2 stop app` | Stop application |
| `pm2 delete app` | Delete from PM2 |
| `pm2 list` | List all processes |
| `pm2 logs` | Display logs |
| `pm2 monit` | Monitor CPU/Memory |
| `pm2 save` | Save process list |
| `pm2 startup` | Generate startup script |
| `pm2 update` | Update PM2 |

---

**Pro Tip:** Use `pm2 save` after any configuration changes to ensure processes restart correctly after server reboot.
