# Railway Root Directory Configuration

## Problem
Railway is building from the repository root instead of the `backend/` directory. The logs show:
```
copy package.json, package-lock.json, prisma, src/prisma
```

This means Railway is using the root `package.json` (which is for Next.js) instead of `backend/package.json` (which is for NestJS).

## Solution: Configure Root Directory in Railway Dashboard

**CRITICAL**: You must configure the Root Directory in the Railway dashboard:

1. Go to: https://railway.com/project/a3f22a0e-add0-40bc-8bb9-ed353e7fee0d
2. Select the service: `ipnuo-backend`
3. Go to **Settings** → **Service Settings**
4. Set **Root Directory**: `backend`
5. Save changes
6. Redeploy

## Alternative: Use railway.json at root

If Railway doesn't support root directory configuration via CLI, you can create a `railway.json` at the root that points to the backend directory, but the dashboard configuration is the recommended approach.

## Current Status

- ✅ `backend/package.json` has all required dependencies
- ✅ `backend/package-lock.json` is correct
- ✅ Build works locally in `backend/` directory
- ❌ Railway is building from root directory (wrong `package.json`)

## Verification

After configuring root directory, the build logs should show:
```
copy backend/package.json, backend/package-lock.json, ...
```

Instead of:
```
copy package.json, package-lock.json, ...
```

