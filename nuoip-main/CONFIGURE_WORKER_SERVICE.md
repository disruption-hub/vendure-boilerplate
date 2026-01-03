# Configure Worker Service Start Command

## Current Situation

The service `nuoip-worker` has been created, but it needs to be configured with the correct start command.

## Solution: Set Start Command in Railway Dashboard

Since Railway uses the `railway.json` from the repository (which is configured for the NestJS backend), you need to override the start command for the worker service in the Railway Dashboard.

### Steps:

1. **Go to Railway Dashboard:**
   - Visit: https://railway.app/project/99370a3c-0bda-423f-b4ff-7697000cfcb1
   - Click on service: **`nuoip-worker`**

2. **Configure Start Command:**
   - Go to **Settings** → **Deploy**
   - Find **"Start Command"** field
   - Set it to: `cd apps/backend && npm run worker:baileys`
   - Click **Save**

3. **Verify Root Directory:**
   - Go to **Settings** → **Service Settings**
   - **Root Directory**: Should be empty (uses root `nixpacks.toml`)
   - If it's set to something else, clear it

4. **Redeploy:**
   - Go to **Deployments** tab
   - Click **"Redeploy"** on the latest deployment
   - Or trigger a new deployment by pushing to GitHub

## Alternative: Use Railway CLI (if supported)

You can try setting it via CLI, but the dashboard method is more reliable:

```bash
# Link to worker service
railway link --service nuoip-worker

# The startCommand in railway.json will be used
# But you may need to override it in dashboard
```

## Verification

After configuring, check the logs:

```bash
railway link --service nuoip-worker
railway logs

# Should see:
# [baileys-worker] Starting Baileys worker service
# [baileys-worker] Services initialized successfully
# [baileys-worker] Worker loop: checking sessions
```

## Summary

- **Service `nuoip`**: Uses `railway.json` → `npm run start:prod` (NestJS Backend)
- **Service `nuoip-worker`**: Needs start command set in dashboard → `npm run worker:baileys` (Baileys Worker)

