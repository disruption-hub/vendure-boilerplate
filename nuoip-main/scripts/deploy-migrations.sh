#!/bin/bash

# Deploy Prisma migrations to the database
# This script can be used manually or automatically in CI/CD

set -e

echo "🔧 Deploying Prisma Migrations..."
echo ""

# Change to the Prisma package directory
cd "$(dirname "$0")/../packages/prisma" || exit 1

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo "   Please set DATABASE_URL to your PostgreSQL connection string"
  echo ""
  echo "   Example:"
  echo "   export DATABASE_URL='postgresql://user:password@host:port/database'"
  echo ""
  exit 1
fi

echo "📊 Database URL configured (showing last 20 chars): ...${DATABASE_URL: -20}"
echo ""

# Run migrations
echo "🚀 Running: npx prisma migrate deploy --schema ./schema.prisma"
echo ""

if npx prisma migrate deploy --schema ./schema.prisma; then
  echo ""
  echo "✅ Migrations deployed successfully!"
  echo ""
  exit 0
else
  EXIT_CODE=$?
  echo ""
  echo "❌ Migration deployment failed with exit code: $EXIT_CODE"
  echo ""
  
  # If exit code is 1, it might just mean migrations were already applied
  if [ $EXIT_CODE -eq 1 ]; then
    echo "ℹ️  Note: Exit code 1 may indicate migrations are already applied"
    echo "   This is usually not an error in production environments"
  fi
  
  exit $EXIT_CODE
fi
