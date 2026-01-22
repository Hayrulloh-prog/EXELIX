# EXELIX - Car Owner Contact Service via QR Code

## 🚀 Overview

EXELIX is a production-ready web service that allows users to contact car owners through QR codes without exposing personal information publicly.

## 📋 Features

- ✅ QR-code based registration (only system-generated QR codes work)
- ✅ Multi-language support (🇷🇺 Russian, 🇰🇬 Kyrgyz, 🇺🇸 English)
- ✅ Owner dashboard with profile management
- ✅ Notification system (Push + Telegram)
- ✅ Admin panel with statistics
- ✅ PWA support
- ✅ Rate limiting and caching
- ✅ Scalable architecture (20,000+ users)

## 🏗️ Architecture

```
EXELIX/
├── frontend/          # Next.js + Tailwind + i18n + PWA
├── backend/           # Node.js + Express + PostgreSQL
├── docs/              # Documentation
└── docker/            # Docker configurations
```

## 🛠️ Tech Stack

### Frontend
- Next.js 14 (App Router)
- Tailwind CSS
- i18next (internationalization)
- PWA (Progressive Web App)
- React Query (data fetching)

### Backend
- Node.js + Express
- PostgreSQL
- JWT authentication
- Web Push API
- Telegram Bot API
- Rate limiting
- Redis (caching)

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for caching)

### Setup

1. Clone repository
```bash
git clone <repository-url>
cd EXELIX3
```

2. Install dependencies
```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

3. Configure environment variables
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your settings

# Frontend
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with your settings
```

4. Setup database
```bash
cd backend
npm run migrate
```

5. Start development servers
```bash
npm run dev
```

## 📚 Documentation

See [docs/](./docs/) directory for:
- [Architecture](./docs/ARCHITECTURE.md)
- [API Specification](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## 🔐 Environment Variables

See `.env.example` files in `frontend/` and `backend/` directories.

## 📄 License

MIT
