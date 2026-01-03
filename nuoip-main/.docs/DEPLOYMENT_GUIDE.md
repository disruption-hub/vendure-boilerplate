# 🚀 IPNUO Microservices Deployment Guide

## Complete Microservices Architecture

This guide covers the deployment of the complete IPNUO microservices architecture with 8 independent services.

### 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Identity      │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (Python)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼───────┐ ┌─────▼─────┐ ┌─────▼─────┐
        │   Memory      │ │ Analytics │ │  Search   │
        │   Service     │ │ Service   │ │ Service   │
        │   (Node.js)   │ │ (Node.js) │ │ (Node.js) │
        └───────────────┘ └───────────┘ └───────────┘
                │               │               │
        ┌───────▼───────┐ ┌─────▼─────┐ ┌─────▼─────┐
        │    Agent     │ │  Data     │ │ Knowledge │
        │   Service    │ │Ingestion  │ │   Base    │
        │  (Python)    │ │ Service   │ │ Service   │
        └───────────────┘ └───────────┘ └───────────┘
```

### 📊 Services Overview

| Service | Port | Technology | Purpose |
|---------|------|------------|---------|
| API Gateway | 3000 | Node.js | JWT auth, routing, load balancing |
| Identity Service | 8000 | Python FastAPI | User & tenant management |
| Memory Service | 3001 | Node.js | Conversation & entity memory |
| Analytics Service | 3002 | Node.js | Trademark analytics & insights |
| Search Service | 3003 | Node.js | MeiliSearch-powered search |
| Agent Service | 8001 | Python FastAPI | AI chatbot with intent detection |
| Data Ingestion | 3004 | Node.js | Excel/CSV data processing |
| Knowledge Base | 3005 | Node.js | AI-powered knowledge management |
| Frontend | 3006 | Next.js | User interface |

### 🗄️ Database Schema

The complete schema includes:
- **Tenant isolation** across all tables
- **Multi-tenancy** with proper foreign keys
- **Performance indexes** for tenant-based queries
- **Knowledge Base** table for AI embeddings
- **Memory tables** for conversation context

### 🚀 Deployment Steps

#### 1. Prerequisites

```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python 3.11+
sudo apt-get install python3.11 python3.11-pip
```

#### 2. Environment Setup

```bash
# Clone repository
git clone https://github.com/disruption-hub/nuoip.git
cd nuoip

# Set environment variables
cp .env.example .env
```

#### 3. Database Migration

```bash
# Update Prisma schema
cp prisma/schema-complete.prisma prisma/schema.prisma

# Generate Prisma client
npx prisma generate

# Run database migration
npx prisma migrate dev --name complete-microservices

# Seed database with test data
node migrate-phase2.js
```

#### 4. Service Configuration

```bash
# Install dependencies for all services
cd services/identity-service && pip install -r requirements.txt
cd ../memory-service && npm install
cd ../analytics-service && npm install
cd ../search-service && npm install
cd ../agent-service && pip install -r requirements.txt
cd ../data-ingestion-service && npm install
cd ../knowledge-base-service && npm install
cd ../api-gateway && npm install
```

#### 5. Docker Compose Deployment

```bash
# Deploy all services
docker-compose -f docker-compose.complete.yml up -d

# Check service health
docker-compose -f docker-compose.complete.yml ps

# View logs
docker-compose -f docker-compose.complete.yml logs -f
```

#### 6. Service Health Checks

```bash
# Check API Gateway
curl http://localhost:3000/health

# Check Identity Service
curl http://localhost:8000/health

# Check Memory Service
curl http://localhost:3001/health

# Check Analytics Service
curl http://localhost:3002/health

# Check Search Service
curl http://localhost:3003/health

# Check Agent Service
curl http://localhost:8001/health

# Check Data Ingestion Service
curl http://localhost:3004/health

# Check Knowledge Base Service
curl http://localhost:3005/health
```

### 🧪 Testing

#### 1. Run Complete Test Suite

```bash
# Test Phase 3 complete architecture
node test-phase3.js

# Test individual services
node test-phase2.js
```

#### 2. Load Testing

```bash
# Install artillery for load testing
npm install -g artillery

# Run load tests
artillery run load-test.yml
```

#### 3. Integration Testing

```bash
# Test API Gateway routing
curl -H "Authorization: Bearer <JWT_TOKEN>" http://localhost:3000/api/analytics/unified

# Test tenant isolation
curl -H "Authorization: Bearer <TENANT1_TOKEN>" http://localhost:3000/api/memory/stats
curl -H "Authorization: Bearer <TENANT2_TOKEN>" http://localhost:3000/api/memory/stats
```

### 📊 Monitoring

#### 1. Service Health Monitoring

```bash
# Monitor all services
watch -n 5 'docker-compose -f docker-compose.complete.yml ps'

# Check service logs
docker-compose -f docker-compose.complete.yml logs -f api-gateway
docker-compose -f docker-compose.complete.yml logs -f memory-service
```

#### 2. Database Monitoring

```bash
# Check database connections
docker-compose -f docker-compose.complete.yml exec postgres psql -U postgres -d ipnuo -c "SELECT * FROM pg_stat_activity;"

# Check tenant data isolation
docker-compose -f docker-compose.complete.yml exec postgres psql -U postgres -d ipnuo -c "SELECT tenantId, COUNT(*) FROM trademarks GROUP BY tenantId;"
```

### 🔧 Configuration

#### 1. Environment Variables

```bash
# Database
DATABASE_URL=postgresql://postgres:password@postgres:5432/ipnuo
DATABASE_PUBLIC_URL=postgresql://postgres:password@postgres:5432/ipnuo

# JWT
JWT_SECRET=your-secret-key

# MeiliSearch
MEILISEARCH_URL=http://meilisearch:7700
MEILISEARCH_API_KEY=masterKey

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# API Gateway
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3000
```

#### 2. Service Configuration

Each service can be configured independently:

- **Identity Service**: User roles, tenant settings
- **Memory Service**: Memory retention policies
- **Analytics Service**: Analytics aggregation settings
- **Search Service**: MeiliSearch configuration
- **Agent Service**: AI model settings
- **Data Ingestion Service**: File processing limits
- **Knowledge Base Service**: Embedding model settings

### 🚨 Troubleshooting

#### Common Issues

1. **Service not starting**
   ```bash
   # Check service logs
   docker-compose -f docker-compose.complete.yml logs <service-name>
   
   # Restart service
   docker-compose -f docker-compose.complete.yml restart <service-name>
   ```

2. **Database connection issues**
   ```bash
   # Check database status
   docker-compose -f docker-compose.complete.yml exec postgres pg_isready
   
   # Reset database
   docker-compose -f docker-complete.yml down -v
   docker-compose -f docker-compose.complete.yml up -d
   ```

3. **Tenant isolation issues**
   ```bash
   # Check tenant data
   node test-phase3.js
   
   # Verify JWT tokens
   curl -H "Authorization: Bearer <TOKEN>" http://localhost:3000/health
   ```

### 📈 Performance Optimization

#### 1. Database Optimization

```sql
-- Create additional indexes for performance
CREATE INDEX CONCURRENTLY idx_trademarks_tenant_marca ON trademarks(tenantId, marca);
CREATE INDEX CONCURRENTLY idx_buffer_messages_tenant_timestamp ON buffer_messages(tenantId, timestamp);
CREATE INDEX CONCURRENTLY idx_knowledge_base_tenant_category ON knowledge_base(tenantId, category);
```

#### 2. Service Scaling

```yaml
# Scale services based on load
docker-compose -f docker-compose.complete.yml up -d --scale analytics-service=3
docker-compose -f docker-compose.complete.yml up -d --scale search-service=2
```

#### 3. Caching

```bash
# Enable Redis caching for frequently accessed data
# Configure Redis in each service for caching
```

### 🔒 Security

#### 1. JWT Configuration

```bash
# Use strong JWT secrets
JWT_SECRET=your-very-strong-secret-key-here

# Configure JWT expiration
JWT_EXPIRES_IN=24h
```

#### 2. Database Security

```sql
-- Enable Row Level Security (RLS)
ALTER TABLE trademarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE buffer_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
CREATE POLICY tenant_isolation ON trademarks FOR ALL USING (tenantId = current_setting('app.current_tenant'));
```

#### 3. Network Security

```yaml
# Use internal networks for service communication
networks:
  internal:
    driver: bridge
    internal: true
```

### 📋 Production Checklist

- [ ] All services deployed and healthy
- [ ] Database migrations completed
- [ ] JWT authentication working
- [ ] Tenant isolation verified
- [ ] Load testing completed
- [ ] Monitoring configured
- [ ] Security measures implemented
- [ ] Backup strategy in place
- [ ] Documentation updated

### 🎯 Success Metrics

- **Performance**: < 200ms API Gateway response time
- **Availability**: 99.9% uptime across all services
- **Scalability**: Support 100+ concurrent tenants
- **Security**: Zero data leakage between tenants
- **Monitoring**: Real-time health monitoring

The complete microservices architecture is now ready for production deployment! 🚀
