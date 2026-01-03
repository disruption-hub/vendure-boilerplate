#!/bin/bash

# Simulate Railway Deployment Environment
# This script replicates the exact build and start process Railway uses

set -e  # Exit on error

echo "🚂 Simulating Railway Deployment Environment"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the project root
if [ ! -f "nixpacks.toml" ]; then
    echo -e "${RED}❌ Error: Must run from project root directory${NC}"
    exit 1
fi

# Set Railway-like environment variables (if not already set)
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3001}
export HOST=${HOST:-0.0.0.0}

# Check for required environment variables
echo -e "${YELLOW}📋 Checking environment variables...${NC}"
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  Warning: DATABASE_URL not set (will use default if available)${NC}"
fi
if [ -z "$NEST_AUTH_SECRET" ] && [ -z "$NEXTAUTH_SECRET" ]; then
    echo -e "${YELLOW}⚠️  Warning: NEST_AUTH_SECRET or NEXTAUTH_SECRET not set${NC}"
fi

echo ""
echo -e "${GREEN}✅ Environment check complete${NC}"
echo ""

# Phase 1: Setup (Node.js version check)
echo -e "${YELLOW}📦 Phase 1: Setup${NC}"
echo "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}❌ Error: Node.js 20+ required (found: $(node -v))${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"
echo ""

# Phase 2: Install dependencies (matching nixpacks.toml)
echo -e "${YELLOW}📦 Phase 2: Installing dependencies${NC}"
echo "Installing backend dependencies..."
cd apps/backend
npm install --include=dev --prefer-offline --no-audit --legacy-peer-deps || {
    echo -e "${RED}❌ Failed to install backend dependencies${NC}"
    exit 1
}
cd ../..

echo "Installing Prisma package dependencies..."
cd packages/prisma
npm install --prefer-offline --no-audit --legacy-peer-deps || {
    echo -e "${RED}❌ Failed to install Prisma dependencies${NC}"
    exit 1
}
cd ../..

echo "Installing shared-chat-auth dependencies..."
cd packages/shared-chat-auth
npm install --prefer-offline --no-audit --legacy-peer-deps || echo "⚠️  shared-chat-auth install skipped"
cd ../..

echo "Installing domain dependencies..."
cd packages/domain
npm install --prefer-offline --no-audit --legacy-peer-deps || echo "⚠️  domain install skipped"
cd ../..

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Phase 3: Build (matching nixpacks.toml)
echo -e "${YELLOW}🔨 Phase 3: Building application${NC}"

echo "Generating Prisma Client..."
cd packages/prisma
npm run generate || {
    echo -e "${RED}❌ Failed to generate Prisma Client${NC}"
    exit 1
}
cd ../..

echo "Verifying packages exist..."
if [ ! -f "packages/shared-chat-auth/src/index.ts" ]; then
    echo -e "${YELLOW}⚠️  Warning: packages/shared-chat-auth/src/index.ts NOT FOUND${NC}"
fi
if [ ! -f "packages/domain/src/index.ts" ]; then
    echo -e "${YELLOW}⚠️  Warning: packages/domain/src/index.ts NOT FOUND${NC}"
fi

echo "Building NestJS application..."
cd apps/backend
npm run build || {
    echo -e "${RED}❌ Failed to build NestJS application${NC}"
    exit 1
}
cd ../..

echo "Checking dist files before fix..."
if grep -q "packages/shared-chat-auth/src" apps/backend/dist/auth/auth.service.js 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Found paths that need fixing${NC}"
fi

echo "Running fix-requires.js..."
cd apps/backend
node scripts/fix-requires.js || {
    echo -e "${YELLOW}⚠️  Warning: fix-requires.js may have failed${NC}"
}
cd ../..

echo "Verifying fix worked..."
if grep -q "packages/shared-chat-auth/src/index.ts" apps/backend/dist/auth/auth.service.js 2>/dev/null; then
    echo -e "${GREEN}✅ Fix verified: paths include /index.ts${NC}"
else
    echo -e "${YELLOW}⚠️  Fix verification: paths may still need adjustment${NC}"
fi

echo -e "${GREEN}✅ Build complete${NC}"
echo ""

# Phase 4: Start (matching Railway start command)
echo -e "${YELLOW}🚀 Phase 4: Starting application${NC}"
echo "This will start the server using Railway's exact start command..."
echo "Press Ctrl+C to stop"
echo ""

# Use the exact start command from package.json (matching Railway)
cd ../..
TS_NODE_PROJECT=apps/backend/tsconfig.json \
TS_NODE_FILES=true \
TS_NODE_TRANSPILE_ONLY=true \
TS_NODE_COMPILER_OPTIONS='{"module":"commonjs"}' \
NODE_PATH=.:packages:apps/backend/node_modules \
node -r ./apps/backend/scripts/require-hook.js \
     -r ./apps/backend/node_modules/ts-node/register \
     -r ./apps/backend/node_modules/tsconfig-paths/register \
     apps/backend/dist/main.js

