# 📊 Monitoring & Alerts Guide - OnChainWeb Platform

## Complete observability setup with Prometheus + Grafana

---

## 🎯 Overview

**Monitoring Stack:**
- **Prometheus** - Metrics collection and storage
- **Grafana** - Visualization dashboards
- **Alert Rules** - Critical alerts for production incidents
- **Health Checks** - Service availability monitoring

---

## 📈 Metrics Collection

### **1. Application Metrics** (`/metrics` endpoint)

**Backend exposes Prometheus metrics at:**
```
http://localhost:3000/metrics
```

#### **Available Metrics:**

**HTTP Request Metrics:**
```
http_requests_total{method, route, status}
http_request_duration_seconds{method, route, status}
```

**WebSocket Metrics:**
```
websocket_connections_active{role}
```

**Trading Metrics:**
```
trade_operations_total{type, status}
trades_open_count
```

**Binary Options Metrics:**
```
binary_options_total{direction, result}
```

**Wallet Metrics:**
```
wallet_balance_total
```

**Admin Metrics:**
```
admin_actions_total{action, admin_id}
transaction_approvals_total{type, status}
```

**Security Metrics:**
```
failed_login_attempts_total{reason}
rate_limit_hits_total{endpoint}
```

**System Metrics:**
```
db_connection_pool_size{status}
market_feed_status{feed_name}
```

---

### **2. Integration with Code**

#### **Track HTTP Requests:**
```javascript
// backend/src/app.js
import { metricsMiddleware, metricsHandler } from "./metrics.js";

// Apply middleware
app.use(metricsMiddleware);

// Expose metrics endpoint
app.get("/metrics", metricsHandler);
```

#### **Track Custom Events:**
```javascript
// backend/src/trading/trade.engine.js
import { tradeOperationsCounter, openTradesGauge } from "../metrics.js";

export async function openTrade(userId, symbol, amount) {
  // ... trade logic ...
  
  // Increment counter
  tradeOperationsCounter.inc({ type: "LONG", status: "success" });
  
  // Update gauge
  openTradesGauge.set(await getOpenTradesCount());
}
```

#### **Track Admin Actions:**
```javascript
// backend/src/admin/admin.controller.js
import { adminActionsCounter } from "../metrics.js";

export async function approveTx(req, res) {
  const adminId = req.user.id;
  
  // ... approval logic ...
  
  // Track action
  adminActionsCounter.inc({ action: "APPROVE_TX", admin_id: adminId });
}
```

---

## 📊 Grafana Dashboards

### **Access Grafana**
```
URL: http://localhost:3001
Username: admin
Password: admin123 (configurable in .env)
```

---

### **Pre-configured Dashboards**

#### **1. OnChainWeb Platform Overview**

**Panels:**
1. **HTTP Requests per Second**
   - Query: `rate(http_requests_total[5m])`
   - Type: Graph
   - Shows: Request volume by endpoint

2. **API Response Time (95th percentile)**
   - Query: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
   - Type: Graph
   - Shows: Response time performance

3. **Active WebSocket Connections**
   - Query: `sum(websocket_connections_active)`
   - Type: Stat
   - Shows: Real-time connection count

4. **Open Trades**
   - Query: `trades_open_count`
   - Type: Stat
   - Shows: Current open positions

5. **Total Wallet Balance**
   - Query: `wallet_balance_total`
   - Type: Stat
   - Shows: Platform-wide balance

6. **Failed Login Attempts**
   - Query: `rate(failed_login_attempts_total[5m])`
   - Type: Stat
   - Shows: Security threat detection

7. **Trades per Minute**
   - Query: `rate(trade_operations_total[1m]) * 60`
   - Type: Graph
   - Shows: Trading volume

8. **Admin Actions**
   - Query: `rate(admin_actions_total[5m])`
   - Type: Graph
   - Shows: Admin activity

9. **Error Rate**
   - Query: `rate(http_requests_total{status=~"5.."}[5m])`
   - Type: Graph
   - Shows: Application errors

10. **System Resources**
    - Query: CPU and memory usage
    - Type: Graph
    - Shows: Server health

---

### **Create Custom Dashboards**

1. **Navigate to Grafana** → Dashboards → New Dashboard
2. **Add Panel** → Select visualization type
3. **Configure Query:**
   ```promql
   # Example: Binary options win rate
   rate(binary_options_total{result="WIN"}[5m]) / 
   rate(binary_options_total[5m])
   ```
4. **Set Thresholds** for color coding
5. **Save Dashboard**

---

## 🚨 Alert Configuration

### **Alert Rules** (`deployment/prometheus/rules/alerts.yml`)

#### **Critical Alerts**

**1. API Down**
```yaml
- alert: APIDown
  expr: up{job="api"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Backend API is down"
```

**2. High Error Rate**
```yaml
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
  for: 5m
  labels:
    severity: critical
```

**3. Database Connection Failure**
```yaml
- alert: DatabaseConnectionFailure
  expr: up{job="postgres"} == 0
  for: 2m
  labels:
    severity: critical
```

**4. Market Feed Disconnected**
```yaml
- alert: MarketFeedDisconnected
  expr: market_feed_status == 0
  for: 1m
  labels:
    severity: critical
```

**5. Wallet Balance Mismatch**
```yaml
- alert: WalletBalanceMismatch
  expr: abs(delta(wallet_balance_total[5m])) > 10000
  labels:
    severity: critical
```

---

#### **Warning Alerts**

**6. Admin Abuse Pattern**
```yaml
- alert: AdminAbusePattern
  expr: rate(admin_actions_total[5m]) > 10
  for: 5m
  labels:
    severity: warning
```

**7. High Failed Login Attempts**
```yaml
- alert: HighFailedLoginAttempts
  expr: rate(failed_login_attempts_total[5m]) > 5
  for: 2m
  labels:
    severity: warning
```

**8. High Memory Usage**
```yaml
- alert: HighMemoryUsage
  expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
  for: 5m
  labels:
    severity: warning
```

---

### **Alert Channels**

#### **Slack Integration**
```yaml
# alertmanager.yml
receivers:
  - name: 'slack'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        channel: '#alerts'
        title: 'OnChainWeb Alert'
        text: '{{ .CommonAnnotations.summary }}'
```

#### **Email Integration**
```yaml
receivers:
  - name: 'email'
    email_configs:
      - to: 'ops@onchainweb.app'
        from: 'alerts@onchainweb.app'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alerts@onchainweb.app'
        auth_password: 'YOUR_PASSWORD'
```

#### **PagerDuty Integration**
```yaml
receivers:
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'
```

---

## 📝 Log Aggregation

### **Log Collection Strategy**

#### **1. Docker Logs**
```bash
# View all logs
docker compose logs -f

# View specific service
docker compose logs -f api

# Export logs to file
docker compose logs > logs_$(date +%Y%m%d).txt
```

---

#### **2. Structured Logging in Application**
```javascript
// backend/src/utils/logger.js
import winston from "winston";

export const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Usage:
logger.info("Trade opened", { userId, tradeId, symbol });
logger.error("Trade settlement failed", { tradeId, error });
```

---

#### **3. ELK Stack (Optional)**

**Add to docker-compose.yml:**
```yaml
elasticsearch:
  image: elasticsearch:8.11.0
  environment:
    - discovery.type=single-node
  ports:
    - "9200:9200"

logstash:
  image: logstash:8.11.0
  volumes:
    - ./logstash/pipeline:/usr/share/logstash/pipeline
  depends_on:
    - elasticsearch

kibana:
  image: kibana:8.11.0
  ports:
    - "5601:5601"
  depends_on:
    - elasticsearch
```

---

#### **4. Loki + Grafana (Lightweight Alternative)**

**Add to docker-compose.yml:**
```yaml
loki:
  image: grafana/loki:latest
  ports:
    - "3100:3100"
  command: -config.file=/etc/loki/local-config.yaml

promtail:
  image: grafana/promtail:latest
  volumes:
    - /var/log:/var/log
    - ./promtail-config.yml:/etc/promtail/config.yml
  command: -config.file=/etc/promtail/config.yml
```

---

## 🔍 Query Examples

### **Prometheus Queries (PromQL)**

#### **Find Slow Endpoints**
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
```

#### **Error Rate by Endpoint**
```promql
rate(http_requests_total{status=~"5.."}[5m]) by (route)
```

#### **Most Active Admins**
```promql
topk(5, sum by (admin_id) (rate(admin_actions_total[1h])))
```

#### **Binary Options Win Rate**
```promql
sum(rate(binary_options_total{result="WIN"}[1h])) / 
sum(rate(binary_options_total[1h]))
```

#### **Database Connection Pool Usage**
```promql
db_connection_pool_size{status="active"} / 
db_connection_pool_size{status="total"}
```

---

## 📊 Performance Monitoring

### **Key Performance Indicators (KPIs)**

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| **API Response Time (p95)** | < 500ms | > 2s |
| **Error Rate** | < 0.1% | > 1% |
| **Uptime** | 99.9% | < 99.5% |
| **Database Connections** | < 50% pool | > 90% pool |
| **Memory Usage** | < 70% | > 90% |
| **CPU Usage** | < 60% | > 80% |
| **Open Trades** | N/A | > 1000 (review) |
| **Failed Logins** | < 1/min | > 5/min |

---

## 🛠️ Troubleshooting with Metrics

### **Scenario 1: High Response Times**
```promql
# Identify slow endpoints
topk(5, histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) by (route))

# Check database connection pool
db_connection_pool_size

# Check system resources
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

---

### **Scenario 2: Unusual Admin Activity**
```promql
# Admin actions per admin
sum by (admin_id) (rate(admin_actions_total[1h]))

# Specific admin details
admin_actions_total{admin_id="admin-123"}
```

---

### **Scenario 3: Trade Settlement Issues**
```promql
# Failed trade operations
rate(trade_operations_total{status="failed"}[5m])

# Open trades stuck
trades_open_count

# Market feed status
market_feed_status
```

---

## ✅ Monitoring Checklist

**Setup:**
- [ ] Prometheus scraping backend `/metrics`
- [ ] Grafana connected to Prometheus
- [ ] Dashboards imported
- [ ] Alert rules configured
- [ ] Alert channels (Slack/Email) set up
- [ ] Health checks enabled on all services

**Metrics:**
- [ ] HTTP request metrics tracked
- [ ] WebSocket connection metrics tracked
- [ ] Trading metrics tracked
- [ ] Admin action metrics tracked
- [ ] Security metrics tracked
- [ ] System resource metrics tracked

**Alerts:**
- [ ] Critical alerts configured
- [ ] Warning alerts configured
- [ ] Alert notifications tested
- [ ] Runbooks created for each alert

**Logging:**
- [ ] Application logs structured (JSON)
- [ ] Logs rotated daily
- [ ] Error logs aggregated
- [ ] Log retention policy set (7 days)

---

## 📚 Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/grafana/latest/)
- [PromQL Basics](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Alerting Best Practices](https://prometheus.io/docs/practices/alerting/)

---

**✅ Monitoring & alerts fully configured! Complete observability for production. 📊**
