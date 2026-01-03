# Create Baileys Worker Service in Railway

## Important Note
Railway CLI **does not support creating new services**. Services must be created via the Railway Dashboard.

## Steps to Create Worker Service

### Option 1: Via Railway Dashboard (Recommended)

1. **Go to Railway Dashboard:**
   - Visit: https://railway.app/dashboard
   - Select your project: `brilliant-commitment`

2. **Create New Service:**
   - Click **"+ New"** button (top right)
   - Select **"GitHub Repo"**
   - Choose the same repository: `disruption-hub/nuoip`
   - Name the service: `nuoip-worker` or `baileys-worker`

3. **Configure the Service:**
   - Go to **Settings** → **Service Settings**
   - **Root Directory**: Leave empty (will use root `nixpacks.toml`)
   - Go to **Settings** → **Deploy**
   - **Start Command**: `cd apps/backend && npm run worker:baileys`

4. **Verify Shared Variables:**
   - Go to **Project Settings** → **Variables**
   - Ensure these are set as **Shared Variables**:
     - `DATABASE_URL`
     - `SOKETI_DEFAULT_APP_ID`
     - `SOKETI_DEFAULT_APP_KEY`
     - `SOKETI_DEFAULT_APP_SECRET`
     - `SOKETI_INTERNAL_HOST`
     - `SOKETI_INTERNAL_PORT`
     - `SOKETI_PUBLIC_HOST`
     - `SOKETI_PUBLIC_PORT`
   - Shared variables are automatically available to all services

5. **Deploy:**
   - Railway will automatically detect the push and deploy
   - Or manually trigger: Click **"Deploy"** → **"Redeploy"**

### Option 2: Using Railway CLI (After Creating in Dashboard)

After creating the service in the dashboard, you can link to it:

```bash
# Link to the new worker service
railway link --service nuoip-worker

# Verify configuration
railway status

# View logs
railway logs

# Deploy
railway up
```

## Verification

After creating the service, verify it's running:

```bash
# Link to worker service
railway link --service nuoip-worker

# Check logs
railway logs

# Should see:
# [baileys-worker] Starting Baileys worker service
# [baileys-worker] Services initialized successfully
# [baileys-worker] Worker loop: checking sessions
```

## Configuration Files

- **`railway.json`** → NestJS Backend API (already configured)
- **`railway-worker.json`** → Baileys Worker (reference for start command)

Both services use the same `nixpacks.toml` from the root directory.

