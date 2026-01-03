# Railway NestJS Backend Deployment - Setup Complete

## ✅ Completed Actions

1. ✅ **Configuration Files Created:**
   - `apps/backend/nixpacks.toml` - Build configuration
   - `apps/backend/railway.json` - Railway deployment config
   - `apps/backend/.railwayignore` - Excludes Next.js files

2. ✅ **Code Committed & Pushed:**
   - Committed all Railway configuration files
   - Merged to `master` branch
   - Pushed to GitHub (Railway watches `master`)

3. ✅ **Environment Variables:**
   - `HOST=0.0.0.0` - Set via CLI
   - `DATABASE_URL` - Already configured

## ⚠️ REQUIRED: Dashboard Configuration

**You MUST complete this ONE step in Railway Dashboard:**

### Set Root Directory

1. Go to: **https://railway.app/project/zippy-perfection**
2. Click service: **profound-healing**
3. Go to: **Settings** → **Service Settings**
4. Find: **"Root Directory"** setting
5. Set to: **`apps/backend`**
6. Click **Save**

### Why This Is Required

Railway needs to know to build from `apps/backend` instead of the repository root. Without this, Railway will:
- Try to use root `package.json` (Next.js)
- Fail to find NestJS dependencies
- Build the wrong application

## 🚀 After Setting Root Directory

Railway will automatically:
1. Detect the Git push to `master`
2. Use `apps/backend/nixpacks.toml` for build
3. Install dependencies from `apps/backend/package.json`
4. Generate Prisma Client from `packages/prisma`
5. Build NestJS application
6. Deploy the backend service

## 📝 Additional Environment Variables

Set these in Railway Dashboard → Variables:

- `NEST_AUTH_SECRET` - JWT secret (or use `NEXTAUTH_SECRET`)
- `ALLOWED_ORIGINS` - Comma-separated CORS origins
  - Example: `http://localhost:3000,https://yourdomain.com`

## 🔄 Run Database Migrations

After successful deployment:

```bash
railway run --service profound-healing npm run prisma:migrate:deploy
```

## 📊 Monitor Deployment

```bash
# Watch logs in real-time
railway logs --service profound-healing --follow

# Check deployment status
railway deployment list --service profound-healing

# Get service URL
railway domain
```

## ✅ Verify Deployment

Once deployed, test the API:

```bash
# Health check
curl https://your-railway-url.railway.app/api/v1

# Auth endpoint (requires token)
curl https://your-railway-url.railway.app/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🎯 Next Steps

1. Set root directory in dashboard (REQUIRED)
2. Wait for automatic deployment
3. Set remaining environment variables
4. Run database migrations
5. Update Next.js frontend to use backend URL
6. Test the integration

## 📖 Files Reference

- Configuration: `apps/backend/nixpacks.toml`
- Railway Config: `apps/backend/railway.json`
- Deployment Guide: `apps/backend/RAILWAY_DEPLOYMENT.md`
- Quick Guide: `RAILWAY_BACKEND_DEPLOY.md`

