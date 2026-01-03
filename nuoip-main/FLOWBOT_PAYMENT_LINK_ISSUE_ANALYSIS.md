# 🔍 Root Cause Analysis: Payment Link Flow Inconsistency

## Problem Statement
When a user asks "Necesito un link de pago" (I need a payment link) via **WhatsApp**, the behavior is **different** from asking the same question in the **full chat interface**.

## Root Cause

### ✅ What's Working
1. **Backend payment flow logic** (`PaymentFlowService`) is correct and handles multi-step flows properly
2. **Chatbot stream endpoint** correctly calls payment flow service before sending to AI
3. **Both WhatsApp and full chat** use the same unified endpoint `/api/v1/chatbot/stream`

### ❌ The Problem: Missing Conversation State for WhatsApp

**Location**: `apps/backend/src/lib/whatsapp/baileys/message-handler.ts:221-230`

```typescript
body: JSON.stringify({
  message: message.trim(),
  sessionId: this.sessionId,
  clientId: contactId,
  conversationContext: {
    // WhatsApp-specific context
    source: 'whatsapp',
    contactId,
  },
}),
```

**Issue**: The `conversationContext` is **minimal** and doesn't include:
- ❌ **No `paymentContext`** (stage, productId, customerName, customerEmail, etc.)
- ❌ **No conversation history** (previous messages)
- ❌ **No language preference**
- ❌ **No tenantId**

### Why This Breaks Payment Links

The payment flow is **stateful** and requires multiple steps:

```
Step 1: User: "Necesito un link de pago"
        Bot:  Shows product list → Sets stage='awaiting_product'

Step 2: User: "1" (selects product)
        Bot:  Asks for name → Sets stage='awaiting_name'
        ⚠️  REQUIRES paymentContext.stage='awaiting_product' from Step 1

Step 3: User: "John Doe"
        Bot:  Asks for email → Sets stage='awaiting_email'
        ⚠️  REQUIRES paymentContext.stage='awaiting_name' from Step 2
```

**What happens in WhatsApp**: Each message starts fresh with empty context, so:
- Step 2: Bot doesn't know user is selecting a product → confused
- Step 3: Bot doesn't know user is entering name → confused

**What happens in full chat**: Context is maintained in memory/state, so flow works correctly.

## Solution Components

### 1. Persist Conversation Context (Required)

Store conversation context in the database so it persists across WhatsApp messages.

**Option A: Use `ChatbotContact.metadata`**
```typescript
// When creating/updating WhatsAppContact, also update linked ChatbotContact
await prisma.chatbotContact.update({
  where: { id: chatbotContactId },
  data: {
    metadata: {
      conversationContext: {
        paymentContext: { stage: 'awaiting_name', ... },
        history: [{ role: 'user', content: '...' }, ...],
        language: 'es',
        tenantId: 'xxx',
      }
    }
  }
})
```

**Option B: Create new `ConversationState` model** (cleaner)
```prisma
model ConversationState {
  id              String   @id @default(cuid())
  sessionId       String   @unique
  contactId       String?
  paymentContext  Json?
  history         Json?
  language        String?
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([sessionId])
  @@index([contactId])
  @@map("conversation_states")
}
```

### 2. Load Context Before Routing to Flowbot

**Location**: `apps/backend/src/lib/whatsapp/baileys/message-handler.ts`

Modify `getChatbotResponse` to:
1. Load conversation context from database
2. Parse chatbot response to extract updated context
3. Save updated context back to database

```typescript
private async getChatbotResponse(message: string, contactId: string): Promise<string | null> {
  // 1. Load existing conversation context
  const storedContext = await this.loadConversationContext(contactId);
  
  // 2. Call chatbot with full context
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message.trim(),
      sessionId: this.sessionId,
      clientId: contactId,
      conversationContext: {
        source: 'whatsapp',
        contactId,
        tenantId: this.tenantId,
        language: 'es', // or detect from message
        ...storedContext, // ✅ Include stored context!
      },
    }),
  });
  
  // 3. Parse response and extract updated context
  const { fullResponse, updatedConversationContext } = await this.parseStreamResponse(response);
  
  // 4. Save updated context
  if (updatedConversationContext) {
    await this.saveConversationContext(contactId, updatedConversationContext);
  }
  
  return fullResponse;
}
```

### 3. Helper Methods

```typescript
private async loadConversationContext(contactId: string): Promise<Record<string, any>> {
  try {
    // Option A: Load from ChatbotContact.metadata
    const contact = await this.prisma.chatbotContact.findUnique({
      where: { id: contactId },
      select: { metadata: true },
    });
    
    if (contact?.metadata && typeof contact.metadata === 'object') {
      return (contact.metadata as any).conversationContext || {};
    }
    
    return {};
  } catch (error) {
    logger.warn('Failed to load conversation context', { contactId, error });
    return {};
  }
}

private async saveConversationContext(
  contactId: string,
  context: Record<string, any>
): Promise<void> {
  try {
    // Option A: Save to ChatbotContact.metadata
    await this.prisma.chatbotContact.update({
      where: { id: contactId },
      data: {
        metadata: {
          conversationContext: context,
          lastUpdated: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    logger.warn('Failed to save conversation context', { contactId, error });
  }
}
```

### 4. Parse SSE Response

The chatbot stream endpoint returns Server-Sent Events (SSE). We need to parse the complete event that includes `updatedConversationContext`:

```typescript
private async parseStreamResponse(response: Response): Promise<{
  fullResponse: string;
  updatedConversationContext?: Record<string, any>;
}> {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  
  if (!reader) {
    return { fullResponse: '' };
  }
  
  let buffer = '';
  let fullResponse = '';
  let updatedContext: Record<string, any> | undefined;
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            
            // Accumulate chunks
            if (parsed.type === 'chunk' && parsed.content) {
              fullResponse += parsed.content;
            }
            
            // Get final response and context
            if (parsed.type === 'complete') {
              fullResponse = parsed.fullResponse || fullResponse;
              updatedContext = parsed.updatedConversationContext;
              return { fullResponse, updatedConversationContext: updatedContext };
            }
          } catch (error) {
            logger.warn('Failed to parse SSE data', { data, error });
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  
  return { fullResponse, updatedConversationContext: updatedContext };
}
```

## Implementation Plan

### Phase 1: Minimal Fix (Use Existing Schema)
1. ✅ Modify `message-handler.ts` to load/save conversation context from `ChatbotContact.metadata`
2. ✅ Add helper methods: `loadConversationContext`, `saveConversationContext`
3. ✅ Add `parseStreamResponse` method to extract `updatedConversationContext`
4. ✅ Update `getChatbotResponse` to use stored context
5. ✅ Test with WhatsApp: "Necesito un link de pago" → select product → enter name → enter email

**Files to modify**:
- `apps/backend/src/lib/whatsapp/baileys/message-handler.ts`

**Estimated time**: 1-2 hours

### Phase 2: Proper State Management (Optional, Better Architecture)
1. Create `ConversationState` model in Prisma schema
2. Create `ConversationStateService` to manage state CRUD
3. Update message handler to use the service
4. Add state cleanup for completed/expired conversations

**Files to modify**:
- `packages/prisma/schema.prisma`
- Create: `apps/backend/src/chatbot/conversation-state.service.ts`
- `apps/backend/src/lib/whatsapp/baileys/message-handler.ts`

**Estimated time**: 3-4 hours

## Testing Checklist

### WhatsApp Payment Flow
- [ ] Send "Necesito un link de pago" → receives product list
- [ ] Reply "1" → asks for name (not confused)
- [ ] Reply "John Doe" → asks for email (not confused)
- [ ] Reply "[email protected]" → receives confirmation
- [ ] Reply "confirmar" → receives payment link

### Edge Cases
- [ ] Abandon mid-flow and restart
- [ ] Multiple concurrent conversations (different contacts)
- [ ] Payment link already exists
- [ ] Invalid product selection
- [ ] Invalid email format

### Consistency Check
- [ ] Same flow works identically in full chat interface
- [ ] Conversation history is maintained
- [ ] Payment context carries through all steps

## Expected Outcome

After implementing Phase 1, when a WhatsApp user asks for a payment link:

1. ✅ Bot shows product list and saves `stage='awaiting_product'`
2. ✅ User selects "1" → Bot **remembers** the stage, asks for name, saves `stage='awaiting_name'` + `productId`
3. ✅ User enters name → Bot **remembers** everything, asks for email, saves `stage='awaiting_email'` + `customerName`
4. ✅ User enters email → Bot **remembers** all details, shows confirmation
5. ✅ User confirms → Bot generates payment link with all the stored information

This will match **exactly** how the full chat interface works! 🎯
