# 🗄️ EXELIX Database Schema - Complete Reference

## ER Diagram

```
┌─────────────────────────┐         ┌─────────────────────────┐
│       USERS             │         │      QR_CODES           │
├─────────────────────────┤         ├─────────────────────────┤
│ PK: id (UUID)           │◀────────│ PK: id (UUID)           │
│    qr_token (UNIQUE)    │         │    token (UNIQUE)       │
│    first_name           │         │    is_used              │
│    last_name            │         │    used_by_user_id ─────┘
│    phone (UNIQUE)       │
│    phone_country        │
│    telegram_username    │
│    avatar_url           │
│    avatar_data          │
│    status (open/closed) │
│    language (ru/ky/en)  │
│    push_notifications   │
│    telegram_notif       │
│    email_notif          │
│    push_subscription    │
│    created_at           │
│    updated_at           │
│    last_login           │
│    last_notification_at │
│    total_notifications  │
│    total_today          │
└─────────────────────────┘
         ▲
         │ 1:N
         │
┌────────┴─────────────────────────┐         ┌──────────────────────────┐
│      NOTIFICATIONS               │         │   DAILY_LIMITS           │
├──────────────────────────────────┤         ├──────────────────────────┤
│ PK: id (UUID)                    │         │ PK: id (UUID)            │
│ FK: user_id ──────────────────┐  │         │    sender_ip (VARCHAR)   │
│    sender_ip                  │  │         │    user_id (NULLABLE)    │
│    sender_phone               │  │         │    date (DATE)           │
│    sender_device_id           │  │         │    sent_count            │
│    notification_types (TEXT[])│  │         │    received_count        │
│    message                    │  │         │    created_at            │
│    delivered_via (TEXT[])     │  │         │    updated_at            │
│    push_delivered             │  │         │ UNIQUE: (sender_ip, date)│
│    telegram_delivered         │  │         │ UNIQUE: (user_id, date)  │
│    email_delivered            │  │         └──────────────────────────┘
│    created_at                 │  │
│    updated_at                 │  │
│    was_read                   │  │
│    read_at                    │  │
└──────────────────────────────┬─┘  │
                               │    │
                               └────┘
         ▲
         │ 1:N
         │
┌────────┴─────────────────────┐         ┌──────────────────────────┐
│     STATISTICS               │         │   ADMIN_SESSIONS         │
├──────────────────────────────┤         ├──────────────────────────┤
│ PK: id (UUID)                │         │ PK: id (UUID)            │
│    date (DATE UNIQUE)        │         │    admin_id (VARCHAR)    │
│    total_users               │         │    token_hash (VARCHAR)  │
│    new_users_today           │         │    ip_address            │
│    active_users_today        │         │    user_agent            │
│    total_notifications       │         │    expires_at            │
│    successful_notif          │         │    created_at            │
│    failed_notif              │         │ INDEX: admin_id          │
│    notif_by_type (JSONB)     │         │ INDEX: expires_at        │
│    total_requests            │         └──────────────────────────┘
│    api_response_time_ms      │
│    inactive_qr_codes         │
│    created_at                │
│    updated_at                │
└──────────────────────────────┘
```

---

## 📊 Complete Schema Definition

### 1. USERS TABLE (Core)

```sql
CREATE TABLE users (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- QR Registration
    qr_token VARCHAR(64) UNIQUE NOT NULL,

    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    phone_country VARCHAR(2) NOT NULL CHECK (phone_country IN ('KG', 'RU')),

    -- Communication Channels
    telegram_username VARCHAR(100),
    email VARCHAR(255),

    -- Profile Image
    avatar_url VARCHAR(500),
    avatar_data TEXT,                               -- Base64 backup
    avatar_mime VARCHAR(100),

    -- User Settings
    status VARCHAR(20) NOT NULL DEFAULT 'closed' CHECK (status IN ('open', 'closed')),
    language VARCHAR(3) NOT NULL DEFAULT 'ru' CHECK (language IN ('ru', 'ky', 'en')),

    -- Notification Preferences
    push_notifications BOOLEAN DEFAULT true,
    telegram_notifications BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT false,

    -- PWA Push Subscription
    push_subscription JSONB,                        -- {endpoint, keys}

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    last_notification_at TIMESTAMP WITH TIME ZONE,

    -- Statistics
    total_notifications_received INTEGER DEFAULT 0,
    total_notifications_today INTEGER DEFAULT 0,
    total_notifications_this_week INTEGER DEFAULT 0,
    total_notifications_this_month INTEGER DEFAULT 0,

    -- Indexes
    CONSTRAINT phone_format CHECK (phone ~ '^\+?[0-9]{10,20}$')
);

-- Indexes
CREATE INDEX idx_users_qr_token ON users(qr_token);
CREATE INDEX idx_users_phone ON users(phone, phone_country);
CREATE INDEX idx_users_language ON users(language);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_last_login ON users(last_login DESC);
CREATE INDEX idx_users_telegram ON users(telegram_username) WHERE telegram_username IS NOT NULL;

-- Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Partitioning (for growth > 100k users)
CREATE TABLE users_2024_q1 PARTITION OF users
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
```

### 2. QR_CODES TABLE

```sql
CREATE TABLE qr_codes (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- QR Token
    token VARCHAR(64) UNIQUE NOT NULL,

    -- Usage Status
    is_used BOOLEAN DEFAULT FALSE,
    used_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Batch Reference
    batch_id UUID,
    batch_name VARCHAR(255),

    -- Admin Info
    generated_by_admin VARCHAR(255),

    -- Timestamps
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '90 days',

    -- Metadata
    notes TEXT
);

-- Indexes
CREATE INDEX idx_qr_codes_token ON qr_codes(token);
CREATE INDEX idx_qr_codes_is_used ON qr_codes(is_used);
CREATE INDEX idx_qr_codes_expires_at ON qr_codes(expires_at);
CREATE INDEX idx_qr_codes_batch_id ON qr_codes(batch_id);
CREATE INDEX idx_qr_codes_generated_at ON qr_codes(generated_at DESC);
CREATE INDEX idx_qr_codes_unused_not_expired ON qr_codes(is_used, expires_at)
    WHERE is_used = FALSE AND expires_at > NOW();

-- Auto-cleanup trigger (for expired QR codes)
CREATE OR REPLACE FUNCTION cleanup_expired_qr()
RETURNS void AS $$
BEGIN
    DELETE FROM qr_codes WHERE expires_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;
```

### 3. NOTIFICATIONS TABLE (Audit Trail)

```sql
CREATE TABLE notifications (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Recipient
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Sender Information
    sender_ip VARCHAR(45) NOT NULL,
    sender_phone VARCHAR(20),
    sender_device_id VARCHAR(255),
    sender_location VARCHAR(255),                   -- Optional: for future analytics

    -- Notification Content
    notification_types TEXT[] NOT NULL,             -- Array: 'blocking_traffic', 'wrong_parking', etc.
    custom_message TEXT,

    -- Delivery Status
    delivered_via TEXT[] DEFAULT '{}',              -- 'push', 'telegram', 'email'
    push_delivered BOOLEAN DEFAULT false,
    telegram_delivered BOOLEAN DEFAULT false,
    email_delivered BOOLEAN DEFAULT false,

    -- Delivery Attempts
    delivery_attempts INTEGER DEFAULT 0,
    last_delivery_attempt TIMESTAMP WITH TIME ZONE,
    next_retry_at TIMESTAMP WITH TIME ZONE,

    -- Read Status
    was_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    request_id VARCHAR(255),                        -- For tracing

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_sender_ip_date ON notifications(sender_ip, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, was_read)
    WHERE was_read = FALSE;
CREATE INDEX idx_notifications_user_today ON notifications(user_id, created_at DESC)
    WHERE created_at::date = CURRENT_DATE;

-- Trigger
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Partitioning by month (for performance)
CREATE TABLE notifications_2024_01 PARTITION OF notifications
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE notifications_2024_02 PARTITION OF notifications
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- ... (continue for each month)
```

### 4. DAILY_LIMITS TABLE

```sql
CREATE TABLE daily_limits (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Rate Limit Keys
    sender_ip VARCHAR(45),                          -- For visitor limits
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- For owner limits

    -- Date (UTC)
    date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Counts
    sent_count INTEGER DEFAULT 0 CHECK (sent_count >= 0 AND sent_count <= 100),
    received_count INTEGER DEFAULT 0 CHECK (received_count >= 0 AND received_count <= 100),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT either_ip_or_user CHECK (
        (sender_ip IS NOT NULL AND user_id IS NULL) OR
        (sender_ip IS NULL AND user_id IS NOT NULL)
    ),
    UNIQUE(sender_ip, date),
    UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX idx_daily_limits_ip_date ON daily_limits(sender_ip, date);
CREATE INDEX idx_daily_limits_user_date ON daily_limits(user_id, date);
CREATE INDEX idx_daily_limits_date ON daily_limits(date DESC);

-- Trigger
CREATE TRIGGER update_daily_limits_updated_at BEFORE UPDATE ON daily_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-cleanup (keep only 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM daily_limits WHERE date < CURRENT_DATE - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
```

### 5. STATISTICS TABLE

```sql
CREATE TABLE statistics (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Date (aggregation key)
    date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,

    -- User Metrics
    total_users INTEGER DEFAULT 0,
    new_users_today INTEGER DEFAULT 0,
    active_users_today INTEGER DEFAULT 0,
    active_users_week INTEGER DEFAULT 0,
    active_users_month INTEGER DEFAULT 0,

    -- Notification Metrics
    total_notifications INTEGER DEFAULT 0,
    notifications_today INTEGER DEFAULT 0,
    successful_notifications INTEGER DEFAULT 0,
    failed_notifications INTEGER DEFAULT 0,
    notifications_by_type JSONB,                    -- {type: count}

    -- Performance Metrics
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    api_response_time_ms NUMERIC,                   -- Average
    peak_hour VARCHAR(2),
    peak_hour_requests INTEGER,

    -- QR Metrics
    total_qr_codes_generated INTEGER DEFAULT 0,
    qr_codes_used INTEGER DEFAULT 0,
    qr_codes_unused INTEGER DEFAULT 0,
    inactive_qr_codes INTEGER DEFAULT 0,

    -- Geographic Metrics
    users_by_country JSONB,                         -- {KG: 800, RU: 450}
    users_by_language JSONB,                        -- {ru: 900, ky: 250, en: 100}

    -- Engagement
    avg_notifications_per_user NUMERIC,
    engagement_rate NUMERIC,                        -- %

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_statistics_date ON statistics(date DESC);
CREATE UNIQUE INDEX idx_statistics_date_unique ON statistics(date);

-- Trigger
CREATE TRIGGER update_statistics_updated_at BEFORE UPDATE ON statistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 6. ADMIN_SESSIONS TABLE

```sql
CREATE TABLE admin_sessions (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Admin Identity
    admin_id VARCHAR(255) NOT NULL,

    -- Token Security
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    token_prefix VARCHAR(10),                       -- For token rotation

    -- Session Info
    ip_address VARCHAR(45),
    user_agent TEXT,

    -- Session Lifecycle
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Indexes
CREATE INDEX idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX idx_admin_sessions_token_hash ON admin_sessions(token_hash);
CREATE INDEX idx_admin_sessions_expires_at ON admin_sessions(expires_at);

-- Auto-cleanup (remove expired sessions)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM admin_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

---

## 🔄 Helper Functions

### Update Timestamp Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Get Daily Stats

```sql
CREATE OR REPLACE FUNCTION get_daily_stats(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    total_users BIGINT,
    notifications_sent BIGINT,
    success_rate NUMERIC,
    avg_response_time NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM users WHERE DATE(created_at) <= p_date)::BIGINT,
        (SELECT COUNT(*) FROM notifications WHERE DATE(created_at) = p_date)::BIGINT,
        (SELECT COUNT(*) FILTER (WHERE delivered_via IS NOT NULL)::NUMERIC /
                NULLIF(COUNT(*), 0) * 100 FROM notifications WHERE DATE(created_at) = p_date)::NUMERIC,
        (SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)))
         FROM notifications WHERE DATE(created_at) = p_date)::NUMERIC;
END;
$$ LANGUAGE plpgsql;
```

### Check User Rate Limit

```sql
CREATE OR REPLACE FUNCTION check_user_rate_limit(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (can_send BOOLEAN, remaining INTEGER) AS $$
DECLARE
    v_received_count INTEGER;
BEGIN
    SELECT COALESCE(received_count, 0) INTO v_received_count
    FROM daily_limits
    WHERE user_id = p_user_id AND date = p_date;

    RETURN QUERY SELECT
        (v_received_count < 10),
        (10 - v_received_count);
END;
$$ LANGUAGE plpgsql;
```

---

## 📈 Performance Recommendations

### Query Optimization

```sql
-- Before: Slow (full table scan)
SELECT COUNT(*) FROM notifications;

-- After: Fast (aggregated table)
SELECT total_notifications FROM statistics WHERE date = CURRENT_DATE;

-- Before: Slow (aggregation on demand)
SELECT type, COUNT(*) FROM notifications GROUP BY type;

-- After: Fast (pre-aggregated in JSONB)
SELECT notifications_by_type FROM statistics WHERE date = CURRENT_DATE;
```

### Connection Pooling

```bash
# Use PgBouncer for production
[databases]
exelix_db = host=localhost port=5432 dbname=exelix_db user=exelix_user password=****

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
```

### Maintenance Tasks

```sql
-- Vacuum and analyze (weekly)
VACUUM ANALYZE notifications;
VACUUM ANALYZE users;

-- Update statistics (daily)
INSERT INTO statistics (date, ...)
VALUES (CURRENT_DATE, ...)
ON CONFLICT (date) DO UPDATE SET ...;

-- Archive old data (monthly)
INSERT INTO notifications_archive
SELECT * FROM notifications
WHERE created_at < NOW() - INTERVAL '1 year';
DELETE FROM notifications
WHERE created_at < NOW() - INTERVAL '1 year';

-- Backup (daily)
pg_dump exelix_db | gzip > backups/exelix_$(date +%Y%m%d).sql.gz
```
