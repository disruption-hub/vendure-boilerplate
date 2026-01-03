# Fix Baileys Worker Start Command in Railway

## Problem

The "Baileys Worker" service is running the NestJS backend command (`start:prod`) instead of the Baileys worker command (`worker:baileys`).

**Error**: The logs show it's trying to start NestJS (`Starting Nest application...`) and looking for `DATABASE_URL`, which means it's running the wrong command.

## Solution: Update Start Command in Railway Dashboard

The Baileys Worker service must use a **different start command** than the Nest Backend service.

### Step 1: Go to Baileys Worker Service

1. Go to Railway Dashboard: https://railway.app/project/99370a3c-0bda-423f-b4ff-7697000cfcb1
2. Click on the **"Baileys Worker"** service (formerly `nuoip-worker`)

### Step 2: Update Start Command

1. Go to **Settings** → **Deploy** tab
2. Find **"Start Command"** field
3. **Current (WRONG)**: `cd apps/backend && npm run start:prod`
4. **Change to (CORRECT)**: `cd apps/backend && npm run worker:baileys`
5. Click **Save**

### Step 3: Verify the Command

After saving, the start command should be:
```
cd apps/backend && npm run worker:baileys
```

This will run the standalone Baileys worker script (`baileys-worker-standalone.ts`) which:
- Uses PrismaClient directly (no NestJS)
- Does NOT require NestJS dependencies
- Only needs `DATABASE_URL` and Soketi variables

### Step 4: Redeploy

After updating the start command:
1. Railway should automatically redeploy
2. Or manually trigger a redeploy from the Deployments tab
3. Check the logs - you should see:
   - `✅ Starting Baileys worker service (standalone)`
   - `✅ Prisma Client initialized and connected to database`
   - `✅ Baileys worker service is running`
   - `✅ Worker loop: checking sessions`

## Expected Logs (Correct)

When the Baileys Worker is running correctly, you should see:

```
✅ Runtime require hook loaded - directory requires will be fixed automatically
✅ Starting Baileys worker service (standalone)
✅ Prisma Client initialized and connected to database
✅ Baileys worker service is running
✅ Worker loop: checking sessions
```

**NOT** these NestJS logs:
```
❌ [Nest] Starting Nest application...
❌ [InstanceLoader] ConfigHostModule dependencies initialized
❌ Error: DATABASE_URL is required but not found
```

## Service Configuration Summary

### Nest Backend Service
- **Service Name**: "Nest Backend" (formerly `nuoip`)
- **Start Command**: `cd apps/backend && npm run start:prod`
- **Purpose**: HTTP API server (NestJS)
- **Needs**: `DATABASE_URL` + all backend environment variables

### Baileys Worker Service
- **Service Name**: "Baileys Worker" (formerly `nuoip-worker`)
- **Start Command**: `cd apps/backend && npm run worker:baileys` ✅
- **Purpose**: WhatsApp session management (standalone, no NestJS)
- **Needs**: `DATABASE_URL` + Soketi variables

## Troubleshooting

### Still seeing NestJS logs?

**Cause**: The start command wasn't updated or Railway is using cached configuration.

**Solution**:
1. Double-check the start command in Settings → Deploy
2. Make sure it's exactly: `cd apps/backend && npm run worker:baileys`
3. Save and redeploy
4. Clear Railway cache if needed (delete and recreate the service)

### DATABASE_URL error in Baileys Worker?

**Cause**: The Baileys Worker also needs `DATABASE_URL` linked.

**Solution**: 
1. Go to "Baileys Worker" service → Variables tab
2. Click "Add Reference"
3. Select your PostgreSQL database service
4. Railway will auto-provide `DATABASE_URL`

### Both services need DATABASE_URL?

**Yes!** Both services need `DATABASE_URL`:
- **Nest Backend**: For PrismaService (NestJS)
- **Baileys Worker**: For PrismaClient (standalone)

Both can reference the same PostgreSQL database service.

