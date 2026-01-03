# Deploy NestJS Backend to Railway - CLI Instructions

## Prerequisites

✅ Railway CLI is installed and authenticated
✅ Project is linked: `zippy-perfection`
✅ Service exists: `profound-healing`

## Step 1: Configure Root Directory (REQUIRED)

**IMPORTANT**: Railway must build from `apps/backend` directory.

### Via Railway Dashboard (Recommended)

1. Go to: https://railway.app/project/zippy-perfection
2. Click on service: `profound-healing`
3. Go to **Settings** → **Service Settings**
4. Find **"Root Directory"** or **"Working Directory"**
5. Set to: `apps/backend`
6. **Save**

### Via Railway CLI (If Supported)

```bash
# Try to set root directory (may not be supported)
railway service profound-healing --root apps/backend
```

## Step 2: Set Environment Variables

```bash
# Set required environment variables
railway variables set NEST_AUTH_SECRET=your-secret-key
railway variables set NEXTAUTH_SECRET=your-secret-key  # Fallback
railway variables set HOST=0.0.0.0
railway variables set ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# DATABASE_URL is already set (from logs)
```

## Step 3: Deploy via Git (Recommended)

Railway auto-deploys from Git. Commit and push:

```bash
# Commit the Railway configuration
git add apps/backend/nixpacks.toml apps/backend/railway.json
git commit -m "Configure Railway deployment for NestJS backend"

# Push to trigger deployment
git push origin main
```

Railway will automatically:
- Detect the push
- Use `apps/backend` as root (if configured)
- Run the build process
- Deploy the service

## Step 4: Run Database Migrations

After deployment succeeds:

```bash
railway run --service profound-healing npm run prisma:migrate:deploy
```

## Step 5: Verify Deployment

```bash
# Check deployment status
railway status

# View logs
railway logs --service profound-healing

# Get the deployment URL
railway domain
```

## Alternative: Manual Deployment via CLI

If Git deployment doesn't work, you can try:

```bash
# Navigate to backend directory
cd apps/backend

# Link to the service
railway link

# Deploy (this may fail if root directory not set)
railway up
```

## Troubleshooting

### "File too large" Error

This happens when trying to upload the entire repo. Solution:
- Use Git-based deployment instead
- Or ensure Railway is configured to use `apps/backend` as root

### "Cannot find module" Errors

- Verify root directory is set to `apps/backend` in dashboard
- Check that `packages/prisma` dependencies are installed

### Build Fails

Check logs:
```bash
railway logs --service profound-healing
```

Common issues:
- Missing environment variables
- Prisma Client not generated
- Wrong root directory

## Current Configuration

- **Project**: zippy-perfection
- **Service**: profound-healing
- **Root Directory**: Must be set to `apps/backend` in dashboard
- **Build Config**: `apps/backend/nixpacks.toml`
- **Railway Config**: `apps/backend/railway.json`

## Next Steps After Deployment

1. Get the Railway URL: `railway domain`
2. Update Next.js frontend to use the backend URL
3. Set `CHAT_AUTH_BASE_URL` and `ADMIN_AUTH_BASE_URL` in Next.js env vars
4. Test the API endpoints

