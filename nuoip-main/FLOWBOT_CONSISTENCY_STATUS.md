# Flowbot Consistency Status Report

## 🎯 Objective
Ensure Flowbot responds consistently to WhatsApp messages the same way it does in the full chat interface.

## ✅ Current Implementation Status

### Backend Configuration ✅
The backend is **correctly configured** to route incoming WhatsApp messages to the Flowbot:

1. **Default Routing Rule**: `FLOWBOT_FIRST`
   - Location: `apps/backend/src/admin/whatsapp.service.ts:152-161`
   - When a new WhatsApp session is created, it automatically gets `routingRule: 'FLOWBOT_FIRST'`

2. **Message Handler** ✅ 
   - Location: `apps/backend/src/lib/whatsapp/baileys/message-handler.ts`
   - Line 121-123: Routes incoming messages (`!fromMe`) to flowbot if configured
   - Line 154-155: Only routes if `FLOWBOT_FIRST` or `FLOWBOT_ONLY`

3. **Unified Chatbot Endpoint** ✅
   - Location: `message-handler.ts:199-290`
   - Calls `/api/v1/chatbot/stream` (same endpoint as full chat)
   - Passes WhatsApp-specific context: `source: 'whatsapp'`

## 🔍 Verification Checklist

### Prerequisites
- [ ] Baileys worker is running (Railway or local: `./apps/backend/scripts/baileys-worker-standalone.ts`)
- [ ] WhatsApp session is CONNECTED (not just QR_REQUIRED)
- [ ] Session has routing rule set (check database: `WhatsAppSessionConfig` table)

### Testing Steps

1. **Verify Session Configuration**
   ```sql
   SELECT sessionId, routingRule, autoReplyEnabled FROM whatsapp_session_configs;
   ```
   Expected: `routingRule` should be `FLOWBOT_FIRST` or `FLOWBOT_ONLY`

2. **Check Session Status**
   ```sql
   SELECT sessionId, status, isActive FROM whatsapp_sessions;
   ```
   Expected: `status` = `CONNECTED`, `isActive` = `true`

3. **Monitor Logs**
   When you send a WhatsApp message, you should see:
   ```
   [WhatsAppMessageHandler] Routing message to flowbot
   [WhatsAppMessageHandler] Calling unified chatbot stream endpoint
   [WhatsAppMessageHandler] Chatbot response received from unified endpoint
   ```

4. **Test Message Flow**
   - Send a message from WhatsApp (e.g., "Hello")
   - Expected behavior:
     - Message saved to database (check `whatsapp_messages` table)
     - `routeMessageToFlowbot` called (check logs)
     - Chatbot response generated via `/api/v1/chatbot/stream`
     - Response sent back via WhatsApp

## 🐛 Common Issues & Solutions

### Issue 1: No Flowbot Response
**Symptoms**: Incoming WhatsApp messages are received but Flowbot doesn't respond

**Possible Causes**:
1. ❌ Routing rule is not `FLOWBOT_FIRST` or `FLOWBOT_ONLY`
   - **Fix**: Update session config:
     ```sql
     UPDATE whatsapp_session_configs 
     SET routingRule = 'FLOWBOT_FIRST' 
     WHERE sessionId = 'your-session-id';
     ```

2. ❌ Baileys worker is not running
   - **Fix**: Start the worker:
     ```bash
     cd apps/backend
     tsx scripts/baileys-worker-standalone.ts
     ```

3. ❌ Session is not actually CONNECTED
   - **Fix**: Check session status and reconnect if needed

4. ❌ Backend URL environment variable not set
   - **Fix**: Set `BACKEND_URL` or `INTERNAL_BACKEND_URL` in environment

### Issue 2: Different Responses Between WhatsApp and Full Chat
**Symptoms**: Flowbot responds differently on WhatsApp vs web interface

**Possible Causes**:
1. ❌ Different conversation context
   - WhatsApp sends: `{ source: 'whatsapp', contactId: '...' }`
   - Full chat sends: different context
   - **Fix**: Ensure chatbot logic handles both contexts identically

2. ❌ Session IDs are different
   - WhatsApp uses WhatsApp sessionId
   - Full chat uses different sessionId
   - **Fix**: This is expected - each should maintain its own conversation history

### Issue 3: Messages Not Being Saved
**Symptoms**: WhatsApp messages don't appear in the database

**Possible Causes**:
1. ❌ Prisma connection issue
   - **Fix**: Check database connection in worker logs

2. ❌ Message handler not registered
   - **Fix**: Verify socket manager calls `handleMessageUpsert` on 'messages.upsert' event

## 📊 Architecture Flow

```
WhatsApp → Baileys Socket → Message Handler → Route Check → Chatbot Stream API → AI Response → Send via WhatsApp
                                   ↓                ↓                   ↓
                            Save to DB      Check Config     Unified Endpoint
                                              (FLOWBOT_FIRST)  (Same as web)
```

## ✅ Next Steps

1. **Verify Configuration**
   - [ ] Check all WhatsApp sessions have `routingRule: 'FLOWBOT_FIRST'`
   - [ ] Verify sessions are actually CONNECTED (not just QR scanned)

2. **Add Enhanced Logging**
   - [ ] Add more detailed logs in `routeMessageToFlowbot`
   - [ ] Log the exact payload sent to `/api/v1/chatbot/stream`
   - [ ] Log the response received from chatbot

3. **Test Manually**
   - [ ] Send test message from WhatsApp
   - [ ] Check worker logs for routing activity
   - [ ] Verify response is sent back

4. **Compare Behavior**
   - [ ] Send same message via WhatsApp and full chat
   - [ ] Compare responses (should be similar/identical)
   - [ ] Check conversation context differences

## 🎓 Code References

- **Session Config Creation**: `apps/backend/src/admin/whatsapp.service.ts:152-161`
- **Message Routing Logic**: `apps/backend/src/lib/whatsapp/baileys/message-handler.ts:121-193`
- **Unified Chatbot Call**: `apps/backend/src/lib/whatsapp/baileys/message-handler.ts:199-320`
- **Routing Rules Schema**: `packages/prisma/schema.prisma:1468-1474`
- **Session Config Model**: `packages/prisma/schema.prisma:1504-1521`

## 📝 Conclusion

The codebase is **already configured correctly** to ensure Flowbot consistency between WhatsApp and full chat. Both use the same `/api/v1/chatbot/stream` endpoint with appropriate context.

If Flowbot is not responding to WhatsApp messages, the issue is likely:
1. Worker not running
2. Session not fully connected
3. Routing rule misconfigured (though default is correct)
4. Backend URL environment variable missing

**Recommended Action**: Add enhanced logging and test with a live WhatsApp session to identify the specific failure point.
