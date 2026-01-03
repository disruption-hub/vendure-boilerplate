# Fix Vercel GitHub Deployment Issues

## Problem
Direct Vercel CLI deployments work, but GitHub commit-based deployments fail.

## Root Causes

1. **Root Directory Not Set in Dashboard** (Most Common)
   - CLI deployments use the current directory context
   - GitHub deployments use project settings from dashboard
   - If root directory isn't set, GitHub deployments build from wrong location

2. **Environment Variables Missing for Preview Deployments**
   - Variables might only be set for Production
   - GitHub creates Preview deployments for branches/PRs
   - Preview deployments fail without required env vars

3. **Conflicting vercel.json Files**
   - Root `vercel.json` vs `apps/nextjs/vercel.json`
   - Vercel might use wrong configuration

## Solutions

### Solution 1: Set Root Directory in Vercel Dashboard (REQUIRED)

1. Go to: https://vercel.com/matmaxworlds-projects/nextjs/settings
2. Navigate to **General** tab
3. Find **Root Directory** setting
4. Set it to: `apps/nextjs`
5. **Save** the changes

**Why this matters:**
- CLI deployments run from `apps/nextjs` directory, so they work
- GitHub deployments use project settings, which default to repository root
- Setting root directory tells Vercel where to build from for ALL deployments

### Solution 2: Set Environment Variables for All Environments

Your environment variables are currently only set for Production. GitHub deployments create Preview environments.

1. Go to: https://vercel.com/matmaxworlds-projects/nextjs/settings/environment-variables
2. For each required variable, ensure it's set for:
   - ✅ Production
   - ✅ Preview (IMPORTANT for GitHub deployments)
   - ✅ Development

**Required Variables:**
- `DATABASE_URL`
- `DATABASE_PUBLIC_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_BACKEND_URL`
- `BACKEND_URL`
- All other environment variables your app needs

**To add Preview environment:**
- Click on each variable
- Check the **Preview** checkbox
- Save

### Solution 3: Consolidate vercel.json Configuration

The root `vercel.json` is configured for monorepo, but `apps/nextjs/vercel.json` has a simpler config. 

**Option A: Keep root vercel.json (Recommended)**
- Remove or rename `apps/nextjs/vercel.json`
- Ensure root directory is set to `apps/nextjs` in dashboard
- Root vercel.json will be used for all deployments

**Option B: Use apps/nextjs/vercel.json**
- Remove root `vercel.json`
- Set root directory to `apps/nextjs` in dashboard
- Simpler config, but requires root directory setting

### Solution 4: Check Build Logs for Specific Errors

When GitHub deployment fails, check the build logs:

1. Go to: https://vercel.com/matmaxworlds-projects/nextjs
2. Click on the failed deployment
3. Check the **Build Logs** tab
4. Look for:
   - "Cannot find module" → Root directory issue
   - "Missing environment variable" → Env var not set for Preview
   - "Command failed" → Build command issue

## Quick Fix Checklist

- [ ] Root Directory set to `apps/nextjs` in Vercel dashboard
- [ ] All environment variables set for Production AND Preview
- [ ] Verify root `vercel.json` is correct (or remove conflicting one)
- [ ] Test with a new commit to trigger GitHub deployment

## Verification

After fixing:

1. Make a small commit and push to GitHub
2. Check Vercel dashboard for the new deployment
3. Build should succeed
4. Check build logs to confirm it's using correct directory

## Common Error Messages

### "Cannot find module '@prisma/client'"
- **Cause**: Root directory not set, building from wrong location
- **Fix**: Set root directory to `apps/nextjs` in dashboard

### "Missing environment variable"
- **Cause**: Variable not set for Preview environment
- **Fix**: Add variable for Preview in environment variables settings

### "No Next.js version detected"
- **Cause**: Building from root instead of apps/nextjs
- **Fix**: Set root directory to `apps/nextjs` in dashboard

## Why CLI Works But GitHub Doesn't

- **CLI**: Runs from `apps/nextjs` directory, uses local context
- **GitHub**: Uses project settings from dashboard, needs root directory configured

Setting the root directory in the dashboard makes GitHub deployments work the same way as CLI deployments.













