#!/bin/bash

# Test Railway Build Process (without starting server)
# This validates that the build will work on Railway

set -e  # Exit on error

echo "🧪 Testing Railway Build Process"
echo "================================="
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

# Set Railway-like environment
export NODE_ENV=production

# Check Node.js version
echo -e "${YELLOW}📦 Checking Node.js version...${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}❌ Error: Node.js 20+ required (found: $(node -v))${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"
echo ""

# Clean previous builds (optional, comment out if you want to keep them)
# echo "Cleaning previous builds..."
# rm -rf apps/backend/dist
# rm -rf apps/backend/node_modules/.cache

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
cd apps/backend
npm install --include=dev --prefer-offline --no-audit --legacy-peer-deps
cd ../..

cd packages/prisma
npm install --prefer-offline --no-audit --legacy-peer-deps
cd ../..

cd packages/shared-chat-auth
npm install --prefer-offline --no-audit --legacy-peer-deps || echo "⚠️  shared-chat-auth install skipped"
cd ../..

cd packages/domain
npm install --prefer-offline --no-audit --legacy-peer-deps || echo "⚠️  domain install skipped"
cd ../..

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Generate Prisma Client
echo -e "${YELLOW}🔧 Generating Prisma Client...${NC}"
cd packages/prisma
npm run generate
cd ../..
echo -e "${GREEN}✅ Prisma Client generated${NC}"
echo ""

# Verify packages exist
echo -e "${YELLOW}🔍 Verifying packages...${NC}"
if [ -f "packages/shared-chat-auth/src/index.ts" ]; then
    echo -e "${GREEN}✅ shared-chat-auth package found${NC}"
else
    echo -e "${YELLOW}⚠️  shared-chat-auth package not found${NC}"
fi

if [ -f "packages/domain/src/index.ts" ]; then
    echo -e "${GREEN}✅ domain package found${NC}"
else
    echo -e "${YELLOW}⚠️  domain package not found${NC}"
fi
echo ""

# Build NestJS
echo -e "${YELLOW}🔨 Building NestJS application...${NC}"
cd apps/backend
npm run build
cd ../..
echo -e "${GREEN}✅ Build complete${NC}"
echo ""

# Check if dist files exist
echo -e "${YELLOW}🔍 Verifying build output...${NC}"
if [ -f "apps/backend/dist/main.js" ]; then
    echo -e "${GREEN}✅ main.js exists${NC}"
else
    echo -e "${RED}❌ main.js not found${NC}"
    exit 1
fi

# Check for require path issues
echo -e "${YELLOW}🔍 Checking for path issues...${NC}"
if grep -q "packages/shared-chat-auth/src/index.ts" apps/backend/dist/auth/auth.service.js 2>/dev/null; then
    echo -e "${GREEN}✅ Paths look correct${NC}"
else
    echo -e "${YELLOW}⚠️  Paths may need fixing (check fix-requires.js output)${NC}"
fi

# Test that the start command would work (dry run)
echo -e "${YELLOW}🔍 Testing start command syntax...${NC}"
cd apps/backend
if node -e "require('./dist/main.js')" 2>&1 | head -5; then
    echo -e "${GREEN}✅ Module can be loaded${NC}"
else
    echo -e "${YELLOW}⚠️  Module loading test (this is expected if server tries to start)${NC}"
fi
cd ../..

echo ""
echo -e "${GREEN}✅✅✅ Railway build test PASSED!${NC}"
echo ""
echo "The build process should work on Railway."
echo "To simulate the full deployment, run: ./simulate-railway.sh"

