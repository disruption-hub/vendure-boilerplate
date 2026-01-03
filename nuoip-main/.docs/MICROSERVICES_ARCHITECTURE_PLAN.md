# FlowBot Microservices Architecture Plan

## Current State Analysis

The current system is a "monolith-plus" architecture with:
- **Frontend (Next.js)**: Single application with significant backend logic in API routes
- **Backend (FastAPI)**: Python backend for LangChain agent logic
- **Databases**: PostgreSQL, Redis, and MeiliSearch
- **Memory System**: Advanced memory components (Buffer, Entity, Knowledge Graph)

### Strengths
- Modern, capable technology stack
- Clear separation of concerns in memory system
- Container-ready with Docker
- Advanced memory system with 123 messages, 65 entities, 25 knowledge nodes

### Challenges for Multi-Tenancy
- **Single-Tenant**: No concept of tenants in database schema
- **Tightly Coupled**: Chatbot, analytics, and search intertwined
- **Configuration Rigidity**: Hard-coded agent configurations
- **No Central Management**: No admin interface for configuration

## Proposed Microservices Architecture

```
+-----------------------+
|    Admin & Config     |
|      Panel (Web)      |
+-----------+-----------+
            |
+------------------+           +-----------+-----------+           +----------------------+
|  Tenant Web App  | <-------> |      API Gateway      | <-------> | Identity & Tenant Svc|
|    (Next.js)     |           | (Kong/NGINX)          |           | (Users, Tenants, Auth)|
+------------------+           +-----------+-----------+           +----------------------+
            |
+------------------+------------------+
|                  |                  |
v                  v                  v
+-----------------------+  +---------------+------+  +-----------------------+
|     Agent Service     |  |  Search Service   |  |   Analytics Service   |
| (LLM Logic, RAG, Tools) |  | (MeiliSearch, PGVector) |  |   (Data Queries & Stats) |
+-----------------------+  +---------------+------+  +-----------------------+
            |                          |                  |
            v                          v                  v
+-----------------------+  +---------------+------+  +-----------------------+
|    Memory Service     |  | Data Ingestion Svc|  | Knowledge Base Svc    |
| (Conversations, History) |  |   (ETL Pipelines)   |  |     (Vector DB)     |
+-----------------------+  +---------------+------+  +-----------------------+
```

## Service Breakdown

### 1. API Gateway
**Responsibility**: Single entry point, authentication, rate limiting, routing
**Technology**: Kong, NGINX, or lightweight Node.js/FastAPI
**Refactor Source**: New component replacing direct frontend-to-backend communication

### 2. Identity & Tenant Service
**Responsibility**: Tenants, users, roles, permissions, API keys, JWT issuance
**Technology**: FastAPI or Node.js with PostgreSQL
**Refactor Source**: Replaces NextAuth, adds Tenant model

### 3. Agent Service (The "Brain")
**Responsibility**: Core chatbot logic, intent detection, tool orchestration, streaming responses
**Technology**: Python with FastAPI and LangChain/LlamaIndex
**Refactor Source**: Consolidates `src/app/api/chatbot/stream/route.ts` and Python backend

### 4. Search Service
**Responsibility**: Unified search interface (MeiliSearch + pgvector)
**Technology**: FastAPI or Node.js
**Refactor Source**: Extracts from `src/lib/search/search-service-simple.ts`

### 5. Analytics Service
**Responsibility**: Database queries, analytics, reports, statistics
**Technology**: Node.js with Prisma or FastAPI
**Refactor Source**: Extracts from `src/lib/analytics/analytics-service.ts`

### 6. Memory Service
**Responsibility**: Conversation history, long-term memory (tenant-partitioned)
**Technology**: Node.js with Prisma
**Refactor Source**: Converts `src/app/api/memory/` into standalone service

### 7. Data Ingestion Service
**Responsibility**: ETL pipelines, Excel/CSV processing, background jobs
**Technology**: Python with Pandas, Celery, FastAPI
**Refactor Source**: Replaces scripts in `package.json`

### 8. Knowledge Base Service
**Responsibility**: Document management, vector embeddings, RAG
**Technology**: FastAPI with pgvector/Prisma
**Refactor Source**: Formalizes `src/lib/vector-utils.ts`

## Multi-Tenancy Implementation

### Database Schema Changes
```sql
-- New Tenant table
CREATE TABLE Tenant (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  plan VARCHAR(50),
  config_json JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add tenantId to existing tables
ALTER TABLE Trademark ADD COLUMN tenant_id UUID REFERENCES Tenant(id);
ALTER TABLE MemorySession ADD COLUMN tenant_id UUID REFERENCES Tenant(id);
ALTER TABLE BufferMessage ADD COLUMN tenant_id UUID REFERENCES Tenant(id);
-- ... (all other tables)
```

### Row-Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE Trademark ENABLE ROW LEVEL SECURITY;
ALTER TABLE MemorySession ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY tenant_isolation ON Trademark
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### Authentication Flow
1. User logs in via Identity Service
2. Identity Service returns JWT with `userId`, `role`, `tenantId`
3. API Gateway validates JWT on every request
4. Gateway forwards request with `X-Tenant-ID` and `X-User-ID` headers
5. All microservices read tenant context from headers

## Step-by-Step Refactoring Roadmap

### Phase 1: Foundational Multi-Tenancy (Weeks 1-2)
- [ ] **DB Schema Update**: Add Tenant table and tenantId columns
- [ ] **Migration Script**: Create Prisma migration for multi-tenancy
- [ ] **Identity Service**: Build user and tenant management
- [ ] **API Gateway**: Deploy basic gateway with JWT validation
- [ ] **Frontend Auth**: Update Next.js to use Identity Service

### Phase 2: Extract Core Services (Weeks 3-4)
- [ ] **Analytics Service**: Move analytics logic, make tenant-aware
- [ ] **Memory Service**: Extract memory API routes
- [ ] **Update Frontend**: Route calls through API Gateway
- [ ] **Testing**: Ensure tenant isolation works

### Phase 3: Build Agent & Search Services (Weeks 5-6)
- [ ] **Agent Service**: Move chatbot logic, add tenant-aware config
- [ ] **Search Service**: Abstract MeiliSearch and pgvector
- [ ] **Inter-Service Communication**: HTTP APIs between services
- [ ] **Agent Configuration**: Database-driven agent settings

### Phase 4: Build Admin Panel (Weeks 7-8)
- [ ] **Admin Frontend**: New Next.js project for administration
- [ ] **Tenant Management**: UI for tenant CRUD operations
- [ ] **Agent Configuration**: UI for agent settings per tenant
- [ ] **Knowledge Base Management**: Document upload and management
- [ ] **Data Ingestion Service**: ETL pipeline service
- [ ] **Knowledge Base Service**: Vector database management

### Phase 5: Decommissioning and Cleanup (Weeks 9-10)
- [ ] **Remove Old Code**: Delete unused API routes
- [ ] **Replace Scripts**: Use Data Ingestion Service API
- [ ] **Monitoring**: Implement observability stack
- [ ] **Performance Testing**: Load testing and optimization

## Implementation Details

### Memory Service Refactoring
```typescript
// Current: src/app/api/memory/process/route.ts
// New: Memory Service with tenant awareness

export class MemoryService {
  constructor(private tenantId: string, private sessionId: string) {}
  
  async processMessages() {
    const messages = await prisma.bufferMessage.findMany({
      where: { 
        sessionId: this.sessionId,
        tenantId: this.tenantId  // Added tenant isolation
      }
    });
    // ... rest of processing logic
  }
}
```

### Agent Service Configuration
```typescript
// Agent configuration per tenant
interface AgentConfig {
  tenantId: string;
  model: string;
  systemPrompt: string;
  enabledTools: string[];
  temperature: number;
  maxTokens: number;
}

// Fetch agent config based on tenant
const agentConfig = await prisma.agentConfig.findUnique({
  where: { tenantId: req.headers['x-tenant-id'] }
});
```

### API Gateway Implementation
```typescript
// Middleware for tenant context
app.use((req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = jwt.verify(token, JWT_SECRET);
  
  req.tenantId = decoded.tenantId;
  req.userId = decoded.userId;
  
  // Forward to appropriate service
  next();
});
```

## Tooling & Infrastructure

### Deployment Strategy
- **Development**: Docker Compose
- **Production**: Kubernetes or Docker Swarm
- **CI/CD**: GitHub Actions with automated testing

### Inter-Service Communication
- **Synchronous**: REST APIs (HTTP)
- **Asynchronous**: RabbitMQ or Kafka for background jobs
- **Performance**: gRPC for high-throughput services

### Observability Stack
- **Logging**: Structured JSON logs → ELK Stack
- **Metrics**: Prometheus + Grafana
- **Tracing**: OpenTelemetry + Jaeger
- **LLM Tracing**: LangSmith for agent debugging

## Success Metrics

### Technical Metrics
- [ ] **Response Time**: < 200ms for API Gateway
- [ ] **Memory Service**: < 100ms for memory operations
- [ ] **Agent Service**: < 2s for chatbot responses
- [ ] **Uptime**: 99.9% availability

### Business Metrics
- [ ] **Multi-Tenancy**: Complete data isolation
- [ ] **Scalability**: Support 100+ concurrent tenants
- [ ] **Configuration**: Dynamic agent configuration
- [ ] **Admin Panel**: Full tenant and agent management

## Risk Mitigation

### Data Migration
- [ ] **Backup Strategy**: Full database backup before migration
- [ ] **Rollback Plan**: Ability to revert to monolith
- [ ] **Testing**: Comprehensive tenant isolation testing

### Service Dependencies
- [ ] **Circuit Breakers**: Prevent cascade failures
- [ ] **Health Checks**: Monitor service availability
- [ ] **Graceful Degradation**: Fallback mechanisms

### Security
- [ ] **JWT Validation**: Secure token verification
- [ ] **Rate Limiting**: Prevent abuse
- [ ] **Audit Logging**: Track all tenant operations

## Conclusion

This microservices architecture will transform IPNuo from a single-tenant monolith into a scalable, multi-tenant platform. The phased approach ensures minimal disruption while building towards a robust, enterprise-ready system.

The existing memory system (123 messages, 65 entities, 25 knowledge nodes) provides a solid foundation for the new Memory Service, while the current chatbot logic can be effectively distributed across the Agent Service and supporting microservices.
