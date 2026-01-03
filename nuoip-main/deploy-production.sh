#!/bin/bash

# IPNUO Microservices Production Deployment Script

set -e

echo "🚀 Starting IPNUO Microservices Production Deployment"

# Check prerequisites
echo "📋 Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed. Aborting." >&2; exit 1; }

# Set environment
export NODE_ENV=production
export DATABASE_URL=${DATABASE_URL:-"postgresql://postgres:password@postgres:5432/ipnuo"}
export JWT_SECRET=${JWT_SECRET:-"your-secret-key"}
export MEILISEARCH_URL=${MEILISEARCH_URL:-"http://meilisearch:7700"}
export OPENAI_API_KEY=${OPENAI_API_KEY:-"your-openai-api-key"}

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p uploads
mkdir -p logs
mkdir -p data
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources

# Build and start services
echo "🏗️ Building and starting services..."
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🏥 Checking service health..."
services=("api-gateway" "identity-service" "memory-service" "analytics-service" "search-service" "agent-service" "data-ingestion-service" "knowledge-base-service" "configuration-service" "admin-service" "monitoring-service")

for service in "${services[@]}"; do
  echo "Checking ${service}..."
  if docker-compose -f docker-compose.production.yml ps ${service} | grep -q "Up"; then
    echo "✅ ${service} is running"
  else
    echo "❌ ${service} is not running"
    exit 1
  fi
done

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose -f docker-compose.production.yml exec api-gateway npx prisma migrate deploy

# Create admin user
echo "👤 Creating admin user..."
docker-compose -f docker-compose.production.yml exec api-gateway node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: 'admin@ipnuo.com',
        password: hashedPassword,
        name: 'System Administrator',
        role: 'super_admin',
        tenantId: 'admin-tenant'
      }
    });
    console.log('✅ Admin user created');
  } catch (error) {
    console.log('Admin user may already exist');
  }
}

createAdmin();
"

echo "🎉 IPNUO Microservices Production Deployment Complete!"
echo "📊 Services:"
echo "  Frontend: http://localhost:3006"
echo "  Admin Panel: http://localhost:3009"
echo "  API Gateway: http://localhost:3000"
echo "  Monitoring: http://localhost:3010"
echo "  Prometheus: http://localhost:9090"
echo "  Grafana: http://localhost:3001"
echo ""
echo "🔐 Admin Access:"
echo "  Email: admin@ipnuo.com"
echo "  Password: admin123"
echo ""
echo "📋 Next Steps:"
echo "  1. Access admin panel at http://localhost:3009"
echo "  2. Create your first tenant"
echo "  3. Configure tenant settings"
echo "  4. Set up monitoring and alerting"
echo "  5. Configure backup and disaster recovery"
