#!/bin/bash

# 🚀 IPNUO Unified Deployment Script
# Deploys to both Railway (Backend + Worker) and Vercel (Frontend)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 IPNUO Unified Deployment Script${NC}"
echo -e "${BLUE}===================================${NC}\n"

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check if git is available
command -v git >/dev/null 2>&1 || { echo -e "${RED}❌ Git is required but not installed. Aborting.${NC}" >&2; exit 1; }

# Check if Railway CLI is available
RAILWAY_AVAILABLE=false
if command -v railway >/dev/null 2>&1; then
    RAILWAY_AVAILABLE=true
    echo -e "${GREEN}✅ Railway CLI found${NC}"
else
    echo -e "${YELLOW}⚠️  Railway CLI not found. Railway deployment will be manual.${NC}"
fi

# Check if Vercel CLI is available
VERCEL_AVAILABLE=false
if command -v vercel >/dev/null 2>&1; then
    VERCEL_AVAILABLE=true
    echo -e "${GREEN}✅ Vercel CLI found${NC}"
else
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Vercel deployment will be manual.${NC}"
fi

# Check git status
echo -e "\n${YELLOW}📦 Checking git status...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes.${NC}"
    echo -e "${YELLOW}   Files with changes:${NC}"
    git status --short
    echo ""
    read -p "Do you want to commit these changes before deploying? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}📝 Committing changes...${NC}"
        git add .
        read -p "Enter commit message (or press Enter for default): " commit_msg
        if [ -z "$commit_msg" ]; then
            commit_msg="chore: deploy to Railway and Vercel"
        fi
        git commit -m "$commit_msg"
    fi
fi

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}📍 Current branch: ${CURRENT_BRANCH}${NC}"

if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    echo -e "${YELLOW}⚠️  You're not on main/master branch.${NC}"
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Deployment cancelled.${NC}"
        exit 1
    fi
fi

# Deployment options
echo -e "\n${BLUE}🎯 Deployment Options:${NC}"
echo -e "1. Deploy to Railway only (Backend + Worker)"
echo -e "2. Deploy to Vercel only (Frontend)"
echo -e "3. Deploy to both Railway and Vercel"
echo ""
read -p "Select option (1/2/3): " deploy_option

case $deploy_option in
    1)
        DEPLOY_RAILWAY=true
        DEPLOY_VERCEL=false
        ;;
    2)
        DEPLOY_RAILWAY=false
        DEPLOY_VERCEL=true
        ;;
    3)
        DEPLOY_RAILWAY=true
        DEPLOY_VERCEL=true
        ;;
    *)
        echo -e "${RED}❌ Invalid option. Aborting.${NC}"
        exit 1
        ;;
esac

# Railway Deployment
if [ "$DEPLOY_RAILWAY" = true ]; then
    echo -e "\n${BLUE}🚂 Deploying to Railway...${NC}"
    echo -e "${BLUE}========================${NC}\n"
    
    if [ "$RAILWAY_AVAILABLE" = true ]; then
        echo -e "${YELLOW}📋 Railway Services:${NC}"
        echo -e "  - Backend API (NestJS)"
        echo -e "  - Baileys Worker (WhatsApp)"
        echo ""
        
        # Check Railway login
        if railway whoami >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Logged in to Railway${NC}"
        else
            echo -e "${YELLOW}⚠️  Not logged in to Railway. Please run: railway login${NC}"
            read -p "Do you want to login now? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                railway login
            else
                echo -e "${YELLOW}⚠️  Skipping Railway deployment.${NC}"
                DEPLOY_RAILWAY=false
            fi
        fi
        
        if [ "$DEPLOY_RAILWAY" = true ]; then
            echo -e "\n${BLUE}📤 Pushing to git (triggers Railway auto-deploy)...${NC}"
            read -p "Push to origin? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                git push origin "$CURRENT_BRANCH"
                echo -e "${GREEN}✅ Code pushed. Railway will auto-deploy.${NC}"
                echo -e "${YELLOW}💡 Monitor deployment at: https://railway.app/dashboard${NC}"
            else
                echo -e "${YELLOW}⚠️  Skipping git push. Railway won't auto-deploy.${NC}"
            fi
            
            echo -e "\n${BLUE}📋 Railway Deployment Checklist:${NC}"
            echo -e "  ✅ Code pushed to repository"
            echo -e "  ⚠️  Verify services are running:"
            echo -e "     - Backend API service"
            echo -e "     - Baileys Worker service"
            echo -e "  ⚠️  Check environment variables are set:"
            echo -e "     - DATABASE_URL"
            echo -e "     - NEXTAUTH_SECRET"
            echo -e "     - SOKETI_* variables"
            echo -e "  ⚠️  Monitor logs: railway logs"
        fi
    else
        echo -e "${YELLOW}⚠️  Railway CLI not installed.${NC}"
        echo -e "${BLUE}📋 Manual Railway Deployment Steps:${NC}"
        echo -e "  1. Push code to git: git push origin $CURRENT_BRANCH"
        echo -e "  2. Railway will auto-deploy from git"
        echo -e "  3. Monitor at: https://railway.app/dashboard"
        echo -e "  4. Verify both services are running:"
        echo -e "     - Backend API (NestJS)"
        echo -e "     - Baileys Worker"
    fi
fi

# Vercel Deployment
if [ "$DEPLOY_VERCEL" = true ]; then
    echo -e "\n${BLUE}▲ Deploying to Vercel...${NC}"
    echo -e "${BLUE}======================${NC}\n"
    
    if [ "$VERCEL_AVAILABLE" = true ]; then
        # Check Vercel login
        if vercel whoami >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Logged in to Vercel${NC}"
        else
            echo -e "${YELLOW}⚠️  Not logged in to Vercel. Please run: vercel login${NC}"
            read -p "Do you want to login now? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                vercel login
            else
                echo -e "${YELLOW}⚠️  Skipping Vercel deployment.${NC}"
                DEPLOY_VERCEL=false
            fi
        fi
        
        if [ "$DEPLOY_VERCEL" = true ]; then
            echo -e "\n${BLUE}📤 Deploying to Vercel...${NC}"
            read -p "Deploy to production? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                echo -e "${YELLOW}🚀 Deploying to Vercel production...${NC}"
                vercel --prod
                echo -e "${GREEN}✅ Vercel deployment complete!${NC}"
            else
                echo -e "${YELLOW}🚀 Deploying to Vercel preview...${NC}"
                vercel
                echo -e "${GREEN}✅ Vercel preview deployment complete!${NC}"
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  Vercel CLI not installed.${NC}"
        echo -e "${BLUE}📋 Manual Vercel Deployment Steps:${NC}"
        echo -e "  1. Push code to git: git push origin $CURRENT_BRANCH"
        echo -e "  2. Vercel will auto-deploy from git (if connected)"
        echo -e "  3. Or deploy manually at: https://vercel.com/dashboard"
        echo -e "  4. Verify environment variables are set:"
        echo -e "     - DATABASE_URL"
        echo -e "     - DATABASE_PUBLIC_URL"
        echo -e "     - NEXTAUTH_SECRET"
        echo -e "     - NEXTAUTH_URL"
        echo -e "     - NEXT_PUBLIC_BACKEND_URL"
        echo -e "     - BACKEND_URL"
    fi
fi

# Summary
echo -e "\n${BLUE}📊 Deployment Summary${NC}"
echo -e "${BLUE}====================${NC}\n"

if [ "$DEPLOY_RAILWAY" = true ]; then
    echo -e "${GREEN}✅ Railway:${NC}"
    echo -e "   - Backend API: Auto-deploying from git"
    echo -e "   - Baileys Worker: Auto-deploying from git"
    echo -e "   - Monitor: https://railway.app/dashboard"
else
    echo -e "${YELLOW}⏭️  Railway: Skipped${NC}"
fi

if [ "$DEPLOY_VERCEL" = true ]; then
    echo -e "${GREEN}✅ Vercel:${NC}"
    if [ "$VERCEL_AVAILABLE" = true ]; then
        echo -e "   - Frontend: Deployed via CLI"
    else
        echo -e "   - Frontend: Manual deployment required"
    fi
    echo -e "   - Monitor: https://vercel.com/dashboard"
else
    echo -e "${YELLOW}⏭️  Vercel: Skipped${NC}"
fi

echo -e "\n${BLUE}📋 Post-Deployment Checklist:${NC}"
echo -e "  ⚠️  Verify Railway services are running"
echo -e "  ⚠️  Verify Vercel deployment is live"
echo -e "  ⚠️  Test API endpoints"
echo -e "  ⚠️  Test frontend application"
echo -e "  ⚠️  Check environment variables"
echo -e "  ⚠️  Monitor logs for errors"

echo -e "\n${GREEN}🎉 Deployment process complete!${NC}"
echo -e "${BLUE}📝 Next steps:${NC}"
echo -e "  1. Monitor deployment logs"
echo -e "  2. Test your application"
echo -e "  3. Verify all services are running"
echo ""

