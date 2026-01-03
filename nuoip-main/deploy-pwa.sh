#!/bin/bash

# IPNUO Chatbot PWA Deployment Script

echo "🚀 IPNUO Chatbot PWA Deployment"
echo "==============================="

# Check if we're in the right directory
if [ ! -f "capacitor.config.ts" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📱 Preparing PWA for deployment..."

# Create icons directory if it doesn't exist
mkdir -p dist/icons

# Copy the PWA version as the main index
cp dist/pwa-index.html dist/index.html

echo "✅ PWA files prepared"

# Check if Vercel CLI is available
if command -v vercel &> /dev/null; then
    echo "🌐 Deploying to Vercel..."
    vercel --prod
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully deployed to Vercel!"
        echo ""
        echo "🎉 Your PWA is now live!"
        echo ""
        echo "📱 Next steps:"
        echo "1. Visit your deployed URL"
        echo "2. Look for 'Install App' button in browser"
        echo "3. Add to home screen for native app experience"
        echo "4. Share the URL with users - no App Store needed!"
    else
        echo "❌ Vercel deployment failed"
        exit 1
    fi
else
    echo "⚠️  Vercel CLI not found. Installing..."
    npm install -g vercel
    
    if [ $? -eq 0 ]; then
        echo "✅ Vercel CLI installed"
        echo "🌐 Deploying to Vercel..."
        vercel --prod
    else
        echo "❌ Failed to install Vercel CLI"
        echo ""
        echo "📋 Manual deployment options:"
        echo "1. Upload dist/ folder to any web server"
        echo "2. Use Netlify, GitHub Pages, or other hosting"
        echo "3. The PWA will work on any HTTPS server"
        exit 1
    fi
fi

echo ""
echo "🎯 PWA Features:"
echo "✅ Installable on home screen"
echo "✅ Works offline"
echo "✅ Push notifications ready"
echo "✅ Native app experience"
echo "✅ No App Store approval needed"
echo "✅ Easy updates"
echo ""
echo "🔗 Share your chatbot app URL with anyone!"
