# Vercel Environment Variables Reference

## Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database
DATABASE_PUBLIC_URL=postgresql://username:password@host:port/database

# Authentication
NEXTAUTH_SECRET=your-secure-random-secret-here
NEXTAUTH_URL=https://your-app.vercel.app

# Backend API (if backend is on Railway)
NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app
BACKEND_URL=https://your-backend.railway.app
```

## Optional Environment Variables

### Google Calendar Integration
```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----"
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
GOOGLE_CALENDAR_TIMEZONE=America/Mexico_City
```

### Chatbot Configuration
```bash
CHATBOT_TENANT_ID=default_tenant
```

### Soketi Realtime (Fallback/Default Values)
**Note**: These are fallback values. Primary Soketi configuration is stored in the database and can be managed via Admin Panel → System Settings → Realtime Chat.

```bash
PORT=6001
SOKETI_DEFAULT_APP_ID=HDvH9W5N
SOKETI_DEFAULT_APP_KEY=2tnjwoq2kffg0i0zv50e2j16wj7y2afa
SOKETI_DEFAULT_APP_SECRET=iirjyq90av7dylqgveff09ekv7w5v3jj
SOKETI_INTERNAL_HOST=soketi.railway.internal
SOKETI_INTERNAL_PORT=6001
SOKETI_PUBLIC_HOST=soketi-production-2f36.up.railway.app
SOKETI_PUBLIC_PORT=443
```

## Important Notes

1. **OPENROUTER_API_KEY** and **BREVO_API_KEY** are **NOT** environment variables - they are stored in the database and configured via Admin Panel.

2. **Soketi Configuration**: Primary configuration is in the database. Environment variables serve as fallbacks if database config is unavailable.

3. **PORT**: Vercel automatically sets the PORT variable. Setting PORT=6001 is only needed if you have specific requirements, but Vercel will override it for the Next.js server.

## How to Set in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable for the appropriate environments:
   - **Production**: Live production deployment
   - **Preview**: Preview deployments (branches/PRs)
   - **Development**: Local development (if using Vercel CLI)

4. Click **Save** after adding each variable

