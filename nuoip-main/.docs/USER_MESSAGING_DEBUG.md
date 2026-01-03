# User-to-User Messaging Debugging Guide

## Problem
Users are receiving the error: **"No se pudo enviar el mensaje"** with **"Recipient not found or not part of tenant"** when trying to send messages between users.

## Root Cause Analysis

### How User Contacts Work
1. **Contact Creation**: User contacts are automatically created with ID format `user:{userId}` (see `chat-contact-service.ts` line 156)
2. **Contact Metadata**: Each user contact has metadata containing the actual `userId`:
   ```typescript
   metadata: {
     type: 'tenant_user',
     userId: user.id,  // The actual user ID from the User table
     email: user.email,
   }
   ```

3. **Recipient ID Extraction**: When sending a message, the code extracts the actual user ID:
   ```typescript
   const activePeerUserId = isTenantUserContact
     ? metadataUserId  // From metadata.userId
         ?? (activeContactRecord?.id ? activeContactRecord.id.replace(/^user:/, '') : null)
     : null
   ```

### The Issue
The recipient lookup is failing because either:
1. The recipient ID being passed doesn't match any user in the database
2. The recipient exists but in a different tenant
3. There's a mismatch between the contact ID format and the actual user ID

## Enhanced Debugging (Applied)

### Server-Side Changes (`src/lib/services/tenant-user-chat-service.ts`)

1. **Enhanced Logging**: Added comprehensive logging to track:
   - Sender and recipient IDs being used
   - Tenant ID for both users
   - Available users in the tenant (for debugging)
   - Email fallback attempts

2. **Sender Verification**: Now verifies the sender exists before attempting to find the recipient

3. **Better Error Messages**: Error messages now include:
   - The attempted recipient ID
   - The attempted recipient email
   - List of available users in the tenant (first 10)

### Client-Side Changes (`src/components/chatbot/fullscreen/FullScreenChatbot.tsx`)

1. **Enhanced Logging**: Added logging to show:
   - Contact key being used
   - Peer user ID
   - Recipient email
   - Current user ID
   - Tenant ID
   - Full payload being sent to the API

## How to Debug

### Step 1: Check Browser Console
When you try to send a message, look for these console logs:

```javascript
FullScreenChatbot: Sending direct message {
  contactKey: "user:abc123",
  peerUserId: "abc123",  // This should be a valid user ID
  recipientEmail: "user@example.com",
  messageLength: 10,
  payload: { recipientId: "abc123", content: "...", recipientEmail: "..." },
  currentUserId: "xyz789",  // This should be the sender's ID
  tenantId: "tenant123"
}
```

### Step 2: Check Server Logs
Look for these server-side logs:

```
Creating user chat message { 
  senderId: "xyz789", 
  recipientId: "abc123", 
  recipientEmail: "user@example.com", 
  tenantId: "tenant123" 
}

Sender verified { senderId: "xyz789", senderEmail: "sender@example.com" }

// If recipient not found:
Recipient not found - Available users: {
  attemptedRecipientId: "abc123",
  attemptedRecipientEmail: "user@example.com",
  tenantId: "tenant123",
  availableUsers: [
    { id: "user1", email: "user1@example.com", name: "User 1" },
    { id: "user2", email: "user2@example.com", name: "User 2" },
    ...
  ]
}
```

### Step 3: Verify the Issue

Compare the `attemptedRecipientId` with the `id` values in `availableUsers`. If they don't match, the issue is that:
1. The contact was created for a user that no longer exists
2. The contact belongs to a different tenant
3. The contact metadata has incorrect user ID

## Message Persistence (Already Working)

Messages ARE already persisted correctly:

1. **Saving**: Messages are saved to the `TenantUserChatMessage` table when sent
2. **Loading**: Messages are loaded via `getUserChatMessages()` function
3. **Retention**: All messages are kept in the database
4. **Auto-loading**: Messages automatically load when opening a chat (see `loadUserThread` in `FullScreenChatbot.tsx`)

## Common Solutions

### Solution 1: Verify User Exists
Make sure both users exist in the database:
```sql
SELECT id, email, name, tenantId FROM "User" WHERE id = 'abc123';
```

### Solution 2: Verify Same Tenant
Make sure both users are in the same tenant:
```sql
SELECT id, email, tenantId FROM "User" WHERE id IN ('senderId', 'recipientId');
```

### Solution 3: Refresh Contacts
The contacts might be stale. Try:
1. Refresh the page
2. Log out and log back in
3. Check if the user contact still appears in the contact list

### Solution 4: Check Contact Metadata
Verify the contact has correct metadata:
```sql
SELECT id, displayName, metadata FROM "ChatbotContact" WHERE id = 'user:abc123';
```

The metadata should contain:
```json
{
  "type": "tenant_user",
  "userId": "abc123",
  "email": "user@example.com"
}
```

## Next Steps

1. Try sending a message and check the browser console logs
2. Check the server logs for detailed error information
3. Compare the attempted recipient ID with available users
4. If the recipient ID doesn't match any user, investigate how the contact was created
5. If you need to manually fix contacts, you can update the contact metadata in the database

## Deployment Notes

After deploying these changes, you'll get much more detailed error messages that will help identify exactly why the recipient lookup is failing.

