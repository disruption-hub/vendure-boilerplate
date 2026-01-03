#!/usr/bin/env node

/**
 * Vercel Deployment Helper Script
 * Helps configure and deploy IPNUO to Vercel
 */

const fs = require('fs')

console.log('🚀 IPNUO Vercel Deployment Helper')
console.log('================================\n')

// Check if required files exist
const requiredFiles = [
  'package.json',
  'next.config.ts',
  'vercel.json',
  'prisma/schema.prisma'
]

console.log('📋 Checking required files...')
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file)
  console.log(`${exists ? '✅' : '❌'} ${file}`)
  if (!exists) {
    console.log(`   Missing: ${file}`)
  }
})

console.log('\n🔧 Environment Variables Required:')
console.log('==================================\n')

const envVars = [
  {
    name: 'DATABASE_URL',
    description: 'PostgreSQL database connection string',
    required: true,
    example: 'postgresql://username:password@host:port/database'
  },
  {
    name: 'DATABASE_PUBLIC_URL',
    description: 'Public PostgreSQL connection (same as DATABASE_URL)',
    required: true,
    example: 'postgresql://username:password@host:port/database'
  },
  {
    name: 'NEXTAUTH_SECRET',
    description: 'Secure random secret for NextAuth.js',
    required: true,
    example: 'generate-a-secure-random-string-here'
  },
  {
    name: 'NEXTAUTH_URL',
    description: 'Your Vercel app URL',
    required: true,
    example: 'https://your-app.vercel.app'
  },
  {
    name: 'OPENROUTER_API_KEY',
    description: 'OpenRouter API key for AI chatbot (STORED IN DATABASE - configure via Admin Panel)',
    required: false,
    example: 'sk-or-v1-...',
    note: 'This is stored in the database, not as an environment variable. Configure via Admin → System Settings → OpenRouter'
  },
  {
    name: 'BREVO_API_KEY',
    description: 'Brevo (Sendinblue) API key for emails (STORED IN DATABASE - configure via Admin Panel)',
    required: false,
    example: 'your-brevo-api-key',
    note: 'This is stored in the database, not as an environment variable. Configure via Admin → System Settings → Brevo Email'
  },
  {
    name: 'BREVO_CC_EMAIL',
    description: 'CC email address for Brevo notifications (STORED IN DATABASE - configure via Admin Panel)',
    required: false,
    example: 'support@yourdomain.com',
    note: 'This is stored in the database, not as an environment variable. Configure via Admin → System Settings → Brevo Email'
  },
  {
    name: 'CHATBOT_TENANT_ID',
    description: 'Default tenant ID for chatbot',
    required: false,
    example: 'default_tenant'
  },
  {
    name: 'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    description: 'Google service account email (for calendar integration)',
    required: false,
    example: 'service-account@project.iam.gserviceaccount.com'
  },
  {
    name: 'GOOGLE_PRIVATE_KEY',
    description: 'Google service account private key (for calendar integration)',
    required: false,
    example: '"-----BEGIN PRIVATE KEY-----\\n..."'
  },
  {
    name: 'GOOGLE_CALENDAR_ID',
    description: 'Google Calendar ID (for calendar integration)',
    required: false,
    example: 'calendar-id@group.calendar.google.com'
  },
  {
    name: 'PORT',
    description: 'Port number (fallback for Soketi)',
    required: false,
    example: '6001',
    note: 'Fallback value. Primary Soketi config is in database.'
  },
  {
    name: 'SOKETI_DEFAULT_APP_ID',
    description: 'Soketi App ID (fallback/default value)',
    required: false,
    example: 'HDvH9W5N',
    note: 'Fallback value. Primary Soketi config is in database (Admin → System Settings → Realtime Chat).'
  },
  {
    name: 'SOKETI_DEFAULT_APP_KEY',
    description: 'Soketi App Key (fallback/default value)',
    required: false,
    example: '2tnjwoq2kffg0i0zv50e2j16wj7y2afa',
    note: 'Fallback value. Primary Soketi config is in database.'
  },
  {
    name: 'SOKETI_DEFAULT_APP_SECRET',
    description: 'Soketi App Secret (fallback/default value)',
    required: false,
    example: 'iirjyq90av7dylqgveff09ekv7w5v3jj',
    note: 'Fallback value. Primary Soketi config is in database.'
  },
  {
    name: 'SOKETI_INTERNAL_HOST',
    description: 'Soketi internal host (for Railway internal networking)',
    required: false,
    example: 'soketi.railway.internal',
    note: 'Fallback value. Primary Soketi config is in database.'
  },
  {
    name: 'SOKETI_INTERNAL_PORT',
    description: 'Soketi internal port',
    required: false,
    example: '6001',
    note: 'Fallback value. Primary Soketi config is in database.'
  },
  {
    name: 'SOKETI_PUBLIC_HOST',
    description: 'Soketi public host (for client connections)',
    required: false,
    example: 'soketi-production-2f36.up.railway.app',
    note: 'Fallback value. Primary Soketi config is in database.'
  },
  {
    name: 'SOKETI_PUBLIC_PORT',
    description: 'Soketi public port (usually 443 for HTTPS)',
    required: false,
    example: '443',
    note: 'Fallback value. Primary Soketi config is in database.'
  }
]

envVars.forEach(envVar => {
  const required = envVar.required ? ' (REQUIRED)' : ' (Optional)'
  console.log(`${envVar.name}${required}`)
  console.log(`  Description: ${envVar.description}`)
  console.log(`  Example: ${envVar.example}`)
  if (envVar.note) {
    console.log(`  ⚠️  Note: ${envVar.note}`)
  }
  console.log('')
})

console.log('📝 Deployment Steps:')
console.log('===================\n')

console.log('1. 📦 Prepare Your Code:')
console.log('   - Ensure all code is committed to Git')
console.log('   - Push to GitHub/GitLab/Bitbucket')
console.log('')

console.log('2. 🌐 Create Vercel Project:')
console.log('   - Go to https://vercel.com/dashboard')
console.log('   - Click "Add New..." → "Project"')
console.log('   - Import your repository')
console.log('   - Configure as Next.js project')
console.log('')

console.log('3. ⚙️  Configure Build Settings:')
console.log('   - Framework Preset: Next.js')
console.log('   - Root Directory: ./')
console.log('   - Build Command: npm run build')
console.log('   - Output Directory: .next')
console.log('')

console.log('4. 🔑 Set Environment Variables:')
console.log('   - Go to Project Settings → Environment Variables')
console.log('   - Add all REQUIRED variables listed above')
console.log('   - Set for: Production, Preview, Development')
console.log('')

console.log('5. 🗄️ Set Up Database:')
console.log('   - Use Vercel Postgres OR external PostgreSQL')
console.log('   - Run: npx prisma migrate deploy')
console.log('   - Run: npx prisma db seed')
console.log('')
console.log('6. 🚀 Deploy:')
console.log('   - Push code to trigger automatic deployment')
console.log('   - Monitor build logs in Vercel dashboard')
console.log('   - Get your production URL')
console.log('')

console.log('7. ⚙️  Configure API Keys (via Admin Panel):')
console.log('   - After deployment, log into Admin Panel')
console.log('   - Go to System Settings → OpenRouter (for chatbot AI)')
console.log('   - Go to System Settings → Brevo Email (for email notifications)')
console.log('   - These are stored in the database, NOT as environment variables')
console.log('')
console.log('8. 🧪 Test Deployment:')
console.log('   - Test homepage: curl https://your-app.vercel.app')
console.log('   - Test chatbot: curl -X POST https://your-app.vercel.app/api/chatbot/stream')
console.log('   - Test database: Check if admin panel loads')
console.log('')

console.log('9. 📧 Configure Email & Calendar (Optional):')
console.log('   - Configure Brevo settings via Admin Panel (System Settings → Brevo Email)')
console.log('   - Configure Google Calendar for booking integration')
console.log('   - Test appointment booking flow')
console.log('')

console.log('🎯 Success Checklist:')
console.log('====================\n')

const checklist = [
  '✅ Project imported to Vercel',
  '✅ Environment variables configured',
  '✅ Database connected and migrated',
  '✅ Build successful (no errors)',
  '✅ Homepage loads',
  '✅ Chatbot responds to messages',
  '✅ Admin panel accessible',
  '✅ Appointment booking works',
  '✅ Email confirmations sent',
  '✅ Calendar integration (if configured)'
]

checklist.forEach(item => console.log(item))
console.log('')

console.log('📞 Need Help?')
console.log('=============\n')

console.log('If you encounter issues:')
console.log('1. Check Vercel deployment logs')
console.log('2. Verify environment variables')
console.log('3. Test database connectivity: npx prisma db push')
console.log('4. Check API function logs in Vercel dashboard')
console.log('')

console.log('🚀 Happy Deploying! Your IPNUO app will be live on Vercel soon! 🎉')

