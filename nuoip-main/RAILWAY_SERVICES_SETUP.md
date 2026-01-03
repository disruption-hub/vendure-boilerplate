# Railway Services Setup - Two Separate Services

## Overview

You need **two separate services** in Railway:

### Service 1: NestJS Backend API
- **Purpose**: Main API server for handling HTTP requests
- **Configuration File**: `railway.json` (root)
- **Start Command**: `cd apps/backend && npm run start:prod`
- **Port**: Railway will assign automatically (check `PORT` env var)
- **Endpoints**: `/api/v1/*`
- **Service Name**: `nuoip` (or your backend service name)

### Service 2: Baileys Worker
- **Purpose**: WhatsApp session management and QR code generation
- **Configuration File**: `railway-worker.json` (root)
- **Start Command**: `cd apps/backend && npm run worker:baileys`
- **Port**: Not needed (background worker)
- **Function**: Polls database every 30 seconds and manages WhatsApp sessions
- **Service Name**: `nuoip-worker` (or create a new service)

## Setup Instructions

### Step 1: Configure NestJS Backend Service

The root `railway.json` is already configured for the NestJS backend:
```json
{
  "deploy": {
    "startCommand": "cd apps/backend && npm run start:prod"
  }
}
```

This service should be your main API service.

### Step 2: Create Baileys Worker Service

1. **In Railway Dashboard:**
   - Go to your Railway project
   - Click "New Service" → "GitHub Repo"
   - Select the same repository
   - Name it: `nuoip-worker` (or similar)

2. **Configure the Worker Service:**
   - Go to Settings → Service Settings
   - Set **Root Directory** to: (empty/root)
   - Railway will use the same `nixpacks.toml` from root

3. **Set Start Command:**
   - Go to Settings → Deploy
   - Set **Start Command** to: `cd apps/backend && npm run worker:baileys`
   - Or use the `railway-worker.json` file as reference

4. **Share Variables:**
   - Both services need access to the same shared variables:
     - `DATABASE_URL`
     - `SOKETI_DEFAULT_APP_ID`
     - `SOKETI_DEFAULT_APP_KEY`
     - `SOKETI_DEFAULT_APP_SECRET`
     - `SOKETI_INTERNAL_HOST`
     - `SOKETI_INTERNAL_PORT`
     - `SOKETI_PUBLIC_HOST`
     - `SOKETI_PUBLIC_PORT`
   - These should be configured as **Shared Variables** in Railway Project Settings

## Verification

### Check NestJS Backend:
```bash
# Get the backend URL
railway domain --service nuoip

# Test health endpoint
curl https://your-backend-url.railway.app/api/v1
```

### Check Baileys Worker:
```bash
# View worker logs
railway logs --service nuoip-worker

# Should see:
# [baileys-worker] Starting Baileys worker service
# [baileys-worker] Worker loop: checking sessions
```

## Current Configuration

- ✅ `railway.json` → NestJS Backend API (`npm run start:prod`)
- ✅ `railway-worker.json` → Baileys Worker (`npm run worker:baileys`)
- ✅ Both use the same `nixpacks.toml` from root
- ✅ Both need access to shared variables (DATABASE_URL, SOKETI_*)

