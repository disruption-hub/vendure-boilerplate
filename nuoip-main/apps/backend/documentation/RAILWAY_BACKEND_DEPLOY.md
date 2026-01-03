# Deploy NestJS Backend Only to Railway

## Quick Deploy Steps

### 1. Set Root Directory in Railway Dashboard (REQUIRED)

**This is the most important step:**

1. Go to: https://railway.app/project/zippy-perfection
2. Click service: **profound-healing**
3. Go to **Settings** → **Service Settings**
4. Find **"Root Directory"** setting
5. Set it to: **`apps/backend`**
6. Click **Save**

### 2. Deploy via Git Push

```bash
# Commit the backend configuration
git add apps/backend/nixpacks.toml apps/backend/railway.json
git commit -m "Deploy NestJS backend to Railway"
git push origin main
```

Railway will automatically:
- Build from `apps/backend` directory
- Use `apps/backend/nixpacks.toml`
- Install dependencies
- Generate Prisma Client
- Build NestJS app
- Deploy the service

### 3. Set Environment Variables

In Railway Dashboard → Variables, set:

```
NEST_AUTH_SECRET=your-jwt-secret
NEXTAUTH_SECRET=your-jwt-secret  # Fallback
HOST=0.0.0.0
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### 4. Run Database Migrations

```bash
railway run --service profound-healing npm run prisma:migrate:deploy
```

### 5. Verify Deployment

```bash
# Check logs
railway logs --service profound-healing

# Get URL
railway domain

# Test health endpoint
curl https://your-railway-url.railway.app/api/v1
```

## What Gets Deployed

✅ **Only NestJS Backend** (`apps/backend/`)
- NestJS application code
- Prisma Client (generated from `packages/prisma/`)
- Production build output

❌ **NOT Deployed:**
- Next.js frontend (`apps/nextjs/`)
- Frontend dependencies
- Frontend build artifacts

## Build Process

1. **Install**: Dependencies for backend and Prisma package
2. **Generate**: Prisma Client from `packages/prisma/schema.prisma`
3. **Build**: NestJS application (`nest build`)
4. **Start**: Production server (`npm run start:prod`)

## API Endpoints

Once deployed, your API will be at:
- Health: `https://your-url.railway.app/api/v1`
- Auth: `https://your-url.railway.app/api/v1/auth/me`
- Admin: `https://your-url.railway.app/api/v1/auth/admin/login`
- Chat: `https://your-url.railway.app/api/v1/auth/chat/request-otp`

