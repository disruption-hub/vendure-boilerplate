# Railway Deployment Simulation

This directory contains scripts to simulate the Railway deployment environment locally, ensuring your application will work when deployed to Railway.

## Scripts

### 1. `test-railway-build.sh` - Build Validation (Recommended First)

This script validates that the build process will work on Railway **without starting the server**. Use this to quickly check if your build is correct.

```bash
./test-railway-build.sh
```

**What it does:**
- ✅ Checks Node.js version (requires 20+)
- ✅ Installs all dependencies (matching Railway's process)
- ✅ Generates Prisma Client
- ✅ Builds the NestJS application
- ✅ Verifies build output exists
- ✅ Checks for path resolution issues

**When to use:**
- Before committing changes
- After modifying build configuration
- To verify dependencies are correct

### 2. `simulate-railway.sh` - Full Simulation

This script runs the complete Railway deployment process **and starts the server**, exactly as Railway would.

```bash
./simulate-railway.sh
```

**What it does:**
- Everything from `test-railway-build.sh`
- Starts the production server using Railway's exact start command
- Server runs until you press Ctrl+C

**When to use:**
- To test the full deployment process
- To verify the server starts correctly
- To test production behavior locally

## Railway Build Process

Based on `nixpacks.toml`, Railway follows these steps:

1. **Setup**: Node.js 20
2. **Install**: 
   - Backend dependencies (`apps/backend`)
   - Prisma package dependencies (`packages/prisma`)
   - Shared packages (`packages/shared-chat-auth`, `packages/domain`)
3. **Build**:
   - Generate Prisma Client
   - Build NestJS application
   - Run `fix-requires.js` to fix module paths
4. **Start**: Run `npm run start:prod` from `apps/backend`

## Environment Variables

Railway requires these environment variables (set them before running simulation):

```bash
# Required
export DATABASE_URL="postgresql://user:password@host:port/database"
export NEST_AUTH_SECRET="your-jwt-secret"  # or NEXTAUTH_SECRET

# Optional (defaults provided)
export PORT=3001
export HOST=0.0.0.0
export NODE_ENV=production
export ALLOWED_ORIGINS="http://localhost:3000,https://yourdomain.com"
```

## Testing Results

✅ **Build Test Results:**
- Node.js version check: ✅
- Dependencies install: ✅
- Prisma Client generation: ✅
- NestJS build: ✅
- Path fixes: ✅
- Build output verification: ✅

## Troubleshooting

### Build Fails

1. **Check Node.js version**: Must be 20+
   ```bash
   node -v  # Should show v20.x.x or higher
   ```

2. **Clean and rebuild**:
   ```bash
   rm -rf apps/backend/dist
   rm -rf apps/backend/node_modules
   ./test-railway-build.sh
   ```

3. **Check for missing packages**:
   - Verify `packages/shared-chat-auth/src/index.ts` exists
   - Verify `packages/domain/src/index.ts` exists

### Server Won't Start

1. **Check environment variables**:
   ```bash
   echo $DATABASE_URL
   echo $NEST_AUTH_SECRET
   ```

2. **Check Prisma Client**:
   ```bash
   cd packages/prisma
   npm run generate
   ```

3. **Check build output**:
   ```bash
   ls -la apps/backend/dist/main.js
   ```

## Next Steps

After successful simulation:

1. ✅ Commit your changes
2. ✅ Push to GitHub (Railway auto-deploys)
3. ✅ Monitor Railway logs: `railway logs --service <service-name>`
4. ✅ Run migrations: `railway run --service <service-name> npm run prisma:migrate:deploy`

## Railway Configuration

**Important**: Railway must be configured with:
- **Root Directory**: Empty (uses root `nixpacks.toml`) OR `apps/backend` (uses `apps/backend/nixpacks.toml`)
- **Build Command**: Auto-detected from `nixpacks.toml`
- **Start Command**: `cd apps/backend && npm run start:prod` (from root) or `npm run start:prod` (from apps/backend)

See `apps/backend/documentation/RAILWAY_DEPLOYMENT.md` for full deployment guide.

