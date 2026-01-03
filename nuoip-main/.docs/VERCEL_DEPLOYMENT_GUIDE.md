# 🚀 IPNUO Vercel Deployment Guide

## Deploy Next.js Frontend to Vercel

This guide covers deploying the IPNUO Next.js frontend application to Vercel.

### 📋 Prerequisites

1. **Vercel Account**: [vercel.com](https://vercel.com)
2. **Git Repository**: Push your code to GitHub/GitLab/Bitbucket
3. **Database**: Vercel Postgres or external PostgreSQL database
4. **Environment Variables**: Configure all required env vars

### 🔧 Required Environment Variables

Set these in Vercel dashboard under Project Settings → Environment Variables:

#### Database
```bash
DATABASE_URL=postgresql://username:password@host:port/database
DATABASE_PUBLIC_URL=postgresql://username:password@host:port/database
```

#### Authentication
```bash
NEXTAUTH_SECRET=your-secure-random-secret-here
NEXTAUTH_URL=https://your-app.vercel.app
```

#### OpenRouter AI (for Chatbot)
```bash
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

#### Brevo Email (for Appointment Confirmations)
```bash
BREVO_API_KEY=your-brevo-api-key
BREVO_CC_EMAIL=support@yourdomain.com
```

#### Google Calendar (Optional - for Calendar Integration)
```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----"
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
GOOGLE_CALENDAR_TIMEZONE=America/Mexico_City
```

#### Chatbot Configuration
```bash
CHATBOT_TENANT_ID=default_tenant
```

### 🚀 Deployment Steps

#### 1. Connect Repository to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your Git repository
4. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (leave default)

#### 2. Configure Build Settings

In Vercel project settings:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

#### 3. Set Environment Variables

Go to Project Settings → Environment Variables and add:

- All variables listed above
- Set them for: Production, Preview, Development environments

#### 4. Database Setup

**Option A: Vercel Postgres (Recommended)**
1. In Vercel dashboard: Storage → Postgres → Create
2. Copy the `DATABASE_URL` to environment variables
3. Run database migrations:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

**Option B: External Database**
- Use your existing PostgreSQL database
- Ensure it's accessible from Vercel (whitelist Vercel's IP ranges)

#### 5. Deploy

1. Push your code to the connected repository
2. Vercel will automatically start building
3. Monitor the build logs for any errors
4. Once deployed, you'll get a production URL

### 🧪 Post-Deployment Testing

#### Test Basic Functionality
```bash
# Test homepage
curl https://your-app.vercel.app

# Test API health
curl https://your-app.vercel.app/api/health
```

#### Test Chatbot
```bash
# Test chatbot API
curl -X POST https://your-app.vercel.app/api/chatbot/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "hello", "sessionId": "test-session"}'
```

#### Test Database Connection
```bash
# Test database connection via API
curl https://your-app.vercel.app/api/test-db
```

### 🔧 Troubleshooting

#### Build Failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation

#### Runtime Errors
- Check Vercel function logs
- Verify environment variables are set correctly
- Test database connectivity

#### Database Issues
```bash
# Run Prisma migrations on Vercel
npx prisma migrate deploy

# Check database connection
npx prisma db push --preview-feature
```

### 📊 Monitoring & Maintenance

#### Vercel Analytics
- Enable Vercel Analytics for performance monitoring
- Monitor function execution times
- Track error rates

#### Database Monitoring
- Monitor connection pool usage
- Set up database backups
- Monitor query performance

#### Log Monitoring
- Use Vercel dashboard for function logs
- Set up error alerting
- Monitor API response times

### 🚀 Production Optimizations

#### Performance
- Enable Vercel Edge Functions for better performance
- Use Vercel Image Optimization
- Implement proper caching strategies

#### Security
- Enable Vercel Security Headers
- Use environment variables for secrets
- Implement proper CORS policies

#### Scaling
- Monitor function cold starts
- Optimize bundle size
- Use Vercel Pro plan for higher limits

### 🎯 Success Checklist

- ✅ Project deployed successfully
- ✅ Environment variables configured
- ✅ Database connected and migrated
- ✅ Chatbot functionality working
- ✅ Email system configured
- ✅ Calendar integration (if used)
- ✅ All API endpoints responding
- ✅ Performance optimized
- ✅ Monitoring set up

### 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test database connectivity
4. Check Prisma migrations
5. Review API function logs

**Your IPNUO application is now live on Vercel! 🎉**

