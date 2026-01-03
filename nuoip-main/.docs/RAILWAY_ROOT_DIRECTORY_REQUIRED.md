# ⚠️ CRITICAL: Railway Root Directory Configuration Required

## The Problem

Railway is building from the repository **root** instead of the `backend/` directory. This causes it to:
- Use the wrong `package.json` (Next.js instead of NestJS)
- Miss the SWC packages that are in `backend/package.json`
- Fail the build with: `Failed to load "@swc/cli" and/or "@swc/core"`

## The Solution (MUST BE DONE IN DASHBOARD)

**This CANNOT be fixed via CLI or code changes. You MUST configure it in the Railway dashboard:**

### Steps:

1. **Go to Railway Dashboard**: 
   https://railway.com/project/a3f22a0e-add0-40bc-8bb9-ed353e7fee0d

2. **Select the service**: `ipnuo-backend`
   - Service ID: `9da92668-c43f-42f7-8569-cbc75bb98bc6`

3. **Go to Settings**:
   - Click on the service
   - Click "Settings" tab
   - Look for "Service Settings" or "Build Settings"

4. **Configure Root Directory**:
   - Find "Root Directory" or "Working Directory" setting
   - Set it to: `backend`
   - Save changes

5. **Redeploy**:
   - Click "Redeploy" button
   - Or push a new commit to trigger automatic deployment

## Why This Is Required

Railway's Railpack auto-detection:
- Detects Node.js from the root `package.json`
- Builds from the repository root
- Ignores our custom `nixpacks.toml` configuration
- Cannot be overridden via CLI or code

Setting the Root Directory tells Railway:
- To use `backend/package.json` (which has all the correct dependencies)
- To build from the `backend/` directory
- To find the SWC packages that are installed there

## Current Status

✅ **Code is ready:**
- `backend/package.json` has `@swc/cli`, `@swc/core`, and `@nestjs/cli` in dependencies
- `backend/package-lock.json` is correct
- Build works locally in `backend/` directory

❌ **Railway configuration missing:**
- Root Directory not set (must be `backend`)
- Service is building from wrong directory

## After Configuration

Once you set the root directory to `backend`, Railway will:
1. Use `backend/package.json` (NestJS with all dependencies)
2. Install dependencies correctly with `npm ci`
3. Build successfully with `nest build`
4. Start the server with `npm run start:prod`

## Verification

After configuring, the build logs should show:
```
copy backend/package.json, backend/package-lock.json, ...
```

And the build should succeed:
```
> nest build
> SWC Running...
Successfully compiled: 16 files with swc
```

**This is the ONLY way to fix the deployment. No code changes will work without this configuration.**

