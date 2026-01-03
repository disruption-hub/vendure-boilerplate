# User Messaging Fix - Session 2

## Issues Fixed

### 1. **Error: "Recipient not found or not part of tenant"**

**Root Cause:**
The error occurs in `src/lib/services/tenant-user-chat-service.ts` when trying to send messages between users. The service validates that both sender and recipient exist in the tenant before allowing a message to be sent.

**Diagnostics Added:**
- Added comprehensive logging in `FullScreenChatbot.tsx` to track:
  - User ID extraction from contact metadata
  - Peer user identification
  - Message sending payload
  - Thread loading process
  
**Console Logs Added:**
```typescript
// When extracting userId from contact metadata
console.log('FullScreenChatbot: Extracted userId from metadata', {
  contactId: activeContactRecord?.id,
  userId: trimmed,
})

// When identifying tenant user contacts
console.log('FullScreenChatbot: Tenant user contact identified', {
  contactId: activeContactRecord?.id,
  metadataUserId,
  activePeerUserId,
  fallbackEmail,
  metadata: activeContactMetadata,
})

// When loading user threads
console.log('FullScreenChatbot: Loading user thread', {
  contactKey,
  peerUserId,
  currentUserId,
  tenantId,
})

// When messages are loaded
console.log('FullScreenChatbot: Loaded messages', {
  contactKey,
  messageCount: mapped.length,
})

// When sending messages (existing log enhanced)
console.log('FullScreenChatbot: Sending direct message', {
  contactKey,
  peerUserId,
  recipientEmail,
  messageLength: messageContent.length,
  payload,
  currentUserId,
  tenantId,
})
```

**How User IDs Work:**
1. Tenant users are added to contacts with ID format: `user:{actualUserId}`
2. Metadata is stored as: `{ type: 'tenant_user', userId: '{actualUserId}', email: '{userEmail}' }`
3. The system extracts the actual user ID either from:
   - `metadata.userId` (preferred)
   - Parsing the contact ID by removing "user:" prefix (fallback)

**Debugging Steps:**
1. Open browser console
2. Try to send a message to another user
3. Check the console logs for:
   - Is the `userId` being correctly extracted?
   - Is the `activePeerUserId` correct?
   - Does the API call include the correct `recipientId`?
4. Check server logs for the detailed error from `tenant-user-chat-service.ts`

### 2. **Messages Not Retaining Memory When Loaded**

**Root Cause:**
The `userThreadLoadedRef` and message state were being cleared whenever `sessionToken` or `currentUserId` changed, even when just switching between contacts.

**Fix Applied:**
Changed the cleanup logic in lines 442-450 of `FullScreenChatbot.tsx`:

**Before:**
```typescript
useEffect(() => {
  // Reset loaded threads when user/session changes
  userThreadLoadedRef.current = {}
}, [sessionToken, currentUserId])
```

**After:**
```typescript
useEffect(() => {
  // Only clear loaded threads when session actually ends (sessionToken becomes null)
  // Preserve message history when switching contacts or when currentUserId updates
  if (!sessionToken) {
    setUserThreads({})
    setCommandThreads({})
    userThreadLoadedRef.current = {}
  }
}, [sessionToken])
```

**Impact:**
- Messages now persist when switching between contacts
- Thread history is only cleared when the user logs out (sessionToken becomes null)
- `userThreadLoadedRef` prevents unnecessary reloading of threads
- Both `userThreads` and `commandThreads` are preserved across contact switches

## Testing Recommendations

### Test Case 1: Send Message Between Users
1. Log in as User A
2. Open chat with User B (another tenant user)
3. Check console for user ID extraction logs
4. Send a message
5. Verify message appears in chat
6. Check if recipient receives the message

### Test Case 2: Message Memory Persistence
1. Log in and send messages to User B
2. Switch to another contact (e.g., FlowBot)
3. Switch back to User B
4. Verify: Previous messages should still be visible
5. Refresh the page
6. Verify: Messages load from database

### Test Case 3: Cross-Session Cleanup
1. Log in and send messages
2. Log out
3. Log back in
4. Verify: Old message threads are cleared (fresh start)

## Files Modified

1. `src/components/chatbot/fullscreen/FullScreenChatbot.tsx`
   - Fixed memory persistence (lines 442-450)
   - Added debug logging for user ID extraction (lines 567-570)
   - Added debug logging for tenant user identification (lines 612-622)
   - Added enhanced thread loading logs (lines 1082-1120)

## Additional Notes

- The `tenant-user-chat-service.ts` already has extensive logging for debugging recipient lookup issues
- When a recipient is not found, it logs all available users in the tenant
- Check server logs for messages like:
  ```
  Recipient not found - Available users: [...]
  ```
- The service attempts email fallback if the direct ID lookup fails

