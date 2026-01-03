# Railway Services Summary

## Service Configuration

### Service 1: `Nest Backend` (formerly `nuoip`) - NestJS Backend API
- **Purpose**: Main HTTP API server
- **Start Command**: `cd apps/backend && npm run start:prod`
- **Configuration**: `railway.json` (root)
- **Endpoints**: `/api/v1/*`
- **Port**: Assigned by Railway (check `PORT` env var)
- **Function**: Handles all HTTP API requests

### Service 2: `Baileys Worker` (formerly `nuoip-worker`) - Baileys WhatsApp Worker
- **Purpose**: WhatsApp session management and QR code generation
- **Start Command**: `cd apps/backend && npm run worker:baileys`
- **Configuration**: `railway-worker.json` (reference)
- **Port**: Not needed (background worker)
- **Function**: 
  - Polls database every 30 seconds for active WhatsApp sessions
  - Manages Baileys socket connections
  - Generates QR codes for WhatsApp authentication
  - Broadcasts events via Soketi to frontend

## Current Status

✅ **`Nest Backend`** (to be renamed from `nuoip`): Configured to run NestJS backend API
✅ **`Baileys Worker`** (to be renamed from `nuoip-worker`): Created and configured to run Baileys worker

## Shared Variables (Both Services)

Both services automatically have access to these shared variables:
- `DATABASE_URL`
- `SOKETI_DEFAULT_APP_ID`
- `SOKETI_DEFAULT_APP_KEY`
- `SOKETI_DEFAULT_APP_SECRET`
- `SOKETI_INTERNAL_HOST`
- `SOKETI_INTERNAL_PORT`
- `SOKETI_PUBLIC_HOST`
- `SOKETI_PUBLIC_PORT`

## Verification

### Check NestJS Backend:
```bash
railway link --service "Nest Backend"
railway logs
# Should see: ✅ Application is running on: http://0.0.0.0:PORT
```

### Check Baileys Worker:
```bash
railway link --service "Baileys Worker"
railway logs
# Should see: [baileys-worker] Starting Baileys worker service
# Should see: [baileys-worker] Worker loop: checking sessions
```

