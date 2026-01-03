#!/bin/bash

# 🚀 Quick Deployment Script (Non-Interactive)
# Deploys to both Railway and Vercel automatically

set -e

echo "🚀 Quick Deployment to Railway and Vercel"
echo "=========================================="
echo ""

# Check if we're on main/master
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    echo "⚠️  Warning: You're on branch '$CURRENT_BRANCH', not main/master"
    echo "   Deployment will still proceed..."
    echo ""
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes:"
    git status --short
    echo ""
    echo "❌ Please commit your changes first:"
    echo "   git add ."
    echo "   git commit -m 'Your commit message'"
    echo "   Then run this script again"
    exit 1
fi

echo "✅ All changes committed"
echo ""

# Deploy to Railway (via git push - triggers auto-deploy)
echo "🚂 Deploying to Railway..."
echo "   Pushing to origin/$CURRENT_BRANCH..."
git push origin "$CURRENT_BRANCH"
echo "✅ Code pushed. Railway will auto-deploy."
echo "   Monitor: https://railway.app/dashboard"
echo ""

# Deploy to Vercel (if CLI is available)
if command -v vercel >/dev/null 2>&1; then
    echo "▲ Deploying to Vercel..."
    if vercel whoami >/dev/null 2>&1; then
        vercel --prod
        echo "✅ Vercel deployment complete!"
    else
        echo "⚠️  Not logged in to Vercel. Run: vercel login"
        echo "   Or deploy manually at: https://vercel.com/dashboard"
    fi
else
    echo "⚠️  Vercel CLI not found. Install with: npm i -g vercel"
    echo "   Or deploy manually at: https://vercel.com/dashboard"
    echo "   (Vercel will auto-deploy from git if connected)"
fi

echo ""
echo "🎉 Deployment initiated!"
echo ""
echo "📋 Next steps:"
echo "   1. Monitor Railway: https://railway.app/dashboard"
echo "   2. Monitor Vercel: https://vercel.com/dashboard"
echo "   3. Check logs for any errors"
echo "   4. Test your application"
echo ""

