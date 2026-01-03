# ✅ Railway Backend Environment Variables - Manual Setup Required

## Status

✅ **Vercel variables configured** - All frontend environment variables have been set
⚠️ **Railway variables need manual setup** - Railway CLI requires interactive service linking

## Vercel Variables (✅ Configured)

The following variables have been successfully configured in Vercel:

- `CHAT_AUTH_BASE_URL=https://ipnuo-backend-production.up.railway.app/auth/phone`
- `NEXT_PUBLIC_CHAT_AUTH_BASE_URL=https://ipnuo-backend-production.up.railway.app/auth/phone`
- `ADMIN_AUTH_BASE_URL=https://ipnuo-backend-production.up.railway.app/auth/admin`
- `NEXT_PUBLIC_ADMIN_AUTH_BASE_URL=https://ipnuo-backend-production.up.railway.app/auth/admin`
- `ADMIN_AUTH_LEGACY_FALLBACK=true`

## Railway Variables (⚠️ Manual Setup Required)

To configure Railway backend environment variables:

### Option 1: Railway Dashboard (Recommended)

1. Go to: https://railway.com/project/a3f22a0e-add0-40bc-8bb9-ed353e7fee0d
2. Select your service (the one for `ipnuo-backend`)
3. Go to **Variables** tab
4. Add these variables:

```text
DATABASE_URL=postgresql://postgres:P9M0apRhFKNGf3AjCwYPQ2XzLNR.g2FA@yamabiko.proxy.rlwy.net:10585/railway
NEXTAUTH_SECRET=your-secret-key-here-change-this-in-production
NEST_AUTH_SECRET=your-secret-key-here-change-this-in-production
AUTH_TOKEN_EXPIRES_IN=1h
PORT=3001
```

### Option 2: Railway CLI (After Service Linking)

```bash
cd backend
railway service  # Link service interactively
railway variables --set "DATABASE_URL=postgresql://postgres:P9M0apRhFKNGf3AjCwYPQ2XzLNR.g2FA@yamabiko.proxy.rlwy.net:10585/railway"
railway variables --set "NEXTAUTH_SECRET=your-secret-key-here-change-this-in-production"
railway variables --set "NEST_AUTH_SECRET=your-secret-key-here-change-this-in-production"
railway variables --set "AUTH_TOKEN_EXPIRES_IN=1h"
```

## Next Steps

1. ✅ Configure Railway variables (via dashboard or CLI)
2. ✅ Trigger a new Vercel deployment to pick up the new environment variables
3. ✅ Test the backend endpoints:
   - `https://ipnuo-backend-production.up.railway.app/auth/phone/request`
   - `https://ipnuo-backend-production.up.railway.app/auth/admin/login`

## Backend URL

- **Production**: `https://ipnuo-backend-production.up.railway.app`
