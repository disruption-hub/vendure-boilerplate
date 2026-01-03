#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔧 Updating Vercel environment variables...');

// Update NEXTAUTH_URL
try {
  console.log('Setting NEXTAUTH_URL...');
  execSync('echo "https://flowbot-p6pmw24ep-matmaxworlds-projects.vercel.app" | vercel env add NEXTAUTH_URL production', { stdio: 'inherit' });
} catch (error) {
  console.log('NEXTAUTH_URL might already exist, continuing...');
}

// Update NEXTAUTH_SECRET
try {
  console.log('Setting NEXTAUTH_SECRET...');
  execSync('echo "your-production-secret-key-change-this-in-production" | vercel env add NEXTAUTH_SECRET production', { stdio: 'inherit' });
} catch (error) {
  console.log('NEXTAUTH_SECRET might already exist, continuing...');
}

// Update DATABASE_URL
try {
  console.log('Setting DATABASE_URL...');
  execSync('echo "postgresql://postgres:P9M0apRhFKNGf3AjCwYPQ2XzLNR.g2FA@yamabiko.proxy.rlwy.net:10585/railway" | vercel env add DATABASE_URL production', { stdio: 'inherit' });
} catch (error) {
  console.log('DATABASE_URL might already exist, continuing...');
}

console.log('✅ Environment variables updated!');
console.log('🚀 Redeploying to production...');

// Redeploy
try {
  execSync('vercel --prod', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}

console.log('✅ Deployment complete!');
