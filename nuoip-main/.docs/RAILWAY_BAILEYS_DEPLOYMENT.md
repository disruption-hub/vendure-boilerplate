# Railway Baileys Worker Deployment Guide

This guide explains how to deploy the Baileys WhatsApp worker service to Railway.

## Overview

The Baileys worker is a persistent service that maintains WhatsApp socket connections for all active sessions. It runs separately from the Next.js application and needs to be deployed as a dedicated Railway service.

## Prerequisites

1. Railway account with access to project `2964b791-6c57-4f76-9d93-6e6960ec8e2a`
2. Database connection string configured in Railway environment variables
3. All required environment variables (see below)

## Required Environment Variables

Make sure these are set in your Railway service:

```bash
# Database
DATABASE_URL=postgresql://...

# Soketi (for real-time updates)
SOKETI_HOST=soketi-production-2f36.up.railway.app
SOKETI_PORT=443
SOKETI_USE_TLS=true
SOKETI_APP_ID=your-app-id
SOKETI_APP_KEY=your-app-key
SOKETI_APP_SECRET=your-app-secret

# Baileys (optional)
BAILEYS_FALLBACK_VERSION=2.3000.0
```

## Deployment Steps

### Option 1: Deploy via Railway Dashboard

1. **Go to Railway Dashboard**
   - Navigate to your project: `2964b791-6c57-4f76-9d93-6e6960ec8e2a`
   - Or create a new service in your project

2. **Create New Service**
   - Click "New" → "Empty Service"
   - Name it: `whatsapp-baileys-worker`

3. **Connect Repository**
   - Click "Connect GitHub" or "Deploy from GitHub repo"
   - Select this repository (`IPNuo`)
   - Railway will detect the `railway.json` configuration

4. **Configure Service**
   - **Root Directory**: `/` (root of repository)
   - **Build Command**: `npm install && npm run build` (or Railway will auto-detect)
   - **Start Command**: `npm run worker:baileys`
   - Railway will use the `railway.json` configuration automatically

5. **Set Environment Variables**
   - Go to the service → "Variables" tab
   - Add all required environment variables listed above
   - Make sure `DATABASE_URL` points to your PostgreSQL database

6. **Deploy**
   - Railway will automatically deploy when you push to the connected branch
   - Or click "Deploy" to trigger a manual deployment

### Option 2: Deploy via Railway CLI (if CLI works)

If the Railway CLI is working on your machine:

```bash
# Link to project
railway link --project 2964b791-6c57-4f76-9d93-6e6960ec8e2a

# Set environment variables (if needed)
railway variables set DATABASE_URL=your-database-url
railway variables set SOKETI_HOST=your-soketi-host
# ... etc

# Deploy
railway up
```

## Verification

After deployment, check the logs:

1. Go to Railway Dashboard → Your Service → "Deployments" → Latest deployment → "View Logs"
2. You should see:
   ```
   [baileys-worker] Starting Baileys worker service
   [baileys-worker] Worker loop: checking sessions
   [baileys-worker] Baileys worker service is running
   ```

3. If there are active WhatsApp sessions, you should see connection attempts:
   ```
   [baileys-worker] Connecting Baileys socket for session
   [whatsapp-socket-manager] Connected to WA
   ```

## How It Works

The worker service:

1. **Checks every 30 seconds** for active WhatsApp sessions in the database
2. **Connects Baileys sockets** for sessions with status `CONNECTING`, `CONNECTED`, or `QR_REQUIRED`
3. **Maintains connections** and handles reconnections automatically
4. **Cleans up** disconnected sessions
5. **Prints QR codes** to logs when needed (check Railway logs to see QR codes)

## Troubleshooting

### Worker not starting
- Check Railway logs for errors
- Verify all environment variables are set correctly
- Ensure `DATABASE_URL` is accessible from Railway

### QR codes not appearing
- Check Railway service logs (QR codes are printed there)
- Verify the session status in the database is `QR_REQUIRED`
- Check that the Baileys socket manager is connecting correctly

### Connections not staying alive
- Railway services restart on failure - check restart policy in `railway.json`
- Verify the database connection is stable
- Check for memory/CPU limits in Railway

### API routes not working
- The worker only maintains Baileys connections
- API routes (`/api/whatsapp/*`) should still be deployed separately (e.g., on Vercel)
- Make sure both services can access the same database

## Monitoring

Monitor the worker service:

1. **Railway Dashboard**: View logs, metrics, and deployment status
2. **Application Logs**: Check for `[baileys-worker]` and `[whatsapp-socket-manager]` log entries
3. **Database**: Query `whatsapp_sessions` table to see session status

## Restarting the Service

To restart the worker:

1. Go to Railway Dashboard → Your Service
2. Click "Redeploy" or "Restart"
3. Or use CLI: `railway redeploy`

## Updating the Worker

To update the worker code:

1. Push changes to your GitHub repository
2. Railway will automatically detect and deploy (if auto-deploy is enabled)
3. Or manually trigger deployment from Railway dashboard

## Notes

- The worker runs continuously and maintains persistent connections
- It's designed to handle multiple WhatsApp sessions simultaneously
- QR codes are printed in Railway logs - check logs to see them
- The worker automatically reconnects on failures
- Sessions are cleaned up when they're no longer active in the database

