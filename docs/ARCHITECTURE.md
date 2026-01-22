# EXELIX Architecture

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────┐
│   Client (PWA)  │
│  (Next.js App)  │
└────────┬────────┘
         │ HTTPS
         │
┌────────▼─────────────────────────┐
│      Next.js Frontend            │
│  - SSR/SSG                       │
│  - API Routes (Proxy)            │
│  - PWA Service Worker            │
└────────┬─────────────────────────┘
         │
         │ REST API
         │
┌────────▼─────────────────────────┐
│    Express Backend API           │
│  - Authentication (JWT)           │
│  - Business Logic                │
│  - Rate Limiting                 │
│  - Validation                    │
└────────┬─────────────────────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    │         │          │          │
┌───▼───┐ ┌──▼───┐ ┌────▼────┐ ┌───▼────┐
│PostgreSQL│ │ Redis │ │Telegram│ │WebPush│
│          │ │(Cache)│ │  Bot   │ │Service│
└──────────┘ └───────┘ └────────┘ └───────┘
```

## 📁 Project Structure

### Frontend (`frontend/`)

```
frontend/
├── app/                    # Next.js App Router
│   ├── (public)/          # Public routes
│   │   ├── page.tsx       # Home page
│   │   └── qr/            # QR code access
│   ├── (auth)/            # Auth routes
│   │   ├── register/      # Registration flow
│   │   └── dashboard/     # Owner dashboard
│   ├── admin/             # Admin panel
│   ├── api/               # API routes (proxy)
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # UI primitives
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── lib/                  # Utilities
│   ├── i18n/            # i18n configuration
│   ├── api/             # API client
│   └── utils/           # Helpers
├── public/              # Static assets
│   ├── icons/           # PWA icons
│   └── manifest.json    # PWA manifest
├── locales/             # Translation files
│   ├── ru.json
│   ├── ky.json
│   └── en.json
└── middleware.ts        # Next.js middleware
```

### Backend (`backend/`)

```
backend/
├── src/
│   ├── config/          # Configuration
│   │   ├── database.ts  # DB connection
│   │   └── redis.ts     # Redis connection
│   ├── controllers/     # Route handlers
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── qr.ts
│   │   ├── notifications.ts
│   │   └── admin.ts
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts      # JWT auth
│   │   ├── rateLimit.ts # Rate limiting
│   │   └── validation.ts
│   ├── models/          # Database models
│   │   ├── User.ts
│   │   ├── QRCode.ts
│   │   ├── Notification.ts
│   │   └── Admin.ts
│   ├── routes/          # API routes
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── qr.ts
│   │   ├── notifications.ts
│   │   └── admin.ts
│   ├── services/        # Business logic
│   │   ├── qrService.ts
│   │   ├── notificationService.ts
│   │   ├── telegramService.ts
│   │   └── pushService.ts
│   ├── utils/           # Utilities
│   │   ├── jwt.ts
│   │   ├── validation.ts
│   │   └── errors.ts
│   └── app.ts           # Express app
├── migrations/          # DB migrations
├── seeds/               # Seed data
└── tests/               # Tests
```

## 🔄 Data Flow

### Registration Flow

1. User scans QR code → Frontend extracts token
2. Frontend sends token to `/api/qr/validate`
3. Backend validates token, checks if used
4. If valid → Registration form
5. User fills form → `/api/auth/register`
6. Backend creates user, marks QR as used
7. Frontend redirects to dashboard

### Notification Flow

1. User scans QR → Frontend shows notification form
2. User selects notifications → `/api/notifications/send`
3. Backend checks rate limits
4. Backend sends:
   - Push notification (if subscribed)
   - Telegram message (if configured)
5. Backend logs notification
6. Frontend shows success message

## 🔐 Security

- JWT tokens with expiration
- Rate limiting per IP/user
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- CORS configuration
- HTTPS only in production
- Secure cookie settings

## 📊 Scalability Considerations

- Database indexing on frequently queried fields
- Redis caching for:
  - QR code validation
  - Rate limit counters
  - User sessions
- Connection pooling (PostgreSQL)
- CDN for static assets
- Horizontal scaling ready (stateless API)

## 🚀 Performance Optimizations

- Next.js SSR/SSG for public pages
- Image optimization
- Code splitting
- Lazy loading
- Database query optimization
- Response compression
- Caching headers
