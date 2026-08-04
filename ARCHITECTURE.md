# EXELIX Production Architecture

## 🏗️ System Architecture Overview

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web Frontend  │    │  Admin Panel    │
│   (PWA)         │    │   (React)       │    │   (React)       │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │   Load Balancer (Nginx)   │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │    API Gateway (Express)   │
                    │   + Rate Limiting + Auth    │
                    └─────────────┬─────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────┴───────┐    ┌─────────┴───────┐    ┌─────────┴───────┐
│   PostgreSQL    │    │     Redis       │    │  File Storage   │
│   (Primary DB)  │    │   (Cache)       │    │   (Images/QR)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │
┌─────────┴───────┐
│  Telegram Bot   │
│  + Push Service│
└─────────────────┘
```

## 🗄️ Database Schema (ER Diagram)

```sql
-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_token VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    phone_country VARCHAR(2) NOT NULL, -- 'KG' or 'RU'
    telegram_username VARCHAR(100),
    avatar_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'closed', -- 'open' or 'closed'
    language VARCHAR(5) NOT NULL DEFAULT 'ru', -- 'ru', 'ky', 'en'
    push_subscription JSONB, -- PWA subscription data
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_ip INET NOT NULL,
    sender_user_agent TEXT,
    notification_type VARCHAR(50) NOT NULL, -- 'blocking', 'parking', 'alarm', 'evacuation', 'minor_accident', 'major_accident'
    message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_delivered BOOLEAN DEFAULT false,
    delivery_method VARCHAR(20), -- 'push', 'telegram', 'both'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Limits Table
CREATE TABLE daily_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    sent_count INTEGER DEFAULT 0,
    received_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Admin Users Table
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QR Codes Batch Table (for admin generation)
CREATE TABLE qr_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_name VARCHAR(255),
    generated_by UUID REFERENCES admin_users(id),
    total_codes INTEGER NOT NULL,
    file_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_users_qr_token ON users(qr_token);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at);
CREATE INDEX idx_daily_limits_user_date ON daily_limits(user_id, date);
```

## 🔐 Security Architecture

### Authentication & Authorization
- **JWT Tokens** for API authentication
- **QR Token Validation** with cryptographic signing
- **Rate Limiting** per IP and user
- **CORS** configuration for frontend domains
- **Input Validation** and sanitization
- **SQL Injection Prevention** with parameterized queries

### Data Protection
- **Phone numbers** encrypted at rest
- **PII** (Personally Identifiable Information) access logs
- **GDPR Compliance** with data deletion capabilities
- **Audit Logs** for admin actions

## 📱 PWA Architecture

### Service Worker Strategy
```javascript
// Cache strategy for different resources
CACHE_STRATEGIES = {
  static: 'CacheFirst',      // App shell, images
  api: 'NetworkFirst',       // API calls
  qr: 'CacheFirst',          // QR codes
  notifications: 'NetworkOnly' // Real-time data
}
```

### Push Notifications
- **VAPID Keys** for web push authentication
- **Firebase Cloud Messaging** as backup
- **Local Notifications** when offline

## 🚀 Scalability Architecture

### Horizontal Scaling
- **Stateless API** servers behind load balancer
- **Database Read Replicas** for read-heavy operations
- **Redis Cluster** for distributed caching
- **CDN** for static assets and QR codes

### Performance Optimization
- **Database Connection Pooling**
- **Query Optimization** with proper indexes
- **Lazy Loading** for user data
- **Image Compression** and WebP format
- **Minified** and compressed assets

### Monitoring & Observability
- **Application Metrics** (response times, error rates)
- **Database Performance** monitoring
- **User Analytics** and funnels
- **Error Tracking** and alerting

## 🌐 Multi-Region Deployment

### CDN Strategy
- **Static Assets**: Global CDN distribution
- **API**: Regional endpoints with geo-routing
- **Database**: Primary in Central Asia, read replicas globally

### Disaster Recovery
- **Database Backups** daily with point-in-time recovery
- **Multi-AZ Deployment** for high availability
- **Failover Procedures** with automated recovery

## 📊 Analytics & Metrics

### Business Metrics
- **User Registration Rate**
- **QR Code Scan Rate**
- **Notification Success Rate**
- **Daily Active Users**

### Technical Metrics
- **API Response Times**
- **Database Query Performance**
- **Cache Hit Ratios**
- **Error Rates by Endpoint**

## 🔧 Development Workflow

### CI/CD Pipeline
```
Git Push → Automated Tests → Build → Security Scan → Deploy to Staging → E2E Tests → Deploy to Production
```

### Environment Strategy
- **Development**: Local Docker setup
- **Staging**: Production-like environment
- **Production**: Multi-region deployment

## 📋 Technology Stack Summary

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **ORM**: Prisma or TypeORM
- **Authentication**: JWT + bcrypt

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand or Context API
- **PWA**: Workbox
- **Internationalization**: react-i18next

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **Load Balancer**: Nginx
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack
- **CDN**: CloudFlare

### Third-party Services
- **Push Notifications**: Firebase Cloud Messaging
- **File Storage**: AWS S3 or similar
- **Email**: SendGrid or similar
- **Analytics**: Google Analytics 4
- **Error Tracking**: Sentry
