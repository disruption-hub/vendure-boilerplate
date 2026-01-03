#!/bin/bash

# Configuration
PROJECT_ROOT=$(pwd)

echo "----------------------------------------------------"
echo "🚀 Starting Independent Multi-Cloud Deployment 🚀"
echo "----------------------------------------------------"

# 1. Railway Deployments (Backend)
echo ""
echo "📦 [1/2] Deploying Backend Services to Railway..."

deploy_railway() {
    local dir=$1
    local name=$2
    echo "  -> Deploying $name..."
    cd "$PROJECT_ROOT/$dir" || exit
    railway up --detach
}

deploy_railway "vendure-backend" "Vendure Backend"
deploy_railway "zkey-service" "ZKey Service"
deploy_railway "api-gateway" "API Gateway"
deploy_railway "booking-service" "Booking Service"

# 2. Vercel Deployments (Frontend)
echo ""
echo "🌐 [2/2] Deploying Frontend Applications to Vercel..."

deploy_vercel() {
    local dir=$1
    local name=$2
    echo "  -> Deploying $name..."
    cd "$PROJECT_ROOT/$dir" || exit
    # Using --prod and --yes for non-interactive production deployment
    vercel deploy --prod --yes
}

deploy_vercel "vendure-storefront-next" "Vendure Storefront"
deploy_vercel "zkey-dashboard" "ZKey Dashboard"

echo ""
echo "----------------------------------------------------"
echo "✅ All independent deployments initiated!"
echo "----------------------------------------------------"
echo "Note: Railway deployments are running in --detach mode."
echo "Check Railway and Vercel dashboards for logs and status."
echo "----------------------------------------------------"
