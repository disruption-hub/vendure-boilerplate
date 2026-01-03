# Baileys Worker - Standalone Setup

## Overview

The Baileys Worker has been refactored to be **completely independent of NestJS**. It now uses Prisma Client directly, without any NestJS dependencies.

## Changes Made

### 1. New Standalone Components

- **`apps/backend/scripts/baileys-worker-standalone.ts`**: Main worker script (no NestJS)
- **`apps/backend/src/lib/whatsapp/baileys/auth-state-provider-standalone.ts`**: Uses PrismaClient directly
- **`apps/backend/src/lib/whatsapp/baileys/socket-manager-standalone.ts`**: Uses PrismaClient directly, no AdminSystemSettingsService

### 2. Updated Script

The `worker:baileys` script in `package.json` now uses `baileys-worker-standalone.ts`.

## Railway Configuration

### Service: "Baileys Worker"

**Start Command**: `cd apps/backend && npm run worker:baileys`

### Required Environment Variables

The Baileys Worker needs access to:

1. **`DATABASE_URL`** (REQUIRED)
   - Must be linked from the PostgreSQL database service
   - Or manually set as a variable

2. **Soketi Configuration** (for broadcasting QR codes and events):
   - `SOKETI_APP_ID` or `SOKETI_DEFAULT_APP_ID`
   - `SOKETI_APP_KEY` or `SOKETI_DEFAULT_APP_KEY`
   - `SOKETI_APP_SECRET` or `SOKETI_DEFAULT_APP_SECRET`
   - `SOKETI_INTERNAL_HOST` or `SOKETI_HOST` or `SOKETI_PUBLIC_HOST`
   - `SOKETI_INTERNAL_PORT` or `SOKETI_PORT` or `SOKETI_PUBLIC_PORT`
   - `SOKETI_USE_TLS` (optional, defaults to true)

## How to Link Database to Baileys Worker

### Option 1: Link Database Service (Recommended)

1. Go to Railway Dashboard
2. Click on the **"Baileys Worker"** service
3. Go to **"Variables"** tab
4. Click **"Add Reference"**
5. Select your PostgreSQL database service
6. Railway will automatically provide `DATABASE_URL`

### Option 2: Manual Configuration

1. Go to Railway Dashboard
2. Click on the **"Baileys Worker"** service
3. Go to **"Variables"** tab
4. Add variable: `DATABASE_URL`
5. Set value to your PostgreSQL connection string
   - Format: `postgresql://user:password@host:port/database`
   - You can copy this from your Nest Backend service variables

## Shared Variables

If you're using Railway Shared Variables (project-level), the Baileys Worker will automatically have access to:
- `DATABASE_URL` (if linked)
- `SOKETI_DEFAULT_APP_ID`
- `SOKETI_DEFAULT_APP_KEY`
- `SOKETI_DEFAULT_APP_SECRET`
- `SOKETI_INTERNAL_HOST`
- `SOKETI_INTERNAL_PORT`
- `SOKETI_PUBLIC_HOST`
- `SOKETI_PUBLIC_PORT`

## Verification

After deployment, check the logs:

```bash
railway link --service "Baileys Worker"
railway logs
```

You should see:
- `✅ Prisma Client initialized and connected to database`
- `✅ Baileys worker service is running`
- `✅ Worker loop: checking sessions`

If you see `❌ DATABASE_URL is required but not found`, you need to link the database service.

## Architecture

```
Baileys Worker (Standalone)
├── Prisma Client (direct connection)
├── PostgreSQLAuthStateProviderStandalone
├── WhatsAppSocketManager (standalone)
└── Soketi Emitter (uses env vars, no NestJS)
```

**No NestJS dependencies** - The worker is completely independent and can run separately from the NestJS backend.

