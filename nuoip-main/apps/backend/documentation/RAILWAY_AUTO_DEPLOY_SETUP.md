# Railway Auto-Deploy Setup Guide

## 🎯 Enable Automatic Deployment on Git Commit

This guide shows you how to configure Railway to automatically deploy when you push to your repository.

---

## Step 1: Connect GitHub Repository to Railway

### Via Railway Dashboard (Recommended)

1. **Go to Railway Dashboard**
   - Navigate to: https://railway.app/project/nuoip
   - Or search for project: **`nuoip`**

2. **Select or Create Service**
   - Click on service: **`nuoip`**
   - Or create a new service if it doesn't exist

3. **Connect GitHub Repository**
   - Go to **Settings** → **Service Settings**
   - Find **"Source"** or **"Connect GitHub"** section
   - Click **"Connect GitHub"** or **"Deploy from GitHub repo"**
   - If first time, authorize Railway to access your GitHub account
   - Select repository: **`disruption-hub/nuoip`**
   - Select branch: **`master`** (or `main`)
   - Click **"Connect"** or **"Save"**

4. **Enable Auto-Deploy**
   - In the same settings, find **"Auto Deploy"** or **"Deploy on Push"**
   - Toggle it to **ON** or **Enabled**
   - Save changes

---

## Step 2: Verify Configuration

### Check Service Settings

In Railway Dashboard → Service Settings, ensure:

- ✅ **Source**: Connected to `disruption-hub/nuoip`
- ✅ **Branch**: `master` (or your default branch)
- ✅ **Auto Deploy**: Enabled
- ✅ **Root Directory**: `apps/backend` (if deploying backend only)
- ✅ **Build Command**: Auto-detected or from `apps/backend/nixpacks.toml`
- ✅ **Start Command**: `cd apps/backend && npm run start:prod`

---

## Step 3: Test Auto-Deployment

### Make a Test Commit

```bash
# From project root
cd /Users/albertosaco/IPNuo

# Make a small change (or use existing changes)
git add apps/backend/nixpacks.toml
git commit -m "Test auto-deployment"

# Push to trigger deployment
git push origin master
```

### Monitor Deployment

1. **In Railway Dashboard**
   - Go to your service
   - You should see a new deployment starting automatically
   - Watch the build logs in real-time

2. **Via Railway CLI**
   ```bash
   # View deployment status
   railway status
   
   # Watch logs
   railway logs --service nuoip --follow
   ```

---

## Step 4: Configure Deployment Settings

### Set Root Directory (Critical for Backend)

1. In Railway Dashboard → Service Settings
2. Find **"Root Directory"** or **"Working Directory"**
3. Set to: **`apps/backend`** (for NestJS backend)
4. Or leave empty/root for full monorepo deployment
5. Save

### Set Environment Variables

```bash
# Via Railway CLI
railway variables set NEST_AUTH_SECRET=your-secret --service nuoip
railway variables set HOST=0.0.0.0 --service nuoip
railway variables set ALLOWED_ORIGINS=http://localhost:3000 --service nuoip
```

Or via Dashboard → Variables tab

---

## How Auto-Deploy Works

Once configured, Railway will:

1. **Monitor** your GitHub repository
2. **Detect** pushes to the connected branch (`master`)
3. **Trigger** a new deployment automatically
4. **Build** using `apps/backend/nixpacks.toml`
5. **Deploy** the new version
6. **Restart** the service with the new code

---

## Deployment Triggers

Railway will auto-deploy when:

- ✅ You push to the connected branch (`master`)
- ✅ You merge a pull request to the connected branch
- ✅ You create a new commit on the connected branch

Railway will NOT deploy for:

- ❌ Pushes to other branches (unless configured)
- ❌ Draft pull requests
- ❌ Commits that don't change watched files

---

## Watch Patterns

The `railway.json` file includes watch patterns:

```json
"watchPatterns": [
  "apps/backend/**",
  "packages/prisma/**"
]
```

This means Railway will only deploy when files in these directories change. To deploy on any change, remove or modify this setting.

---

## Troubleshooting

### Issue: Auto-deploy not triggering

**Solutions:**
1. Check that GitHub repository is connected in Railway settings
2. Verify the branch name matches (`master` vs `main`)
3. Ensure Auto Deploy is enabled in service settings
4. Check Railway logs for errors

### Issue: Wrong files being deployed

**Solutions:**
1. Set Root Directory correctly in service settings
2. Check `watchPatterns` in `railway.json`
3. Verify `nixpacks.toml` paths are correct

### Issue: Build fails on auto-deploy

**Solutions:**
1. Check build logs: `railway logs --service nuoip`
2. Verify environment variables are set
3. Ensure `apps/backend/nixpacks.toml` exists and is correctly configured
4. Check that all dependencies are in `package.json`

---

## Disable Auto-Deploy (If Needed)

If you want to deploy manually only:

1. Go to Railway Dashboard → Service Settings
2. Find **"Auto Deploy"** toggle
3. Turn it **OFF**
4. Save

You can still deploy manually via:
```bash
railway up
```

---

## Current Configuration

- **Repository:** `disruption-hub/nuoip`
- **Branch:** `master`
- **Project:** `nuoip`
- **Service:** `nuoip`
- **Root Directory:** `apps/backend` (should be set)
- **Build Config:** `apps/backend/nixpacks.toml`
- **Auto Deploy:** Should be enabled

---

## Quick Commands

```bash
# Check deployment status
railway status

# View recent deployments
railway logs --service nuoip

# Trigger manual deployment
railway up

# Check service configuration
railway service nuoip
```

---

## Next Steps

After setting up auto-deploy:

1. ✅ Make a test commit and push
2. ✅ Verify deployment triggers automatically
3. ✅ Monitor build logs
4. ✅ Test the deployed service
5. ✅ Set up monitoring/alerts (optional)

---

**Note:** Auto-deploy is enabled by default when you connect a GitHub repository. If it's not working, check the service settings in the Railway dashboard.

