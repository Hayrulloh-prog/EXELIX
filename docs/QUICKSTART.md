# Quick Start Guide

## Local Development Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd EXELIX3
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb exelix

# Or using psql
psql -U postgres
CREATE DATABASE exelix;
\q
```

### 3. Configure Environment

**Backend** (`backend/.env`):
```env
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=exelix
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=dev-secret-key-change-in-production
ADMIN_JWT_SECRET=admin-dev-secret
CORS_ORIGIN=http://localhost:3000
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

### 4. Run Migrations

```bash
cd backend
npm run migrate
npm run seed
```

### 5. Start Development Servers

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### 6. Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/v1
- Admin Panel: http://localhost:3000/admin
  - Username: `hayrulloh1706@gmail.com`
  - Password: `20050617in`

## Generate QR Codes

1. Login to admin panel
2. Click "Download QR Codes"
3. 100 QR codes will be generated as SVG
4. Print and distribute QR codes

## Testing Flow

1. **Register Owner:**
   - Scan QR code → `/qr?token=...`
   - Fill registration form
   - Complete registration

2. **Send Notification:**
   - Scan same QR code (as different user)
   - Select notification types
   - Send notification

3. **Owner Dashboard:**
   - Owner scans QR code
   - Views profile
   - Manages settings

## Troubleshooting

### Database Connection Error
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `.env`
- Check database exists: `psql -l`

### Port Already in Use
- Change PORT in `.env`
- Kill process: `lsof -ti:3001 | xargs kill`

### Build Errors
- Clear cache: `rm -rf .next node_modules`
- Reinstall: `npm install`

## Next Steps

- Configure VAPID keys for push notifications
- Set up Telegram bot
- Configure production environment
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup
