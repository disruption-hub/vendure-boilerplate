# Manual Railway Backend Deployment Guide

## 🎯 Quick Start

This guide shows you how to manually deploy the NestJS backend to Railway.

---

## Prerequisites

✅ Railway CLI installed (`railway --version`)  
✅ Logged into Railway (`railway whoami`)  
✅ Project linked: `brilliant commitment`  
✅ Service exists: `profound-healing` (or create new service)  
✅ GitHub repository: `disruption-hub/nuoip`

---

## Step 1: Configure Root Directory (CRITICAL)

**⚠️ This is the most important step - Railway must build from `apps/backend`**

### Via Railway Dashboard (Recommended)

1. Go to: https://railway.app/project/brilliant-commitment
   - Or search for project: **`brilliant commitment`**
2. Click on service: **`nuoip`** (or create a new service)
3. Go to **Settings** → **Service Settings**
4. Find **"Root Directory"** or **"Working Directory"**
5. Set it to: **`apps/backend`**
6. Click **Save**

**Note:** This cannot be done via CLI - must use the dashboard.

---

## Step 2: Set Environment Variables

### Via Railway Dashboard

1. In the service dashboard, go to **Variables** tab
2. Add these required variables:

```bash
# Authentication
NEST_AUTH_SECRET=your-jwt-secret-key-here
NEXTAUTH_SECRET=your-jwt-secret-key-here  # Fallback

# Server Configuration
HOST=0.0.0.0
PORT=3001
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Database (should already be set)
DATABASE_URL=postgresql://user:password@host:port/database
```

### Via Railway CLI

```bash
# Set authentication secrets
railway variables set NEST_AUTH_SECRET=your-secret-key --service profound-healing
railway variables set NEXTAUTH_SECRET=your-secret-key --service profound-healing

# Set server config
railway variables set HOST=0.0.0.0 --service profound-healing
railway variables set PORT=3001 --service profound-healing
railway variables set NODE_ENV=production --service profound-healing

# Set CORS
railway variables set ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com --service profound-healing
```

---

## Step 3: Deploy via Git Push (Automatic)

Railway auto-deploys when you push to the connected branch:

```bash
# From project root
cd /Users/albertosaco/IPNuo

# Commit any pending changes
git add .
git commit -m "Deploy NestJS backend to Railway"

# Push to trigger deployment
git push origin master
```

Railway will automatically:
1. Detect the push
2. Use `apps/backend` as root (if configured in Step 1)
3. Run build process from `apps/backend/nixpacks.toml`
4. Install dependencies
5. Generate Prisma Client
6. Build NestJS app
7. Deploy the service

---

## Step 4: Manual Deployment via CLI

If you want to deploy manually without Git push:

```bash
# From project root
cd /Users/albertosaco/IPNuo

# Link to the service (if not already linked)
railway link

# Select the service
railway service profound-healing

# Deploy
railway up
```

---

## Step 5: Run Database Migrations

After deployment succeeds, run Prisma migrations:

```bash
# Via Railway CLI
railway run --service profound-healing npm run prisma:migrate:deploy

# Or from project root
cd apps/backend
railway run npm run prisma:migrate:deploy
```

---

## Step 6: Verify Deployment

### Check Deployment Status

```bash
# View deployment status
railway status

# View logs
railway logs --service profound-healing

# Follow logs in real-time
railway logs --service profound-healing --follow
```

### Test API Endpoints

```bash
# Get the deployment URL
railway domain --service profound-healing

# Test health endpoint
curl https://your-railway-url.railway.app/api/v1

# Test auth endpoint (requires JWT token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-railway-url.railway.app/api/v1/auth/me
```

---

## Build Process Details

Based on `apps/backend/nixpacks.toml`, Railway will:

1. **Setup Phase:**
   - Install Node.js 18.x and npm 9.x

2. **Install Phase:**
   ```bash
   cd apps/backend && npm install --include=dev
   cd packages/prisma && npm install
   ```

3. **Build Phase:**
   ```bash
   cd packages/prisma && npm run generate
   cd apps/backend && npm run build
   ```

4. **Start Phase:**
   ```bash
   cd apps/backend && npm run start:prod
   ```

---

## Troubleshooting

### Issue: Build fails with "Cannot find module"

**Solution:** Ensure Root Directory is set to `apps/backend` in Railway dashboard.

### Issue: Prisma Client not found

**Solution:** Check that Prisma generation runs before build:
```bash
railway logs --service profound-healing | grep prisma
```

### Issue: Service returns 502 Bad Gateway

**Solution:** 
1. Check logs: `railway logs --service profound-healing`
2. Verify `HOST=0.0.0.0` is set
3. Check if service is running: `railway status`

### Issue: CORS errors

**Solution:** Set `ALLOWED_ORIGINS` environment variable with your frontend URL.

---

## Current Configuration

- **Project:** `brilliant commitment`
- **Service:** `profound-healing` (or your service name)
- **Root Directory:** `apps/backend` (must be set in dashboard)
- **Build Config:** `apps/backend/nixpacks.toml`
- **Start Command:** `cd apps/backend && npm run start:prod`
- **Health Check:** `/api/v1`

---

## Quick Reference Commands

```bash
# Login to Railway
railway login

# Link project
railway link

# Select service
railway service profound-healing

# View logs
railway logs --service profound-healing

# Set variable
railway variables set KEY=value --service profound-healing

# Run command in service
railway run --service profound-healing COMMAND

# Deploy
railway up

# Get service URL
railway domain --service profound-healing
```

---

## Next Steps

After successful deployment:

1. ✅ Test the health endpoint
2. ✅ Run database migrations
3. ✅ Configure frontend to use the Railway API URL
4. ✅ Set up custom domain (optional)
5. ✅ Monitor logs for any issues

---

**Repository:** `disruption-hub/nuoip`  
**Railway Project:** `brilliant commitment`  
**Service:** `profound-healing` (or your service name)

