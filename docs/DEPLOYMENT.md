# Deployment Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for caching)
- PM2 or similar process manager
- Nginx (for reverse proxy)

## Environment Setup

### Backend Environment Variables

Create `backend/.env`:

```env
# Server
PORT=3001
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=exelix
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
ADMIN_JWT_SECRET=your-admin-jwt-secret-min-32-chars

# CORS
CORS_ORIGIN=https://yourdomain.com

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Web Push (generate with: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:admin@yourdomain.com

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# Redis (optional)
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=true

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

### Frontend Environment Variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_FRONTEND_URL=https://yourdomain.com
```

## Database Setup

1. Create PostgreSQL database:
```bash
createdb exelix
```

2. Run migrations:
```bash
cd backend
npm run migrate
```

3. Seed admin user:
```bash
npm run seed
```

## Backend Deployment

1. Build backend:
```bash
cd backend
npm install
npm run build
```

2. Start with PM2:
```bash
pm2 start dist/index.js --name exelix-backend
pm2 save
pm2 startup
```

## Frontend Deployment

1. Build frontend:
```bash
cd frontend
npm install
npm run build
```

2. Start with PM2:
```bash
pm2 start npm --name exelix-frontend -- start
pm2 save
```

## Nginx Configuration

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 10M;
}
```

## SSL/HTTPS Setup

Use Let's Encrypt:

```bash
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

## VAPID Keys Generation

```bash
npx web-push generate-vapid-keys
```

Add the generated keys to backend `.env`.

## Telegram Bot Setup

1. Create bot via @BotFather on Telegram
2. Get bot token
3. Add token to backend `.env`
4. Users need to start conversation with bot to receive notifications

## Monitoring

### PM2 Monitoring

```bash
pm2 monit
pm2 logs
```

### Database Backup

```bash
pg_dump exelix > backup.sql
```

## Scaling Considerations

1. **Database**: Use connection pooling (already configured)
2. **Redis**: Enable for caching and rate limiting
3. **Load Balancer**: Use Nginx or cloud load balancer
4. **CDN**: Serve static assets via CDN
5. **Horizontal Scaling**: Run multiple backend instances behind load balancer

## Troubleshooting

### Backend won't start
- Check database connection
- Verify environment variables
- Check logs: `pm2 logs exelix-backend`

### Frontend build fails
- Clear `.next` directory
- Reinstall dependencies
- Check Node.js version

### Push notifications not working
- Verify VAPID keys
- Check browser console for errors
- Ensure HTTPS is enabled

### Telegram notifications not working
- Verify bot token
- Check if user started conversation with bot
- Check bot logs
