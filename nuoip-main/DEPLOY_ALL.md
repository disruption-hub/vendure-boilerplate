# 🚀 Deploy to Railway and Vercel

This guide helps you deploy IPNUO to both Railway (Backend + Worker) and Vercel (Frontend).

## Quick Deploy

### Option 1: Interactive Script (Recommended)

```bash
./deploy-all.sh
```

This script will:
- ✅ Check prerequisites (Git, Railway CLI, Vercel CLI)
- ✅ Check git status and offer to commit changes
- ✅ Let you choose what to deploy (Railway, Vercel, or both)
- ✅ Guide you through the deployment process

### Option 2: Manual Deployment

#### Deploy to Railway

Railway auto-deploys from Git. Simply push your code:

```bash
# Commit your changes
git add .
git commit -m "Deploy to Railway and Vercel"
git push origin main
```

Railway will automatically:
1. Detect the push
2. Build both services:
   - **Backend API** (NestJS) - uses `railway.json`
   - **Baileys Worker** - uses `railway-worker.json`
3. Deploy using `nixpacks.toml` configuration

**Monitor deployment:**
- Dashboard: https://railway.app/dashboard
- Logs: `railway logs` (if CLI installed)

#### Deploy to Vercel

**Option A: Via Git (Auto-deploy)**

If your Vercel project is connected to Git:
```bash
git push origin main
```

Vercel will automatically deploy.

**Option B: Via Vercel CLI**

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

**Option C: Via Vercel Dashboard**

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click "Deploy" → "Redeploy" (or it will auto-deploy from Git)

## Prerequisites

### Railway

1. **Railway Account**: https://railway.app
2. **Railway CLI** (optional but recommended):
   ```bash
   npm i -g @railway/cli
   railway login
   ```
3. **Services Created**:
   - Backend API service (NestJS)
   - Baileys Worker service
4. **Environment Variables Set** (in Railway Project Settings → Variables):
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `SOKETI_DEFAULT_APP_ID`
   - `SOKETI_DEFAULT_APP_KEY`
   - `SOKETI_DEFAULT_APP_SECRET`
   - `SOKETI_INTERNAL_HOST`
   - `SOKETI_INTERNAL_PORT`
   - `SOKETI_PUBLIC_HOST`
   - `SOKETI_PUBLIC_PORT`

### Vercel

1. **Vercel Account**: https://vercel.com
2. **Vercel CLI** (optional but recommended):
   ```bash
   npm i -g vercel
   vercel login
   ```
3. **Project Connected** to Git repository
4. **Environment Variables Set** (in Vercel Project Settings → Environment Variables):
   - `DATABASE_URL`
   - `DATABASE_PUBLIC_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your Vercel app URL)
   - `NEXT_PUBLIC_BACKEND_URL` (Railway backend URL)
   - `BACKEND_URL` (Railway backend URL)

## Configuration Files

### Railway

- **`railway.json`**: Backend API service configuration
- **`railway-worker.json`**: Baileys Worker service configuration
- **`nixpacks.toml`**: Build configuration (shared by both services)

### Vercel

- **`vercel.json`**: Vercel deployment configuration
- **`apps/nextjs/`**: Next.js application directory

## Deployment Flow

```
┌─────────────────┐
│  Git Push       │
└────────┬────────┘
         │
         ├─────────────────┬─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌────────────────┐ ┌──────────────┐ ┌──────────────┐
│ Railway        │ │ Railway      │ │ Vercel       │
│ Backend API    │ │ Baileys      │ │ Frontend     │
│ (Auto-deploy)  │ │ Worker       │ │ (Auto-deploy)│
│                │ │ (Auto-deploy)│ │              │
└────────────────┘ └──────────────┘ └──────────────┘
```

## Verification

### Railway Services

```bash
# Check backend service
railway link --service "Nest Backend"  # or your service name
railway logs

# Check worker service
railway link --service "Baileys Worker"  # or your service name
railway logs
```

**Expected logs:**
- Backend: `✅ Application is running on: http://0.0.0.0:PORT`
- Worker: `[baileys-worker] Starting Baileys worker service`

### Vercel Deployment

1. Check deployment status: https://vercel.com/dashboard
2. Visit your app URL: `https://your-app.vercel.app`
3. Test endpoints:
   - Homepage: `https://your-app.vercel.app`
   - Admin: `https://your-app.vercel.app/admin`
   - API: `https://your-app.vercel.app/api/health`

## Troubleshooting

### Railway Deployment Issues

**Problem**: Build fails
- **Solution**: Check `nixpacks.toml` configuration
- **Solution**: Verify Node.js version (should be 20.19.0+)
- **Solution**: Check Railway logs: `railway logs`

**Problem**: Services not starting
- **Solution**: Verify environment variables are set
- **Solution**: Check start commands in Railway dashboard
- **Solution**: Verify `DATABASE_URL` is correct

**Problem**: Prisma Client not found
- **Solution**: Prisma Client is generated during build
- **Solution**: Check build logs for Prisma generation step

### Vercel Deployment Issues

**Problem**: Build fails with Prisma errors
- **Solution**: Verify `installCommand` in `vercel.json` installs Prisma dependencies
- **Solution**: Check that Prisma schema is accessible

**Problem**: API routes not working
- **Solution**: Verify `NEXT_PUBLIC_BACKEND_URL` is set correctly
- **Solution**: Check Vercel function logs in dashboard

**Problem**: Database connection errors
- **Solution**: Verify `DATABASE_URL` is set correctly
- **Solution**: Check database allows connections from Vercel IPs
- **Solution**: Add `?sslmode=require` if database requires SSL

## Environment Variables Reference

### Railway (Backend + Worker)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | JWT secret key |
| `SOKETI_DEFAULT_APP_ID` | ⚠️ | Soketi App ID (fallback) |
| `SOKETI_DEFAULT_APP_KEY` | ⚠️ | Soketi App Key (fallback) |
| `SOKETI_DEFAULT_APP_SECRET` | ⚠️ | Soketi App Secret (fallback) |
| `SOKETI_INTERNAL_HOST` | ⚠️ | Soketi internal host |
| `SOKETI_INTERNAL_PORT` | ⚠️ | Soketi internal port |
| `SOKETI_PUBLIC_HOST` | ⚠️ | Soketi public host |
| `SOKETI_PUBLIC_PORT` | ⚠️ | Soketi public port |

### Vercel (Frontend)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `DATABASE_PUBLIC_URL` | ✅ | Same as DATABASE_URL |
| `NEXTAUTH_SECRET` | ✅ | Secure random secret |
| `NEXTAUTH_URL` | ✅ | Your Vercel app URL |
| `NEXT_PUBLIC_BACKEND_URL` | ✅ | Railway backend URL |
| `BACKEND_URL` | ✅ | Railway backend URL |

**Note**: `OPENROUTER_API_KEY` and `BREVO_API_KEY` are **NOT** environment variables. They are stored in the database and configured via the Admin Panel.

## Post-Deployment

1. **Run Database Migrations** (if needed):
   ```bash
   # Railway
   railway run --service "Nest Backend" npm run prisma:migrate:deploy
   
   # Or via Vercel (if using Vercel Postgres)
   vercel env pull .env.local
   cd packages/prisma
   npx prisma migrate deploy
   ```

2. **Configure API Keys** (via Admin Panel):
   - Log into Admin Panel: `https://your-app.vercel.app/admin`
   - Go to System Settings → OpenRouter (for chatbot AI)
   - Go to System Settings → Brevo Email (for email notifications)

3. **Test Application**:
   - Test homepage
   - Test chatbot
   - Test admin panel
   - Test WhatsApp integration (if configured)

## Quick Commands

```bash
# Deploy everything (interactive)
./deploy-all.sh

# Deploy to Railway only (via git)
git push origin main

# Deploy to Vercel only (via CLI)
vercel --prod

# Check Railway logs
railway logs

# Check Vercel deployment
vercel ls
```

## Need Help?

- **Railway**: Check Railway dashboard logs
- **Vercel**: Check Vercel deployment logs
- **Documentation**: See `VERCEL_DEPLOY.md` and `RAILWAY_SERVICES_SETUP.md`

