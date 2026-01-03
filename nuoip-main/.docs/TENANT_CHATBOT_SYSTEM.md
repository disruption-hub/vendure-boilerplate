# Multi-Tenant Chatbot System

## Overview

This system provides tenant-specific chatbot functionality with advanced features including:
- **Tenant-specific training data management**
- **Custom guard rails and content filtering**
- **Escalation rules and human handoff**
- **Tool calling with tenant permissions**
- **Analytics and conversation tracking**
- **Branding and customization**

## Architecture

### Core Components

1. **TenantChatbotManager** - Manages tenant-specific configurations
2. **TenantChatbotService** - Processes messages with tenant context
3. **TenantChatbotTraining** - UI for training and configuration
4. **Database Schema** - Stores tenant configurations and analytics

### Key Features

#### 1. Tenant-Specific Configuration
```typescript
interface TenantChatbotConfig {
  tenantId: string
  tenantName: string
  trainingData: {
    knowledgeBase: string[]
    customPrompts: string[]
    examples: ChatExample[]
    domainSpecificData: Record<string, any>
  }
  responseConfig: {
    personality: 'professional' | 'friendly' | 'technical' | 'casual'
    tone: 'formal' | 'informal' | 'neutral'
    language: string
    maxResponseLength: number
    responseDelay: number
  }
  guardRails: {
    allowedTopics: string[]
    blockedTopics: string[]
    contentFilters: ContentFilter[]
    responseModeration: boolean
    escalationRules: EscalationRule[]
  }
  tools: {
    enabled: boolean
    allowedTools: string[]
    toolPermissions: Record<string, ToolPermission>
    customTools: CustomTool[]
  }
  branding: {
    botName: string
    avatar: string
    welcomeMessage: string
    colorScheme: string
    logo: string
  }
}
```

#### 2. Content Filtering & Guard Rails
- **Keyword filtering** - Block specific words or phrases
- **Regex patterns** - Advanced pattern matching
- **Sentiment analysis** - Filter based on emotional content
- **Topic classification** - Allow/block specific topics
- **Response moderation** - AI-powered content review

#### 3. Escalation Rules
- **Condition-based escalation** - Automatic human handoff
- **Priority levels** - Low, medium, high, urgent
- **Multiple actions** - Transfer to human, notify admin, custom response
- **Recipient management** - Route to specific team members

#### 4. Tool Calling System
- **Tenant-specific tools** - Custom tools per tenant
- **Permission management** - Role-based tool access
- **Usage limits** - Rate limiting per tool
- **Custom integrations** - API endpoints and authentication

#### 5. Analytics & Monitoring
- **Conversation tracking** - Full conversation logs
- **Satisfaction scoring** - User feedback collection
- **Performance metrics** - Response times, success rates
- **Custom metrics** - Tenant-specific KPIs

## Database Schema

### Core Tables

```sql
-- Tenant chatbot configuration
ALTER TABLE tenants ADD COLUMN chatbot_config JSON;

-- Conversation logs
CREATE TABLE conversation_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  messages JSON NOT NULL,
  satisfaction INTEGER,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Training data
CREATE TABLE chatbot_training (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'knowledge_base', 'custom_prompts', 'examples', 'domain_data'
  content JSON NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Content filters
CREATE TABLE content_filters (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'keyword', 'regex', 'sentiment', 'topic'
  pattern TEXT NOT NULL,
  action TEXT NOT NULL, -- 'block', 'modify', 'flag', 'escalate'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  is_active BOOLEAN DEFAULT TRUE
);

-- Escalation rules
CREATE TABLE escalation_rules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  condition TEXT NOT NULL,
  action TEXT NOT NULL, -- 'transfer_to_human', 'notify_admin', 'custom_response'
  priority TEXT NOT NULL, -- 'low', 'medium', 'high', 'urgent'
  recipients TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- Custom tools
CREATE TABLE custom_tools (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  endpoint TEXT NOT NULL,
  parameters JSON,
  authentication JSON,
  is_active BOOLEAN DEFAULT TRUE
);
```

## API Endpoints

### Configuration Management
```typescript
// Get tenant chatbot configuration
GET /api/tenant-chatbot/config?tenantId={tenantId}

// Update tenant chatbot configuration
PUT /api/tenant-chatbot/config
{
  "tenantId": "tenant-123",
  "config": { /* TenantChatbotConfig */ }
}
```

### Training Data Management
```typescript
// Add training data
POST /api/tenant-chatbot/training
{
  "tenantId": "tenant-123",
  "trainingData": {
    "type": "knowledge_base",
    "content": ["Knowledge item 1", "Knowledge item 2"]
  }
}

// Get training data
GET /api/tenant-chatbot/training?tenantId={tenantId}&type={type}
```

### Chat Processing
```typescript
// Process chat message
POST /api/tenant-chatbot/chat
{
  "message": "Hello, I need help with my account",
  "sessionId": "session-123",
  "context": { /* additional context */ }
}
```

### Streaming Chat
```typescript
// Stream chat response
POST /api/tenant-chatbot/stream
{
  "message": "Hello, I need help with my account",
  "sessionId": "session-123",
  "context": { /* additional context */ }
}
```

## Usage Examples

### 1. Basic Tenant Setup
```typescript
import { TenantChatbotManager } from '@/lib/ai/tenant-chatbot/tenant-chatbot-manager'

const manager = new TenantChatbotManager('tenant-123')
await manager.loadConfig()

// Add training data
await manager.addTrainingData({
  knowledgeBase: ['Our company provides software solutions'],
  customPrompts: ['Always be helpful and professional'],
  examples: [{
    userInput: 'What services do you offer?',
    expectedResponse: 'We provide software development, consulting, and support services.',
    context: 'sales',
    category: 'services'
  }]
})
```

### 2. Content Filtering
```typescript
// Add content filter
await manager.addContentFilter({
  type: 'keyword',
  pattern: 'competitor|competition',
  action: 'block',
  severity: 'medium'
})

// Add escalation rule
await manager.addEscalationRule({
  condition: 'satisfaction < 3',
  action: 'transfer_to_human',
  priority: 'high',
  recipients: ['support@company.com']
})
```

### 3. Chat Processing
```typescript
import { TenantChatbotService } from '@/lib/ai/tenant-chatbot/tenant-chatbot-service'

const service = new TenantChatbotService('tenant-123')
const response = await service.processMessage({
  tenantId: 'tenant-123',
  userId: 'user-456',
  message: 'I need help with my account',
  sessionId: 'session-789',
  context: { /* additional context */ }
})

console.log(response.response) // AI response
console.log(response.tools) // Available tools
console.log(response.escalation) // Escalation info
```

## Training Interface

The system includes a comprehensive training interface accessible at `/admin?tab=chatbot-training` with:

### Training Data Management
- **Knowledge Base** - Add domain-specific information
- **Custom Prompts** - Set behavioral instructions
- **Examples** - Provide conversation examples
- **Domain Data** - Upload structured data

### Content Filtering
- **Keyword Filters** - Block specific words/phrases
- **Regex Patterns** - Advanced pattern matching
- **Sentiment Analysis** - Filter based on emotional content
- **Topic Classification** - Allow/block specific topics

### Escalation Rules
- **Condition Builder** - Create complex escalation conditions
- **Action Configuration** - Set escalation actions
- **Priority Management** - Set escalation priorities
- **Recipient Management** - Configure notification recipients

### Analytics Dashboard
- **Conversation Metrics** - Track conversation volume and quality
- **Satisfaction Scores** - Monitor user satisfaction
- **Tool Usage** - Track tool utilization
- **Performance Metrics** - Monitor response times and success rates

## Security & Compliance

### Data Protection
- **Tenant Isolation** - Complete data separation between tenants
- **Encryption** - All sensitive data encrypted at rest and in transit
- **Access Control** - Role-based access to chatbot configuration
- **Audit Logging** - Complete audit trail of all actions

### Compliance Features
- **Data Retention** - Configurable data retention policies
- **GDPR Compliance** - Right to be forgotten, data portability
- **SOC 2** - Security and availability controls
- **HIPAA** - Healthcare data protection (if applicable)

## Best Practices

### 1. Training Data Quality
- Use high-quality, relevant training data
- Regularly update knowledge base
- Test with real user scenarios
- Monitor and improve based on feedback

### 2. Content Filtering
- Start with basic keyword filters
- Gradually add more sophisticated filters
- Test filters thoroughly before deployment
- Monitor for false positives/negatives

### 3. Escalation Rules
- Set clear escalation criteria
- Train human agents
- Monitor escalation rates
- Continuously improve rules

### 4. Analytics & Monitoring
- Track key performance indicators
- Monitor user satisfaction
- Analyze conversation patterns
- Use data to improve the system

## Troubleshooting

### Common Issues

1. **Configuration Not Loading**
   - Check tenant ID
   - Verify database connection
   - Check user permissions

2. **Content Filters Not Working**
   - Verify filter patterns
   - Check filter order
   - Test with sample content

3. **Escalation Rules Not Triggering**
   - Verify condition syntax
   - Check rule priority
   - Test with sample scenarios

4. **Training Data Not Applied**
   - Check data format
   - Verify tenant association
   - Check for conflicts

### Debug Mode
Enable debug logging by setting `DEBUG_TENANT_CHATBOT=true` in environment variables.

## Future Enhancements

### Planned Features
- **Multi-language Support** - Automatic language detection and response
- **Voice Integration** - Speech-to-text and text-to-speech
- **Advanced Analytics** - Machine learning insights
- **A/B Testing** - Test different configurations
- **Integration Hub** - Connect with external services
- **Mobile SDK** - Native mobile app integration

### Roadmap
- **Q1 2024** - Multi-language support
- **Q2 2024** - Voice integration
- **Q3 2024** - Advanced analytics
- **Q4 2024** - A/B testing framework
