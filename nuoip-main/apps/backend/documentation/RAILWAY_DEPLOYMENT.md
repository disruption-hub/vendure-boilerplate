# Railway Deployment Guide for NestJS Backend

## Prerequisites

1. Railway account and CLI installed
2. Railway project created or linked
3. Environment variables configured

## Step 1: Configure Railway Service Root Directory

**IMPORTANT**: Railway must be configured to use `apps/backend` as the root directory.

### Option A: Via Railway Dashboard (Recommended)

1. Go to your Railway project: https://railway.app
2. Select the `ipnuo-backend` service (or create a new service)
3. Go to **Settings** → **Service Settings**
4. Find **"Root Directory"** setting
5. Set it to: `apps/backend`
6. Save changes

### Option B: Via Railway CLI

```bash
# Login to Railway
railway login

# Link to your project (if not already linked)
railway link

# Set the service root directory (if supported by CLI)
railway service --root apps/backend
```

## Step 2: Deploy

### Automatic Deployment (Git Push)

Once the root directory is configured, push to your main branch:

```bash
git add .
git commit -m "Deploy NestJS backend to Railway"
git push origin main
```

Railway will automatically:
1. Detect the `apps/backend` directory
2. Use `apps/backend/nixpacks.toml` for build configuration
3. Install dependencies
4. Generate Prisma Client
5. Build the NestJS app
6. Start the production server

### Manual Deployment

```bash
# From project root
railway up --service ipnuo-backend
```

## Step 3: Configure Environment Variables

Set these in Railway dashboard under **Variables**:

### Required Variables

```bash
DATABASE_URL=postgresql://user:password@host:port/database
NEST_AUTH_SECRET=your-jwt-secret-key
# OR use NEXTAUTH_SECRET as fallback
NEXTAUTH_SECRET=your-jwt-secret-key
PORT=3001
HOST=0.0.0.0
```

### Optional Variables

```bash
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
AUTH_TOKEN_EXPIRES_IN=1h
NODE_ENV=production
```

## Step 4: Run Database Migrations

After deployment, run Prisma migrations:

```bash
# Via Railway CLI
railway run --service ipnuo-backend npm run prisma:migrate:deploy

# Or via Railway dashboard → Deployments → Run Command
```

## Step 5: Verify Deployment

1. Check the deployment logs in Railway dashboard
2. Verify health check: `GET https://your-railway-url.railway.app/api/v1`
3. Test authentication endpoint: `GET https://your-railway-url.railway.app/api/v1/auth/me`

## Build Process

The build process (defined in `nixpacks.toml`) will:

1. **Setup**: Install Node.js 18 and npm 9
2. **Install**: 
   - Install backend dependencies (`npm ci`)
   - Install Prisma package dependencies
3. **Build**:
   - Generate Prisma Client from `packages/prisma/schema.prisma`
   - Build NestJS application (`nest build`)
4. **Start**: Run `npm run start:prod`

## Troubleshooting

### Build Fails: "Cannot find module"

- Verify root directory is set to `apps/backend` in Railway dashboard
- Check that `packages/prisma` has `node_modules` (dependencies installed)

### Prisma Client Not Found

- Ensure `packages/prisma` has `npm ci` run during install phase
- Check that Prisma Client is generated to `../../node_modules/.prisma/client`

### Port Issues

- Railway automatically sets `PORT` environment variable
- Ensure your app listens on `0.0.0.0` (configured in `main.ts`)

### Database Connection

- Verify `DATABASE_URL` is set correctly
- Check that Railway PostgreSQL service is running
- Ensure network access is configured

## Health Check

The health check endpoint is configured at `/api/v1` (root of the API).

Railway will use this to verify the service is running.

## API Endpoints

Once deployed, your API will be available at:

- Health: `https://your-railway-url.railway.app/api/v1`
- Auth: `https://your-railway-url.railway.app/api/v1/auth/me`
- Admin: `https://your-railway-url.railway.app/api/v1/auth/admin/login`
- Chat: `https://your-railway-url.railway.app/api/v1/auth/chat/request-otp`

## Next Steps

After successful deployment:

1. Update Next.js frontend to use the Railway backend URL
2. Set `CHAT_AUTH_BASE_URL` and `ADMIN_AUTH_BASE_URL` in Next.js environment variables
3. Test the integration between frontend and backend

