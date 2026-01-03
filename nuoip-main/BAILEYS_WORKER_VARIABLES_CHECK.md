# Baileys Worker Variables Check - Results

## ✅ Verification Complete

Checked variables for service "Baileys Worker" using Railway CLI.

## Current Variables

The service has these variables:
- ✅ `RAILWAY_ENVIRONMENT` = production
- ✅ `RAILWAY_SERVICE_NAME` = Baileys Worker
- ✅ `RAILWAY_SERVICE_NEST_BACKEND_URL` = nuoip-production.up.railway.app
- ✅ `RAILWAY_SERVICE_SOKETI_URL` = soketi-production-2f36.up.railway.app
- ✅ `START_COMMAND` = cd apps/backend && npm run worker:baileys

## ❌ Missing Variables

- ❌ **`DATABASE_URL`** - NOT FOUND
- ❌ No database-related variables found

## Action Required

### Step 1: Link Database Service

1. Go to Railway Dashboard: https://railway.app/project/99370a3c-0bda-423f-b4ff-7697000cfcb1
2. Click on **"Baileys Worker"** service
3. Go to **"Variables"** tab
4. Click **"Add Reference"**
5. Select your **PostgreSQL database service**
6. Railway will automatically add `DATABASE_URL`

### Step 2: Update Start Command (Optional but Recommended)

The current start command is:
```
cd apps/backend && npm run worker:baileys
```

Consider updating it to use the wrapper script:
```
cd apps/backend && SERVICE_TYPE=worker ./scripts/start-service.sh
```

This provides better service detection and error handling.

### Step 3: Verify After Linking

After linking the database, run:
```bash
railway variables --service "Baileys Worker" | grep DATABASE_URL
```

You should see:
```
DATABASE_URL │ postgresql://... (reference)
```

## Expected Logs After Fix

After linking `DATABASE_URL`, the logs should show:
```
✅ Starting Baileys Worker (standalone - no NestJS)
✅ Runtime require hook loaded
✅ Prisma Client initialized and connected to database
✅ Baileys worker service is running
✅ Worker loop: checking sessions
```

## Summary

- **Service**: Baileys Worker ✅
- **ESM Import Fix**: ✅ Working
- **Service Detection**: ✅ Working
- **DATABASE_URL**: ❌ **MISSING - NEEDS TO BE LINKED**

