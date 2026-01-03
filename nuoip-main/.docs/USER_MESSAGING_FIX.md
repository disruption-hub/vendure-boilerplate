# Fix for "Recipient not found or not part of tenant" Error

## Problem
Users were getting the error "No se pudo enviar el mensaje" (Could not send message) with "Recipient not found or not part of tenant" when trying to send messages between users.

## Root Cause
The recipient lookup logic in `createUserChatMessage` was redundant and had poor error handling. It was checking the same conditions multiple times and not properly logging what was happening.

## Changes Made

### 1. Improved Recipient Lookup Logic (`src/lib/services/tenant-user-chat-service.ts`)

**Before:** Redundant checks with poor error messages
**After:** Clean, sequential lookup with detailed logging:

```typescript
// 1. First, try to find recipient by ID
let recipient = await prisma.user.findFirst({
  where: { id: recipientId, tenantId },
  select: { id: true, email: true, name: true },
})

// 2. If not found and email provided, try email fallback
if (!recipient && recipientEmail) {
  recipient = await prisma.user.findFirst({
    where: {
      tenantId,
      email: { equals: recipientEmail, mode: 'insensitive' },
    },
    select: { id: true, email: true, name: true },
  })
}

// 3. If still not found, throw detailed error
if (!recipient) {
  logger.error('Recipient not found', { 
    attemptedRecipientId: recipientId, 
    attemptedRecipientEmail: recipientEmail,
    tenantId 
  })
  throw new Error('Recipient not found or not part of tenant')
}
```

### 2. Enhanced Client-Side Debugging (`src/components/chatbot/fullscreen/FullScreenChatbot.tsx`)

Added comprehensive console logging to track:
- What data is being sent to the API
- Server responses (both success and error)
- Successful message creation

## Message Persistence (Already Working)

Messages ARE already persisted and loaded correctly:

1. **Saving:** Messages are saved to `TenantUserChatMessage` table when sent
2. **Loading:** Messages are automatically loaded when opening a chat via `loadUserThread` function
3. **Retention:** All messages are kept in the database and loaded on subsequent sessions

## How to Debug the Issue

1. **Open Browser Console** (F12 or Cmd+Option+I)

2. **Try sending a message between users**

3. **Check the console logs:**
   - Look for: `FullScreenChatbot: Sending direct message`
     - This shows what `peerUserId` and `recipientEmail` are being sent
   
   - Check server logs for:
     - `Looking up recipient` - Shows what the server is searching for
     - `Recipient not found by ID, trying email fallback` - Shows fallback attempt
     - `Found recipient by email` - Shows successful email fallback
     - `Recipient not found` - Shows the final error with all attempted values
     - `Creating message` - Shows successful recipient lookup

4. **Common Issues to Check:**

   a. **Wrong Tenant ID:**
      - Verify both sender and recipient have the same `tenantId` in the database
      - Check: `SELECT id, email, name, tenantId FROM "users" WHERE email = 'user@example.com';`

   b. **User Not in Database:**
      - Ensure the recipient user exists in the `users` table
      - Check: `SELECT id, email, name FROM "users" WHERE id = 'USER_ID';`

   c. **Wrong User ID Format:**
      - User contacts have ID format `user:{actualUserId}`
      - The code strips the `user:` prefix before lookup
      - Verify the `activePeerUserId` is correct in console logs

   d. **Email Mismatch:**
      - If using email fallback, ensure the email in contact metadata matches the user's email in database
      - Check: `SELECT email FROM "users" WHERE id = 'USER_ID';`

## Verification Steps

1. Deploy the changes
2. Clear browser cache and reload
3. Open two browser sessions with different users
4. Try sending messages
5. Check console logs for detailed debugging info
6. Check server logs (Vercel logs) for recipient lookup details

## Database Queries for Troubleshooting

```sql
-- Check users in a tenant
SELECT id, email, name, tenantId, createdAt 
FROM "users" 
WHERE "tenantId" = 'YOUR_TENANT_ID'
ORDER BY createdAt DESC;

-- Check recent messages
SELECT id, "senderId", "recipientId", content, "createdAt"
FROM "tenant_user_chat_messages"
WHERE "tenantId" = 'YOUR_TENANT_ID'
ORDER BY "createdAt" DESC
LIMIT 10;

-- Check if user exists with specific email
SELECT id, email, name, "tenantId"
FROM "users"
WHERE email ILIKE 'user@example.com';
```

## Expected Behavior After Fix

1. **Successful Message Send:**
   - Console: "FullScreenChatbot: Sending direct message"
   - Console: "FullScreenChatbot: Message sent successfully"
   - Server log: "Looking up recipient" → "Creating message"
   - Message appears in chat immediately

2. **If Recipient Not Found:**
   - Console: "FullScreenChatbot: Server error response"
   - Server log: "Recipient not found" with all attempted values
   - User sees: "No se pudo enviar el mensaje: Recipient not found or not part of tenant"
   - Check database to verify recipient exists and has correct tenantId

3. **Message Loading on Chat Open:**
   - Previous messages load automatically via `loadUserThread`
   - All messages in the thread are displayed
   - Messages persist across sessions

## Next Steps

If you still see the error after deploying:
1. Share the console logs showing the `peerUserId` and `recipientEmail` values
2. Share the server logs showing the recipient lookup attempt
3. Run the database queries above to verify the recipient user exists
4. Verify both users have the same `tenantId`

