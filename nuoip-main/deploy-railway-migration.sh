#!/bin/bash

# Script to deploy Prisma migrations to Railway production database
# This connects to Railway's database and runs pending migrations

echo "🚀 Deploying Prisma migrations to Railway..."

# Change to the prisma directory
cd packages/prisma || exit 1

# Deploy migrations (this will use the DATABASE_URL from Railway environment)
echo "📦 Running prisma migrate deploy..."
npx prisma migrate deploy --schema ./schema.prisma

if [ $? -eq 0 ]; then
  echo "✅ Migration deployment successful!"
else
  echo "❌ Migration deployment failed!"
  exit 1
fi
