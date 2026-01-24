# EXELIX — Deployment guide (Vercel + Fly + Supabase + Upstash)

This document describes deploying the EXELIX MVP using free/low-cost services.

Overview

- Frontend: Vercel (Next.js)
- Backend (API + worker): Fly.io or Render
- Postgres: Supabase
- Redis (queue): Upstash
- Storage: Supabase Storage

Prerequisites

- GitHub repo for the project
- Accounts: Vercel, Fly.io (or Render), Supabase, Upstash

1. Create Supabase project

- Create project and note `DATABASE_URL` and `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- In Supabase Storage create a bucket `avatars` with public access or configure signed URLs.

2. Create Upstash Redis (optional for queue)

- Create Redis, note `REDIS_URL`.

3. VAPID keys for web-push

- Locally run:

```
cd backend
npm install web-push
node ./dist/scripts/generateVapid.js # or npx tsx src/scripts/generateVapid.ts
```

Copy `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` to backend env.

4. Deploy backend to Fly.io (recommended)

- Install flyctl and login.
- Create app and set secrets:

```
flyctl launch --name exelix-backend
flyctl secrets set DATABASE_URL="<DATABASE_URL>" \
  SUPABASE_URL="<SUPABASE_URL>" SUPABASE_SERVICE_ROLE_KEY="<KEY>" \
  REDIS_URL="<REDIS_URL>" JWT_SECRET="<secret>" ADMIN_JWT_SECRET="<secret2>" \
  VAPID_PUBLIC_KEY="<pub>" VAPID_PRIVATE_KEY="<priv>" \
  TELEGRAM_BOT_TOKEN="<token>" FRONTEND_URL="https://<your-frontend>" CORS_ORIGIN="https://<your-frontend>"
flyctl deploy
```

5. Deploy frontend to Vercel

- Connect GitHub repo in Vercel UI and deploy. Set Environment Variables in Vercel:

```
NEXT_PUBLIC_API_URL=https://<backend-host>/api/v1
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<pub>
```

6. Run worker

- Deploy worker on Fly.io or Render using same repo and run `npx tsx src/worker/notificationWorker.ts` as a separate process. Set same secrets.

7. Verify

- Visit frontend URL, register owner via QR flow, subscribe to push, and send test notifications.

Notes & tips

- Ensure `ALLOW_QR_DEBUG=false` in production.
- Use Supabase Storage for profile images; the backend helper `storageService.uploadAvatar` is added.
- For Telegram onboarding: have owners add their Telegram username in profile and start conversation with the bot.
