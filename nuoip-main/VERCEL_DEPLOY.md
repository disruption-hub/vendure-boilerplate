# 🚀 Vercel Deployment Guide

This guide will help you deploy the IPNUO Next.js application to Vercel.

## Quick Deploy

### Option 1: Deploy via Vercel CLI

```bash
# Install Vercel CLI if you haven't already
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Option 2: Deploy via Vercel Dashboard

1. **Connect Repository**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your Git repository

2. **Configure Project Settings**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `apps/nextjs` ⚠️ **IMPORTANT**
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: Will use the custom command from `vercel.json`

3. **Set Environment Variables**
   Go to Project Settings → Environment Variables and add:

   #### Required Variables
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
   
   **Note**: `OPENROUTER_API_KEY` and `BREVO_API_KEY` are **NOT** required as environment variables. These are stored in the database and can be configured via the Admin Panel after deployment (System Settings section).

   #### Optional Variables
   ```bash
   # Google Calendar Integration
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----"
   GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
   GOOGLE_CALENDAR_TIMEZONE=America/Mexico_City
   
   # Chatbot Configuration
   CHATBOT_TENANT_ID=default_tenant
   
   # Soketi Realtime (Fallback/Default values - primary config is in database)
   # These are used as fallbacks if database config is not available
   PORT=6001
   SOKETI_DEFAULT_APP_ID=HDvH9W5N
   SOKETI_DEFAULT_APP_KEY=2tnjwoq2kffg0i0zv50e2j16wj7y2afa
   SOKETI_DEFAULT_APP_SECRET=iirjyq90av7dylqgveff09ekv7w5v3jj
   SOKETI_INTERNAL_HOST=soketi.railway.internal
   SOKETI_INTERNAL_PORT=6001
   SOKETI_PUBLIC_HOST=soketi-production-2f36.up.railway.app
   SOKETI_PUBLIC_PORT=443
   ```
   
   **Note**: Soketi configuration is primarily stored in the database (configured via Admin Panel). These environment variables serve as fallback/default values.

4. **Deploy**
   - Push your code to trigger automatic deployment
   - Or click "Deploy" in the Vercel dashboard

## Build Process

The build process will:
1. Install root dependencies (`npm ci` in root)
2. Install Prisma package dependencies (`npm ci` in `packages/prisma`)
3. Install Next.js app dependencies (`npm ci` in `apps/nextjs`)
4. Generate Prisma Client (`npm run prisma:generate`)
5. Build Next.js application (`next build`)

## Troubleshooting

### Build Fails with "Cannot find module '@prisma/client'"

**Solution**: Make sure Prisma client is generated. The build script includes `prisma:generate` which should handle this automatically.

### Build Fails with "Cannot find module in packages/"

**Solution**: Ensure the `installCommand` in `vercel.json` installs dependencies for both root and packages.

### Database Connection Issues

**Solution**: 
- Verify `DATABASE_URL` is set correctly
- Ensure database allows connections from Vercel IPs
- Check if database requires SSL (add `?sslmode=require` to connection string)

### API Routes Not Working

**Solution**:
- Verify `NEXT_PUBLIC_BACKEND_URL` is set if using external backend
- Check that API routes are in `apps/nextjs/src/app/api/`
- Review Vercel function logs in dashboard

## Post-Deployment

1. **Run Database Migrations**
   ```bash
   cd packages/prisma
   npm run migrate:deploy
   ```

2. **Seed Database (if needed)**
   ```bash
   cd packages/prisma
   npm run seed
   ```

3. **Configure API Keys (via Admin Panel)**
   After deployment, log into the admin panel and configure:
   - **OpenRouter API Key**: Go to Admin → System Settings → OpenRouter
   - **Brevo API Key**: Go to Admin → System Settings → Brevo Email
   
   These settings are stored in the database, not as environment variables.

4. **Test Your Deployment**
   - Homepage: `https://your-app.vercel.app`
   - Admin Panel: `https://your-app.vercel.app/admin`
   - API Routes: `https://your-app.vercel.app/api/...`

## Environment-Specific Deployments

Vercel supports multiple environments:
- **Production**: Main deployment (production domain)
- **Preview**: Automatic previews for each branch/PR
- **Development**: Manual deployments

Set environment variables for each environment as needed.

## Monitoring

- **Build Logs**: Available in Vercel dashboard under "Deployments"
- **Function Logs**: Available under "Functions" tab
- **Analytics**: Enable in project settings

## Need Help?

- Check Vercel deployment logs
- Review [Vercel Documentation](https://vercel.com/docs)
- Check project-specific logs in dashboard

