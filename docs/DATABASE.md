# Database Schema

## ER Diagram

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │
│ qr_token (FK)   │──┐
│ first_name      │  │
│ last_name       │  │
│ phone           │  │
│ phone_country   │  │
│ telegram        │  │
│ avatar_url      │  │
│ status          │  │
│ language        │  │
│ push_subscription│ │
│ created_at      │  │
│ updated_at      │  │
└─────────────────┘  │
                      │
┌─────────────────┐   │
│     qr_codes    │◄──┘
├─────────────────┤
│ id (PK)         │
│ token (UNIQUE)  │
│ is_used         │
│ used_by_id (FK) │
│ used_at         │
│ created_at      │
└─────────────────┘

┌─────────────────┐
│  notifications  │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │──┐
│ sender_ip       │  │
│ notification_type│ │
│ message         │  │
│ created_at      │  │
└─────────────────┘  │
                     │
┌─────────────────┐  │
│  rate_limits    │  │
├─────────────────┤  │
│ id (PK)         │  │
│ user_id (FK)    │──┘
│ ip_address      │
│ type            │
│ count           │
│ reset_at        │
│ created_at      │
└─────────────────┘

┌─────────────────┐
│     admins      │
├─────────────────┤
│ id (PK)         │
│ username        │
│ password_hash   │
│ created_at      │
│ last_login      │
└─────────────────┘
```

## Tables

### users

Stores car owner information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | User ID |
| qr_token | VARCHAR(255) | UNIQUE, NOT NULL | QR code token (FK to qr_codes) |
| first_name | VARCHAR(100) | NOT NULL | First name |
| last_name | VARCHAR(100) | NOT NULL | Last name |
| phone | VARCHAR(20) | NOT NULL | Phone number |
| phone_country | VARCHAR(2) | NOT NULL | Country code (KG/RU) |
| telegram | VARCHAR(100) | NULL | Telegram username |
| avatar_url | TEXT | NULL | Avatar image URL |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'closed' | Status: 'open' or 'closed' |
| language | VARCHAR(5) | NOT NULL, DEFAULT 'ru' | Language: 'ru', 'ky', 'en' |
| push_subscription | JSONB | NULL | Web Push subscription |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Update timestamp |

**Indexes:**
- `idx_users_qr_token` on `qr_token`
- `idx_users_phone` on `phone`
- `idx_users_status` on `status`

### qr_codes

Stores generated QR codes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | QR code ID |
| token | VARCHAR(255) | UNIQUE, NOT NULL | Unique token |
| is_used | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether QR is used |
| used_by_id | UUID | NULL, FK users.id | User who used this QR |
| used_at | TIMESTAMP | NULL | When QR was used |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_qr_codes_token` on `token` (UNIQUE)
- `idx_qr_codes_is_used` on `is_used`

### notifications

Stores sent notifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Notification ID |
| user_id | UUID | NOT NULL, FK users.id | Recipient user |
| sender_ip | VARCHAR(45) | NOT NULL | Sender IP address |
| notification_type | VARCHAR(50) | NOT NULL | Type of notification |
| message | TEXT | NULL | Additional message |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_notifications_user_id` on `user_id`
- `idx_notifications_created_at` on `created_at`

### rate_limits

Tracks rate limiting for notifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Rate limit ID |
| user_id | UUID | NULL, FK users.id | User ID (if authenticated) |
| ip_address | VARCHAR(45) | NOT NULL | IP address |
| type | VARCHAR(20) | NOT NULL | Type: 'sender' or 'receiver' |
| count | INTEGER | NOT NULL, DEFAULT 0 | Current count |
| reset_at | TIMESTAMP | NOT NULL | Reset timestamp |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_rate_limits_user_ip` on `(user_id, ip_address, type)`
- `idx_rate_limits_reset_at` on `reset_at`

### admins

Stores admin users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Admin ID |
| username | VARCHAR(100) | UNIQUE, NOT NULL | Admin username |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| last_login | TIMESTAMP | NULL | Last login timestamp |

**Indexes:**
- `idx_admins_username` on `username` (UNIQUE)

## Relationships

- `users.qr_token` → `qr_codes.token` (One-to-One)
- `qr_codes.used_by_id` → `users.id` (One-to-One, nullable)
- `notifications.user_id` → `users.id` (Many-to-One)
- `rate_limits.user_id` → `users.id` (Many-to-One, nullable)

## Constraints

- QR code can only be used once (`is_used = TRUE`)
- User must have unique QR token
- Phone number should be unique per country
- Rate limits reset daily (24 hours)
