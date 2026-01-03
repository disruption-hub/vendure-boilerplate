<!-- a332688f-78c3-44f2-b38a-715c13af4410 4ef200d1-4f61-4a51-9b01-7088acfde22e -->
# Implement WhatsApp Message Handler in NestJS

## Overview

Port all WhatsApp message handling functionality from commit 92d08f97e to the NestJS backend, including automatic contact management, chatbotContact creation, message adapter utilities, and enhanced Soketi event broadcasting.

## Files to Create/Modify

### 1. Create WhatsApp Message Handler Service

**File**: `apps/backend/src/lib/whatsapp/baileys/message-handler.ts`

- Create `WhatsAppMessageHandler` class (NestJS service style)
- Implement `register(socket: WASocket)` to register event handlers
- Implement `handleMessageUpsert()` for new messages
- Implement `handleMessageUpdate()` for delivery/read receipts
- Implement `updateContactFromMessage()`:
  - Update/create `WhatsAppContact` from message
  - Create `ChatbotContact` automatically if missing
  - Link `WhatsAppContact` to `ChatbotContact`
  - Update metadata with WhatsApp session info
  - Return `{ contactId, contactName }`
- Implement `extractPhoneNumber()` helper
- Implement `extractMessageContent()` helper
- Implement `determineMessageType()` helper
- Emit events with `contactId` and `contactName` in payload

### 2. Create Message Adapter Utility

**File**: `apps/backend/src/lib/whatsapp/message-adapter.ts`

- Export `WhatsAppMessageStatus` type
- Export `WhatsAppMessageDto` interface
- Implement `mapWhatsAppDtoToMessage()` function
- Implement `updateMessageDeliveryState()` function
- Map WhatsApp statuses to chatbot delivery statuses

### 3. Enhance Soketi Emitter

**File**: `apps/backend/src/lib/whatsapp/integration/soketi-emitter.ts`

- Add enhanced logging with emojis (📤📤📤, ✅✅✅, ❌❌❌)
- Log before sending events
- Log after successful sends
- Log QR code events specially (📱📱📱)
- Include Railway environment detection in logs
- Add error details logging (code, status, statusCode)

### 4. Integrate Handler in Socket Manager

**File**: `apps/backend/src/lib/whatsapp/baileys/socket-manager.ts`

- Import `WhatsAppMessageHandler`
- Create handler instance in constructor or `connect()`
- Call `handler.register(this.socket)` after socket creation
- Pass `PrismaService` to handler

### 5. Update Standalone Socket Manager

**File**: `apps/backend/src/lib/whatsapp/baileys/socket-manager-standalone.ts`

- Import `WhatsAppMessageHandler`
- Create handler instance in `connect()`
- Call `handler.register(this.socket)` after socket creation
- Pass `PrismaService` to handler

## Implementation Details

### Message Handler Service Structure

```typescript
@Injectable()
export class WhatsAppMessageHandler {
  constructor(
    private readonly sessionId: string,
    private readonly tenantId: string,
    private readonly prisma: PrismaService,
  ) {}

  register(socket: WASocket): void
  private async handleMessageUpsert(...): Promise<void>
  private async handleMessageUpdate(...): Promise<void>
  private async updateContactFromMessage(...): Promise<{ contactId: string | null; contactName: string | null }>
  private extractPhoneNumber(jid: string): string | null
  private extractMessageContent(message: proto.IWebMessageInfo): string | null
  private determineMessageType(message: proto.IWebMessageInfo): WhatsAppMessageType
}
```

### Contact Update Logic

- Use Prisma transactions for atomicity
- Update `WhatsAppContact` with pushName, phoneNumber, metadata
- Create `ChatbotContact` if `chatbotContactId` is null
- Update `ChatbotContact` metadata with WhatsApp info
- Increment `unreadCount` for incoming messages
- Reset `unreadCount` for outgoing messages

### Event Broadcasting

- Include `contactId` and `contactName` in `message.received` events
- Include `contactId` and `remoteJid` in `message.status` events
- Use enhanced logging from Soketi emitter

## Dependencies

- `@prisma/client` (already available)
- `@whiskeysockets/baileys` (already available)
- `PrismaService` from NestJS
- Existing `broadcastWhatsAppEvent` function

## Testing Considerations

- Test contact creation from new messages
- Test contact update from existing messages
- Test chatbotContact linking
- Test event broadcasting with contact info
- Test message type detection
- Test phone number extraction

### To-dos

- [ ] Create WhatsAppMessageHandler service in apps/backend/src/lib/whatsapp/baileys/message-handler.ts with all message handling logic
- [ ] Create message-adapter.ts utility with mapWhatsAppDtoToMessage and updateMessageDeliveryState functions
- [ ] Enhance soketi-emitter.ts with improved logging (emojis, Railway detection, error details)
- [ ] Integrate WhatsAppMessageHandler into socket-manager.ts (NestJS version)
- [ ] Integrate WhatsAppMessageHandler into socket-manager-standalone.ts (standalone worker)