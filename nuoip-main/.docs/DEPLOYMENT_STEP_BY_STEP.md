# Step-by-Step Deployment Guide

This guide provides detailed, click-by-click instructions for deploying all three applications using the Railway and Vercel web interfaces.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:
- [ ] GitHub repository pushed with all code
- [ ] Vercel account (sign up at [vercel.com](https://vercel.com))
- [ ] Railway account (sign up at [railway.app](https://railway.app))
- [ ] Access to your GitHub repository from both platforms

---

## 🚀 Part 1: Deploy API to Railway

### Step 1: Create Railway Project from Website

1. **Open Railway Website**
   - Go to [railway.app](https://railway.app) in your browser
   - Click **"Login"** or **"Sign Up"** if you don't have an account
   - Sign in with GitHub (recommended) or email

2. **Create New Project**
   - Once logged in, you'll see your Railway dashboard
   - Click the **"+ New Project"** button (usually in the top right corner or center of the page)
   - A modal or page will appear with deployment options

3. **Connect GitHub Repository**
   - Select **"Deploy from GitHub repo"** option
   - If this is your first time, Railway will ask to authorize access to your GitHub account
   - Click **"Authorize Railway"** or **"Connect GitHub"**
   - You may be redirected to GitHub to authorize Railway
   - After authorization, you'll return to Railway

4. **Select Your Repository**
   - Railway will show a list of your GitHub repositories
   - Search for or scroll to find your repository (e.g., `evoque-new`)
   - Click on your repository name to select it

5. **Deploy the Project**
   - Click **"Deploy Now"** or **"Add Service"** button
   - Railway will start creating your project and detecting the service
   - You'll see a loading screen while Railway analyzes your repository
   - Wait for Railway to finish initial setup (usually 1-2 minutes)

6. **Project Created**
   - You'll be redirected to your new Railway project dashboard
   - You should see one service already created (this will be your API service)
   - The service may already be deploying automatically

### Step 2: Add PostgreSQL Database

1. **Navigate to Project Dashboard**
   - You should be on your Railway project page
   - You'll see your project name at the top and a list of services below

2. **Add Database Service**
   - Click the **"+ New"** button (usually a green button or plus icon)
   - A dropdown menu or modal will appear with service options
   - Select **"Database"** from the options
   - Then select **"Add PostgreSQL"** or **"PostgreSQL"**

3. **Wait for Database Provisioning**
   - Railway will automatically create a PostgreSQL database
   - You'll see a new service appear in your project dashboard
   - Wait for the database status to show "Active" or "Running" (usually 30-60 seconds)
   - The status indicator will change from yellow/orange to green when ready

4. **Get Database Connection String**
   - Click on the PostgreSQL service card/tile in your dashboard
   - This opens the database service details page
   - Click on the **"Variables"** tab
   - You'll see `DATABASE_URL` listed - **don't copy it yet**, we'll use Railway's reference feature instead
   - Note the service name (usually "Postgres" or "PostgreSQL")

### Step 3: Configure API Service

1. **Open API Service Settings**
   - In your Railway project dashboard, find the service that was auto-created (likely named after your repo)
   - Click on this service to open its details page
   - You should see tabs: **"Deployments"**, **"Metrics"**, **"Settings"**, **"Variables"**, etc.

2. **Configure Root Directory**
   - Click on the **"Settings"** tab
   - Scroll down to find the **"Root Directory"** section
   - **Leave this field empty** - Railway will automatically detect `apps/api/railway.json`
   - If Railway doesn't detect it, you can manually set it to: `apps/api`

3. **Verify Build Command**
   - Still in **"Settings"**, scroll to **"Build Command"** section
   - Railway should auto-detect the build command from `apps/api/railway.json` or `nixpacks.toml`
   - If you see a build command, verify it includes Prisma generation
   - If the field is empty or incorrect, click **"Edit"** and set:
     ```bash
     npm install && cd packages/prisma && npx prisma generate && cd ../../apps/api && npm run build
     ```

4. **Verify Start Command**
   - Scroll to **"Start Command"** section
   - It should show: `cd apps/api && npm run start:prod`
   - If not, click **"Edit"** and enter: `cd apps/api && npm run start:prod`
   - Click **"Save"** if you made any changes

### Step 4: Set API Environment Variables

1. **Open Variables Tab**
   - Still in the API service page, click on the **"Variables"** tab
   - You'll see a list of existing environment variables (if any)

2. **Set DATABASE_URL Using Reference**
   - Click **"+ New Variable"** button
   - In the **"Name"** field, enter: `DATABASE_URL`
   - **Important**: Instead of typing a value, click the **"Reference"** button (usually next to the value input)
   - A modal will appear showing your services
   - Select your **PostgreSQL** service from the list
   - Select `DATABASE_URL` from the available variables
   - Click **"Add Reference"** or **"Save"**
   - This creates a reference like `${{Postgres.DATABASE_URL}}`

3. **Add Required Environment Variables**
   - Click **"+ New Variable"** for each variable below:

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `JWT_SECRET` | `[Generate secure secret]` | Run `openssl rand -base64 32` in terminal, copy the output |
| `JWT_EXPIRES_IN` | `7d` | Token expiration time |
| `ALLOWED_ORIGINS` | `http://localhost:3000,https://your-app.vercel.app` | **Important**: Only include the URLs, NOT the variable name. Format: `url1,url2,url3` |
| `NODE_ENV` | `production` | Environment mode |
| `SOKETI_HOST` | `your-soketi.up.railway.app` | Update this after deploying Soketi (Part 3) |
| `SOKETI_PORT` | `443` | Use 443 for HTTPS connections |
| `SOKETI_APP_ID` | `evoque-app` | Must match Soketi configuration exactly |
| `SOKETI_APP_KEY` | `evoque-key` | Must match Soketi configuration exactly |
| `SOKETI_APP_SECRET` | `evoque-secret` | Must match Soketi (generate secure: `openssl rand -base64 32`) |
| `SOKETI_USE_TLS` | `true` | Enable TLS for secure connections |
| `WEBSOCKET_SERVICE_URL` | `https://your-websocket.railway.app` | Update this after deploying WebSocket service (Part 2) |
| `WEBSOCKET_SERVICE_API_KEY` | `[Generate secure key]` | Generate with: `openssl rand -base64 32` |

**Important Notes**:
- **Do NOT set `PORT` manually** - Railway automatically sets this. The code will use Railway's PORT or default to 4000.
- **`ALLOWED_ORIGINS` format**: Only include comma-separated URLs. Do NOT include the variable name (e.g., use `https://app.vercel.app` NOT `ALLOWED_ORIGINS=https://app.vercel.app`).
- The server automatically binds to `0.0.0.0` (all interfaces) to allow Railway's proxy to connect.

4. **Save All Variables**
   - After adding each variable, click **"Add"** or **"Save"**
   - Verify all variables appear in the list
   - Variables are saved automatically, but double-check they're all there

### Step 5: Run Database Migrations

1. **Check Deployment Status**
   - Click on the **"Deployments"** tab in the API service
   - You should see a list of deployments (at least one)
   - Click on the latest deployment to view its details

2. **View Deployment Logs**
   - Click **"View Logs"** or open the logs panel
   - Scroll through the logs to see if migrations ran automatically
   - Look for messages like "Running migrations" or "Prisma migrate deploy"

3. **Add Pre-deploy Command (if needed)**
   - If migrations didn't run automatically, go to **"Settings"** tab
   - Scroll down to find **"Deploy"** section
   - Look for **"Pre-deploy Command"** or **"Deploy Command"** field
   - Click **"Edit"** and add:
     ```bash
     cd packages/prisma && npx prisma migrate deploy
     ```
   - Click **"Save"**

4. **Trigger Redeployment**
   - After adding the pre-deploy command, Railway may auto-redeploy
   - If not, go to **"Deployments"** tab
   - Click **"Redeploy"** or **"Deploy"** button
   - Wait for deployment to complete (check logs to confirm migrations ran)

### Step 6: Get API URL and Verify

1. **Get API Domain**
   - In the API service, click on the **"Settings"** tab
   - Scroll down to the **"Domains"** section
   - Railway should have automatically generated a domain
   - You'll see something like: `your-api-production.up.railway.app` or `your-api.railway.app`
   - Click the **"Copy"** button next to the domain or manually copy it
   - **Save this URL** - you'll need it for Vercel configuration

2. **Generate Custom Domain (Optional)**
   - If you want a custom domain, click **"Generate Domain"** or **"Add Domain"**
   - Railway will create a domain like `your-api.railway.app`
   - Wait a few seconds for DNS to propagate

3. **Test API Health Endpoint**
   - Open a new browser tab
   - Visit: `https://your-api.railway.app/api/v1/health`
   - Replace `your-api.railway.app` with your actual domain
   - You should see a JSON response like: `{"status":"healthy",...}`
   - If you get an error, check the deployment logs

4. **Test API Documentation**
   - Visit: `https://your-api.railway.app/api/docs`
   - You should see Swagger/OpenAPI documentation
   - This confirms your API is running correctly

---

## 📡 Part 2: Deploy WebSocket Service to Railway

### Step 1: Add WebSocket Service to Existing Project

1. **Navigate to Your Railway Project**
   - Make sure you're on your Railway project dashboard (the same project where you deployed the API)
   - You should see your existing services: API service and PostgreSQL database
   - If you're not on the project page, click on your project name in the sidebar or dashboard

2. **Add New Service**
   - Click the **"+ New"** button (same button you used to add the database)
   - A dropdown menu or modal will appear with service options
   - Select **"GitHub Repo"** or **"Deploy from GitHub repo"**
   - Railway will show a list of repositories

3. **Select the Same Repository**
   - You'll see your GitHub repositories listed
   - Select the **same repository** you used for the API (e.g., `evoque-new`)
   - Click on it to select

4. **Service Created**
   - Railway will create a new service in your project
   - You'll see a new service card appear in your project dashboard
   - Railway will automatically start detecting the service configuration
   - Wait a few seconds for Railway to analyze the repository

### Step 2: Configure WebSocket Service

1. **Open WebSocket Service**
   - Click on the newly created service (it may be named after your repo or "websocket")
   - This opens the service details page
   - You'll see tabs: **"Deployments"**, **"Metrics"**, **"Settings"**, **"Variables"**, etc.

2. **Configure Root Directory (CRITICAL for Auto-Deploy)**
   - Click on the **"Settings"** tab
   - Scroll down to find the **"Root Directory"** section
   - **IMPORTANT**: Click **"Edit"** and set it to: `apps/websocket`
   - This tells Railway which directory to watch for changes
   - Click **"Save"** to apply the change
   - **Note**: Without this setting, Railway won't detect commits and won't auto-deploy

3. **Verify Build Command**
   - Still in **"Settings"**, scroll to **"Build Command"** section
   - Railway should auto-detect the build command from `apps/websocket/railway.json`
   - If the field is empty or incorrect, click **"Edit"** and set:
     ```bash
     npm install && cd packages/prisma && npx prisma generate && cd ../../apps/websocket && npm run build
     ```
   - Click **"Save"** if you made changes

4. **Verify Start Command**
   - Scroll to **"Start Command"** section
   - It should show: `cd apps/websocket && npm run start:prod`
   - If not, click **"Edit"** and enter: `cd apps/websocket && npm run start:prod`
   - Click **"Save"** if you made changes

5. **Verify Port Configuration**
   - Scroll to **"Port"** section (if visible)
   - It should show `4001` or Railway may auto-detect it
   - If needed, set it to `4001` to avoid conflicts with the API service (port 4000)

### Step 3: Set WebSocket Environment Variables

1. **Open Variables Tab**
   - Click on the **"Variables"** tab in the WebSocket service
   - You'll see a list of existing environment variables (if any)

2. **Set DATABASE_URL Using Reference**
   - Click **"+ New Variable"** button
   - In the **"Name"** field, enter: `DATABASE_URL`
   - Click the **"Reference"** button (usually next to the value input)
   - A modal will appear showing your services
   - Select your **PostgreSQL** service (the same database used by API)
   - Select `DATABASE_URL` from the available variables
   - Click **"Add Reference"** or **"Save"**
   - This creates a reference like `${{Postgres.DATABASE_URL}}`

3. **Add Required Environment Variables**
   - Click **"+ New Variable"** for each variable below:

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `JWT_SECRET` | `[Copy from API service]` | **Must match API exactly** - copy the same value you used in API |
| `JWT_EXPIRES_IN` | `7d` | Token expiration time (same as API) |
| `ALLOWED_ORIGINS` | `http://localhost:3000,https://your-app.vercel.app` | **Important**: Only include the URLs, NOT the variable name. Format: `url1,url2,url3` |
| `NODE_ENV` | `production` | Environment mode |
| `SOKETI_HOST` | `your-soketi.up.railway.app` | Update this after deploying Soketi (Part 3) |
| `SOKETI_PORT` | `443` | Use 443 for HTTPS connections |
| `SOKETI_APP_ID` | `evoque-app` | Must match Soketi and API exactly |
| `SOKETI_APP_KEY` | `evoque-key` | Must match Soketi and API exactly |
| `SOKETI_APP_SECRET` | `evoque-secret` | Must match Soketi and API exactly (use same value as API) |
| `SOKETI_USE_TLS` | `true` | Enable TLS for secure connections |
| `WEBSOCKET_SERVICE_API_KEY` | `[Copy from API service]` | **Must match API exactly** - copy the same value you used in API |

**Important Notes**:
- **Do NOT set `PORT` manually** - Railway automatically sets this. The code will use Railway's PORT or default to 4001.
- **`ALLOWED_ORIGINS` format**: Only include comma-separated URLs. Do NOT include the variable name (e.g., use `https://app.vercel.app` NOT `ALLOWED_ORIGINS=https://app.vercel.app`).
- The server automatically binds to `0.0.0.0` (all interfaces) to allow Railway's proxy to connect.
- `JWT_SECRET` and `WEBSOCKET_SERVICE_API_KEY` **must be identical** to the values in your API service
- To copy values from API service: Go to API service → Variables tab → Copy the values
- `DATABASE_URL` should reference the same PostgreSQL service as the API

4. **Save All Variables**
   - After adding each variable, click **"Add"** or **"Save"**
   - Verify all variables appear in the list
   - Double-check that `JWT_SECRET` and `WEBSOCKET_SERVICE_API_KEY` match your API service exactly

### Step 4: Deploy and Verify WebSocket Service

1. **Check Deployment Status**
   - Click on the **"Deployments"** tab
   - Railway should have automatically started deploying when you added the service
   - You should see a deployment in progress or completed
   - If no deployment started, click **"Deploy"** or **"Redeploy"** button

2. **Monitor Deployment**
   - Click on the latest deployment to view its details
   - Click **"View Logs"** to see the build and deployment process
   - Wait for the deployment to complete (usually 2-5 minutes)
   - Look for "Build succeeded" or "Deployment successful" message
   - If deployment fails, check the logs for errors

3. **Get WebSocket Service Domain**
   - Once deployment is complete, click on the **"Settings"** tab
   - Scroll down to the **"Domains"** section
   - Railway should have automatically generated a domain
   - You'll see something like: `your-websocket-production.up.railway.app` or `your-websocket.railway.app`
   - Click the **"Copy"** button next to the domain or manually copy it
   - **Save this URL** - you may need it later

4. **Generate Custom Domain (Optional)**
   - If you want a custom domain, click **"Generate Domain"** or **"Add Domain"**
   - Railway will create a domain like `your-websocket.railway.app`
   - Wait a few seconds for DNS to propagate

5. **Test WebSocket Health Endpoint**
   - Open a new browser tab
   - Visit: `https://your-websocket.railway.app/health`
   - Replace `your-websocket.railway.app` with your actual domain
   - You should see a JSON response like: `{"status":"ok","service":"websocket"}`
   - If you get an error, check the deployment logs in Railway

6. **Verify Service is Running**
   - Go back to Railway dashboard
   - Check that the WebSocket service shows "Active" or "Running" status
   - The status indicator should be green
   - If it's not running, check the logs for errors

### Step 5: Configure Automatic Deployments (Troubleshooting)

If Railway is not automatically deploying when you push commits to GitHub, follow these steps:

1. **Verify Root Directory is Set**
   - Go to WebSocket service → **"Settings"** tab
   - Check that **"Root Directory"** is set to: `apps/websocket`
   - If it's empty or incorrect, set it to `apps/websocket` and click **"Save"**
   - **This is critical** - Railway needs this to know which directory to watch

2. **Check Branch Configuration**
   - In **"Settings"** tab, scroll to **"Deploy"** section
   - Look for **"Branch"** or **"Deploy Branch"** setting
   - Ensure it's set to the branch you're pushing to (usually `main` or `master`)
   - If it's set to a different branch, update it to match your default branch
   - Click **"Save"** if you made changes

3. **Verify GitHub Integration**
   - Go to your Railway project dashboard
   - Click on **"Settings"** (project-level settings, not service settings)
   - Look for **"GitHub"** or **"Source"** section
   - Verify your GitHub repository is connected
   - If not connected, click **"Connect GitHub"** and authorize Railway

4. **Check Watch Paths (if available)**
   - In WebSocket service → **"Settings"** → **"Deploy"** section
   - Look for **"Watch Paths"** or **"Watch Patterns"** setting
   - If available, ensure it includes:
     - `apps/websocket/**`
     - `packages/**` (since websocket depends on packages)
   - This tells Railway which file changes should trigger deployments

5. **Test Auto-Deploy**
   - Make a small change to any file in `apps/websocket/` (e.g., add a comment)
   - Commit and push to your default branch:
     ```bash
     git add apps/websocket/
     git commit -m "test: trigger websocket deployment"
     git push
     ```
   - Go to Railway → WebSocket service → **"Deployments"** tab
   - Within 1-2 minutes, you should see a new deployment triggered automatically
   - If no deployment appears, manually trigger one and check the settings again

6. **Manual Deployment (Fallback)**
   - If auto-deploy still doesn't work, you can manually deploy:
   - Go to **"Deployments"** tab
   - Click **"Deploy"** or **"Redeploy Latest Commit"**
   - Railway will build and deploy the latest commit from your repository

**Common Issues:**
- ❌ **Root Directory not set** → Railway doesn't know which service to build
- ❌ **Wrong branch configured** → Railway is watching a different branch
- ❌ **GitHub integration not connected** → Railway can't detect commits
- ❌ **Watch paths too restrictive** → Railway ignores changes in your directory

---

## 🐳 Part 3: Deploy Soketi Server to Railway

### Step 1: Create Docker Service

1. In your Railway project, click **"+ New"** button
2. Select **"Deploy from Container Image"**
3. In the **"Image"** field, enter: `quay.io/soketi/soketi:latest`
4. Click **"Deploy"**

### Step 2: Configure Soketi Port

1. Click on the Soketi service
2. Click **"Settings"** tab
3. Scroll to **"Port"** section
4. Set **"Port"** to: `6001`
5. Enable **"Expose Port"** toggle (this makes it publicly accessible)

### Step 3: Set Soketi Environment Variables

1. Click on the **"Variables"** tab
2. Add these variables:

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `SOKETI_DEFAULT_APP_ID` | `evoque-app` | Must match API & WebSocket |
| `SOKETI_DEFAULT_APP_KEY` | `evoque-key` | Must match API & WebSocket |
| `SOKETI_DEFAULT_APP_SECRET` | `evoque-secret` | Must match API & WebSocket (generate secure) |
| `SOKETI_HOST` | `0.0.0.0` | |
| `SOKETI_PORT` | `6001` | |
| `SOKETI_DEBUG` | `0` | Set to 0 in production |

### Step 4: Get Soketi URL

1. After deployment, go to **"Settings"** → **"Domains"**
2. Copy the generated domain (e.g., `your-soketi.up.railway.app`)
3. Update `SOKETI_HOST` in API and WebSocket services with this hostname
4. Test: `curl https://your-soketi.up.railway.app/apps/evoque-app/channels`

---

## 🌐 Part 4: Deploy Web App to Vercel

### Step 1: Import Project

1. Go to [vercel.com](https://vercel.com) and log in
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. If your repo isn't listed, click **"Adjust GitHub App Permissions"** and authorize
5. Select your repository
6. Click **"Import"**

### Step 2: Configure Project Settings

1. **Framework Preset**: Should auto-detect as "Next.js" (if not, select it)
2. **Root Directory**: Click **"Edit"** and set to: `apps/web`
3. **Build Command**: Should show: `cd ../.. && npm install && npm run build:web`
   - If not, set it manually
4. **Output Directory**: Should show: `apps/web/.next`
   - If not, set it manually
5. **Install Command**: Should show: `npm install`
   - If not, set it manually

### Step 3: Set Environment Variables

1. Scroll down to **"Environment Variables"** section
2. Click **"Add"** for each variable:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://your-api.railway.app` | Production, Preview, Development |
| `NEXT_PUBLIC_PUSHER_KEY` | `evoque-key` | Production, Preview, Development |
| `NEXT_PUBLIC_PUSHER_HOST` | `your-soketi.up.railway.app` | Production, Preview, Development |
| `NEXT_PUBLIC_PUSHER_PORT` | `443` | Production, Preview, Development |
| `NEXT_PUBLIC_PUSHER_USE_TLS` | `true` | Production, Preview, Development |

**Note**: Replace `your-api.railway.app` and `your-soketi.up.railway.app` with your actual Railway URLs.

### Step 4: Deploy

1. Click **"Deploy"** button (bottom of page)
2. Wait for build to complete (usually 2-5 minutes)
3. Vercel will show deployment status and logs
4. Once complete, click **"Visit"** to see your deployed site

### Step 5: Get Deployment URL

1. After deployment, Vercel provides a URL like: `https://your-app.vercel.app`
2. Copy this URL
3. Go back to Railway and update `ALLOWED_ORIGINS` in both API and WebSocket services:
   - Add: `https://your-app.vercel.app`
   - Format: `https://your-app.vercel.app` (or comma-separated for multiple)

---

## ✅ Part 5: Final Verification

### Verify API

1. Visit: `https://your-api.railway.app/api/v1/health`
2. Should return: `{"status":"healthy",...}`
3. Visit: `https://your-api.railway.app/api/docs`
4. Should show Swagger documentation

### Verify WebSocket Service

1. Visit: `https://your-websocket.railway.app/health`
2. Should return: `{"status":"ok","service":"websocket"}`

### Verify Soketi

1. Run in terminal: `curl https://your-soketi.up.railway.app/apps/evoque-app/channels`
2. Should return JSON response (may be empty `{}` if no channels)

### Verify Web App

1. Visit: `https://your-app.vercel.app`
2. Should load your application
3. Check browser console for errors
4. Test API calls from the web app
5. Test WebSocket connections (if applicable)

---

## 🔄 Part 6: Update Environment Variables

After getting all URLs, update these variables:

### In Railway (API Service):
- `ALLOWED_ORIGINS`: Add your Vercel URL (format: `http://localhost:3000,https://your-app.vercel.app` - comma-separated, no variable name)
- `SOKETI_HOST`: Update with actual Soketi hostname
- `WEBSOCKET_SERVICE_URL`: Update with actual WebSocket service URL

### In Railway (WebSocket Service):
- `ALLOWED_ORIGINS`: Add your Vercel URL (format: `http://localhost:3000,https://your-app.vercel.app` - comma-separated, no variable name)
- `SOKETI_HOST`: Update with actual Soketi hostname

### In Vercel (Web App):
- `NEXT_PUBLIC_API_URL`: Should already be set
- `NEXT_PUBLIC_PUSHER_HOST`: Update with actual Soketi hostname

After updating variables, Railway services will automatically redeploy. Vercel requires a manual redeploy:
1. Go to Vercel dashboard
2. Click on your project
3. Go to **"Deployments"** tab
4. Click **"..."** on latest deployment → **"Redeploy"**

---

## 🐛 Troubleshooting

### Railway Build Fails

1. Check **"Deployments"** tab → Click on failed deployment → **"View Logs"**
2. Common issues:
   - Missing Prisma client: Ensure `npx prisma generate` runs in build
   - Wrong root directory: Leave empty or set correctly
   - Node version: Set `NODE_VERSION=18` or `20` in variables
   - Server not starting: Check logs for `✅ Application is running` message
   - 502 errors: Verify server binds to `0.0.0.0` (check logs for `✅ HOST: 0.0.0.0`)

### Vercel Build Fails

1. Check deployment logs in Vercel dashboard
2. Common issues:
   - Wrong root directory: Should be `apps/web`
   - Build command: Should include `cd ../..` to go to repo root
   - Missing dependencies: Ensure `npm install` runs at root

### Services Can't Connect

1. **Database**: Verify `DATABASE_URL` uses Railway reference syntax
2. **Soketi**: Verify all `SOKETI_*` variables match across services
3. **CORS**: 
   - Ensure Vercel URL is in `ALLOWED_ORIGINS` for both API and WebSocket
   - **Format check**: `ALLOWED_ORIGINS` should be `url1,url2` NOT `ALLOWED_ORIGINS=url1,url2`
   - Check Railway logs for `[CORS] Configured allowed origins:` to verify parsing
4. **TLS**: Ensure `SOKETI_USE_TLS=true` and port is `443`
5. **502 Errors**: 
   - Verify server is binding to `0.0.0.0` (check logs for `✅ HOST: 0.0.0.0`)
   - Do NOT manually set `PORT` - let Railway set it automatically
   - Check deployment logs for `✅ Application is running on: http://0.0.0.0:XXXX`

### WebSocket Not Working

1. **Verify Soketi is accessible**: 
   ```bash
   curl https://your-soketi.up.railway.app/apps/evoque-app/channels
   ```
   Should return JSON (may be empty `{}` if no channels)

2. **Check browser console for WebSocket errors**:
   - Open browser DevTools → Console tab
   - Look for `[WebSocket]` or `[useWebSocket]` log messages
   - Check for authentication errors (401 status)
   - Check for CORS errors

3. **Verify Vercel environment variables** (all required):
   - `NEXT_PUBLIC_API_URL`: Must match your Railway API URL
   - `NEXT_PUBLIC_PUSHER_KEY`: Must match `SOKETI_DEFAULT_APP_KEY` in Soketi
   - `NEXT_PUBLIC_PUSHER_HOST`: Must match your Soketi hostname (no protocol)
   - `NEXT_PUBLIC_PUSHER_PORT`: Should be `443` for production (HTTPS/WSS)
   - `NEXT_PUBLIC_PUSHER_USE_TLS`: Should be `true` for production
   - Optional: `NEXT_PUBLIC_PUSHER_APP_ID`: Not required but recommended

4. **Verify Railway CORS configuration**:
   - Check `ALLOWED_ORIGINS` in API service includes your Vercel URL
   - Format: `http://localhost:3000,https://your-app.vercel.app` (comma-separated, no variable name)
   - Check Railway logs for `[BroadcastingAuth]` messages to see if CORS is blocking

5. **Check WebSocket authentication**:
   - Open browser DevTools → Network tab
   - Filter by "auth" or "broadcasting"
   - Look for POST requests to `/api/v1/broadcasting/auth`
   - Check response status (should be 200, not 401 or CORS error)
   - If 401: Check that auth token is being sent (check Authorization header or cookies)

6. **Check production logs**:
   - Railway API logs: Look for `[BroadcastingAuth]` messages
   - Browser console: Look for `[WebSocket]` connection status messages
   - Check for presence subscription errors: `[useWebSocket] Page presence subscription error`

7. **Common issues**:
   - **Cookies not being sent**: Check CORS configuration, ensure `Access-Control-Allow-Credentials: true` is set
   - **Authentication fails**: Verify JWT token is valid and being sent (check Authorization header)
   - **Presence not updating**: Check browser console for presence event logs (`[WebSocket] Page presence updated`)
   - **Connection refused**: Verify Soketi is running and accessible
   - **CORS blocked**: Verify Vercel URL is in `ALLOWED_ORIGINS` (check Railway logs)

### WebSocket Environment Variable Checklist

**Vercel (Web App) - Required Variables:**

- [ ] `NEXT_PUBLIC_API_URL` - Your Railway API URL (e.g., `https://api-production-XXXX.up.railway.app`)
- [ ] `NEXT_PUBLIC_PUSHER_KEY` - Must match Soketi `SOKETI_DEFAULT_APP_KEY` (e.g., `evoque-key`)
- [ ] `NEXT_PUBLIC_PUSHER_HOST` - Your Soketi hostname without protocol (e.g., `soketi-production-XXXX.up.railway.app`)
- [ ] `NEXT_PUBLIC_PUSHER_PORT` - Port number (use `443` for production HTTPS/WSS)
- [ ] `NEXT_PUBLIC_PUSHER_USE_TLS` - Set to `true` for production

**Railway (API Service) - Required Variables:**

- [ ] `ALLOWED_ORIGINS` - Comma-separated URLs including your Vercel URL (e.g., `http://localhost:3000,https://your-app.vercel.app`)
- [ ] `SOKETI_APP_KEY` - Must match `SOKETI_DEFAULT_APP_KEY` in Soketi
- [ ] `SOKETI_APP_SECRET` - Must match `SOKETI_DEFAULT_APP_SECRET` in Soketi
- [ ] `SOKETI_HOST` - Your Soketi hostname (e.g., `soketi-production-XXXX.up.railway.app`)
- [ ] `SOKETI_PORT` - Port number (use `443` for production)
- [ ] `SOKETI_USE_TLS` - Set to `true` for production

**Railway (Soketi Service) - Required Variables:**

- [ ] `SOKETI_DEFAULT_APP_ID` - App identifier (e.g., `evoque-app`)
- [ ] `SOKETI_DEFAULT_APP_KEY` - Public key (must match API and Web app)
- [ ] `SOKETI_DEFAULT_APP_SECRET` - Secret key (must match API, never expose to frontend)
- [ ] `SOKETI_HOST` - Set to `0.0.0.0` to bind to all interfaces
- [ ] `SOKETI_PORT` - Internal port (e.g., `6001`)

**Verification Steps:**

1. Check browser console on Vercel deployment for environment variable warnings
2. Look for `[WebSocket] Connected successfully` message in console
3. Check Railway API logs for `[BroadcastingAuth]` messages
4. Verify presence events are logged: `[WebSocket] Page presence updated`
5. Test with multiple users to verify presence tracking works

---

## 📝 Quick Reference: All URLs Needed

After deployment, you'll have these URLs:

- **API**: `https://your-api.railway.app`
- **WebSocket Service**: `https://your-websocket.railway.app`
- **Soketi**: `https://your-soketi.up.railway.app`
- **Web App**: `https://your-app.vercel.app`

Save these URLs for easy reference!

---

## 🔐 Security Checklist

Before going to production:

- [ ] Generate secure `JWT_SECRET` (use `openssl rand -base64 32`)
- [ ] Generate secure `SOKETI_APP_SECRET` (use `openssl rand -base64 32`)
- [ ] Generate secure `WEBSOCKET_SERVICE_API_KEY` (use `openssl rand -base64 32`)
- [ ] Set `NODE_ENV=production` in all Railway services
- [ ] Set `SOKETI_DEBUG=0` in Soketi service
- [ ] Enable TLS (`SOKETI_USE_TLS=true`)
- [ ] Restrict `ALLOWED_ORIGINS` to your production domain only
- [ ] Use strong database passwords
- [ ] Enable Railway's automatic HTTPS (enabled by default)
- [ ] Vercel provides HTTPS automatically

---

## 🎉 You're Done!

All three applications should now be deployed and working together. If you encounter any issues, refer to the troubleshooting section or check the detailed `DEPLOYMENT.md` guide.

