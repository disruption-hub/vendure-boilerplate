# Railway Backend Environment Variables Setup

## Quick Setup via Railway Dashboard

Since Railway CLI requires interactive service linking, the easiest way is to configure variables via the dashboard:

1. **Go to Railway Dashboard**: https://railway.com/project/a3f22a0e-add0-40bc-8bb9-ed353e7fee0d
2. **Select your service** (the one created for `ipnuo-backend`)
3. **Go to Variables tab**
4. **Add the following variables**:

```text
DATABASE_URL=postgresql://postgres:P9M0apRhFKNGf3AjCwYPQ2XzLNR.g2FA@yamabiko.proxy.rlwy.net:10585/railway
NEXTAUTH_SECRET=your-secret-key-here-change-this-in-production
NEST_AUTH_SECRET=your-secret-key-here-change-this-in-production
AUTH_TOKEN_EXPIRES_IN=1h
PORT=3001
```

## Alternative: Via Railway CLI

If you have the service linked, you can use:

```bash
cd backend
railway variables --set "DATABASE_URL=postgresql://postgres:P9M0apRhFKNGf3AjCwYPQ2XzLNR.g2FA@yamabiko.proxy.rlwy.net:10585/railway"
railway variables --set "NEXTAUTH_SECRET=your-secret-key-here-change-this-in-production"
railway variables --set "NEST_AUTH_SECRET=your-secret-key-here-change-this-in-production"
railway variables --set "AUTH_TOKEN_EXPIRES_IN=1h"
```

## Verify Configuration

After setting variables, verify with:

```bash
cd backend
railway variables
```

Or check in the Railway dashboard under your service's Variables tab.

