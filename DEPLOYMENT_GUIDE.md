# EXELIX Production Deployment Guide

## 🚀 Complete Production Deployment Instructions

### 📋 Prerequisites

- **Node.js 18+**
- **Docker & Docker Compose**
- **PostgreSQL 15+**
- **Redis 7+**
- **Nginx** (for production)
- **SSL Certificate** (Let's Encrypt recommended)

---

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx (80/443) │    │   React PWA     │    │   Node.js API   │
│   Load Balancer  │────│   Port 3000     │────│   Port 3001     │
└─────────┬───────┘    └─────────────────┘    └─────────┬───────┘
          │                                        │
          └────────────────────────────────────────┘
                            │
          ┌─────────────────┬─────────────────┐
          │   PostgreSQL     │     Redis        │
          │   Port 5432      │    Port 6379      │
          └─────────────────┴─────────────────┘
```

---

## 🔧 Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/exelix/exelix.git
cd exelix/production
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Critical Environment Variables:**
```env
# Database
DB_PASSWORD=your_secure_db_password_here
DATABASE_URL=postgresql://exelix:your_secure_db_password_here@localhost:5432/exelix

# Security
JWT_SECRET=your_jwt_secret_key_minimum_32_characters_long
REDIS_PASSWORD=your_secure_redis_password_here

# Web Push
WEB_PUSH_PUBLIC_KEY=your_web_push_public_key
WEB_PUSH_PRIVATE_KEY=your_web_push_private_key

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Production
NODE_ENV=production
APP_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

---

## 🐳 Docker Deployment (Recommended)

### 1. Build and Start Services
```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

### 2. Initialize Database
```bash
# Run database migrations
docker-compose exec backend npm run migrate

# Create admin user
docker-compose exec backend npm run seed
```

### 3. Verify Deployment
```bash
# Check health status
curl https://yourdomain.com/api/v1/health

# Check frontend
curl https://yourdomain.com
```

---

## 🛠️ Manual Deployment

### 1. Backend Setup
```bash
cd packages/backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start production server
NODE_ENV=production npm start
```

### 2. Frontend Setup
```bash
cd packages/frontend

# Install dependencies
npm install

# Build for production
npm run build

# Serve with nginx or serve
npm install -g serve
serve -s dist -l 3000
```

### 3. Database Setup
```bash
# Create database
createdb exelix

# Run schema
psql exelix < database/schema.sql

# Create admin user
psql exelix -c "INSERT INTO admin_users (username, password_hash, email) VALUES ('admin', '$2b$12$hashed_password', 'admin@exelix.com');"
```

---

## 🔒 SSL/HTTPS Setup

### 1. Let's Encrypt (Recommended)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. Nginx Configuration
```nginx
# /etc/nginx/sites-available/exelix
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/exelix/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # PWA Manifest
    location = /manifest.json {
        add_header Content-Type application/json;
    }

    # Service Worker
    location = /service-worker.js {
        add_header Content-Type application/javascript;
    }
}
```

---

## 📱 PWA Configuration

### 1. Generate PWA Icons
```bash
cd packages/frontend

# Install PWA assets generator
npm install -g pwa-assets-generator

# Generate icons
pwa-assets-generator
```

### 2. Verify PWA Installation
```bash
# Test PWA manifest
curl https://yourdomain.com/manifest.json

# Test service worker
curl https://yourdomain.com/service-worker.js
```

---

## 🔔 Push Notifications Setup

### 1. Generate VAPID Keys
```bash
cd packages/backend

# Generate keys
node -e "
const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();
console.log('VAPID_PUBLIC_KEY=', vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=', vapidKeys.privateKey);
"
```

### 2. Update Environment
```env
WEB_PUSH_PUBLIC_KEY=your_public_key_here
WEB_PUSH_PRIVATE_KEY=your_private_key_here
WEB_PUSH_EMAIL=admin@yourdomain.com
```

---

## 🤖 Telegram Bot Setup

### 1. Create Bot
1. Open Telegram and search for @BotFather
2. Send `/newbot` command
3. Follow instructions to get bot token
4. Set bot commands and description

### 2. Configure Webhook
```bash
# Set webhook
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://yourdomain.com/api/v1/webhook/telegram"}'
```

---

## 📊 Monitoring & Logging

### 1. Application Monitoring
```bash
# Install PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Logs
pm2 logs
```

### 2. System Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor resources
htop
iotop
nethogs
```

### 3. Log Management
```bash
# Configure log rotation
sudo nano /etc/logrotate.d/exelix

# Content:
/var/log/exelix/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload exelix
    endscript
}
```

---

## 🔒 Security Hardening

### 1. Firewall Setup
```bash
# Configure UFW
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 3001  # Block direct backend access
```

### 2. Database Security
```sql
-- Create read-only user for monitoring
CREATE USER monitoring WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE exelix TO monitoring;
GRANT USAGE ON SCHEMA public TO monitoring;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitoring;
```

### 3. Rate Limiting
```bash
# Configure nginx rate limiting
sudo nano /etc/nginx/nginx.conf

# Add to http block:
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
```

---

## 🔄 Backup Strategy

### 1. Database Backup
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/exelix"
mkdir -p $BACKUP_DIR

# Database backup
pg_dump exelix > $BACKUP_DIR/exelix_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/exelix_$DATE.sql

# Upload to cloud storage (optional)
# aws s3 cp $BACKUP_DIR/exelix_$DATE.sql.gz s3://your-backup-bucket/

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

### 2. Automated Backup
```bash
# Add to crontab
sudo crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/backup-script.sh
```

---

## 🚀 Performance Optimization

### 1. Database Optimization
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE phone = '+996700123456';

-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_users_phone_active ON users(phone) WHERE is_active = true;

-- Update statistics
ANALYZE users;
```

### 2. Caching Strategy
```bash
# Redis configuration optimization
redis-cli CONFIG SET maxmemory 256mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### 3. CDN Setup
```nginx
# CloudFlare configuration
# 1. Sign up for CloudFlare
# 2. Add your domain
# 3. Update nameservers
# 4. Enable caching for static assets
# 5. Configure Page Rules for API
```

---

## 🔍 Testing Deployment

### 1. Health Checks
```bash
# API Health
curl -f https://yourdomain.com/api/v1/health || echo "API DOWN"

# Frontend Check
curl -f https://yourdomain.com || echo "Frontend DOWN"

# Database Check
docker-compose exec -T backend npm run health-check
```

### 2. Load Testing
```bash
# Install artillery
npm install -g artillery

# Run load test
artillery run load-test-config.yml
```

### 3. Security Testing
```bash
# SSL Test
curl -I https://yourdomain.com

# Security Headers
curl -I https://yourdomain.com | grep -E "(X-Frame-Options|X-Content-Type-Options|X-XSS-Protection)"
```

---

## 📈 Scaling Strategy

### 1. Horizontal Scaling
```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  backend:
    scale: 3
  frontend:
    scale: 2
  nginx:
    scale: 1
```

### 2. Database Scaling
```sql
-- Read replica setup
-- In production, use PostgreSQL streaming replication
-- Consider Amazon RDS or similar managed service
```

### 3. CDN and Global Distribution
```bash
# Deploy to multiple regions
# 1. US East (Virginia)
# 2. EU West (Ireland)  
# 3. Asia Pacific (Singapore)
# 4. Use Route 53 for geo-routing
```

---

## 🆘 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U exelix -d exelix

# Check logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

#### 2. Redis Connection Failed
```bash
# Check Redis status
sudo systemctl status redis

# Test connection
redis-cli ping

# Check logs
sudo tail -f /var/log/redis/redis-server.log
```

#### 3. SSL Certificate Issues
```bash
# Check certificate expiration
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test SSL
openssl s_client -connect yourdomain.com:443
```

#### 4. High Memory Usage
```bash
# Check memory usage
free -h
docker stats

# Restart services if needed
docker-compose restart
```

---

## 📞 Support & Maintenance

### 1. Monitoring Dashboard
- **Grafana**: Custom metrics dashboard
- **Prometheus**: Metrics collection
- **Sentry**: Error tracking

### 2. Alert Configuration
```bash
# Set up alerts for:
# - High CPU usage (>80%)
# - High memory usage (>80%)
# - Database connection failures
# - API response time >2s
# - SSL certificate expiration
```

### 3. Regular Maintenance Tasks
```bash
# Weekly:
- Update packages
- Check logs for errors
- Monitor performance metrics
- Test backup restoration

# Monthly:
- Security updates
- Performance optimization
- Capacity planning
- Documentation updates
```

---

## 🎉 Deployment Complete!

Your EXELIX application is now running in production with:
- ✅ **HTTPS/SSL** security
- ✅ **PWA** functionality  
- ✅ **Push notifications**
- ✅ **Telegram bot** integration
- ✅ **Database backups**
- ✅ **Monitoring** and logging
- ✅ **Performance** optimization
- ✅ **Security** hardening

**Next Steps:**
1. Monitor application performance
2. Set up alerting
3. Regular maintenance schedule
4. User feedback collection
5. Feature rollout planning

🚀 **Your EXELIX platform is ready for 20,000+ users!**
