# User Messaging Diagnostic - Recipient Not Found

## Issue
Error: `Recipient not found or not part of tenant. Attempted ID: cmhiw2xo70005ji04092hf2nb, Email: info@matmax.store`

## Root Cause
The recipient user ID `cmhiw2xo70005ji04092hf2nb` does not exist in the `users` table for the tenant that the sender belongs to.

## How User Messaging Works

### Contact Creation
When users are listed as contacts, they get IDs in the format:
- `user:{actualUserId}` - e.g., `user:cmhiw2xo70005ji04092hf2nb`
- Metadata stores: `{ type: 'tenant_user', userId: 'cmhiw2xo70005ji04092hf2nb', email: 'info@matmax.store' }`

### Message Validation
The API validates:
1. **Sender** must exist in `users` table with the session's `tenantId`
2. **Recipient** must exist in `users` table with the same `tenantId`
3. If recipient ID not found, tries email fallback

## Diagnostic Steps

### 1. Check Server Logs
The enhanced logging now shows:
```
user-threads POST: Request details {
  senderId: '...',
  senderEmail: '...',
  tenantId: '...',
  recipientId: 'cmhiw2xo70005ji04092hf2nb',
  recipientEmail: 'info@matmax.store',
  contentLength: ...
}
```

And from `tenant-user-chat-service.ts`:
```
Recipient not found - Available users: [
  { id: '...', email: '...', name: '...' },
  ...
]
```

### 2. Check Browser Console
Look for:
```
FullScreenChatbot: Sending direct message {
  peerUserId: 'cmhiw2xo70005ji04092hf2nb',
  recipientEmail: 'info@matmax.store',
  currentUserId: '...',
  authUserEmail: '...',
  sessionToken: 'present'
}
```

### 3. Verify Database State

Run this query to check if the recipient exists:
```sql
SELECT id, email, name, "tenantId" 
FROM users 
WHERE id = 'cmhiw2xo70005ji04092hf2nb';
```

If no results, the user was deleted or never existed.

Check if the email exists:
```sql
SELECT id, email, name, "tenantId" 
FROM users 
WHERE email ILIKE 'info@matmax.store';
```

### 4. Check Contact List Source

The contact with `user:` prefix comes from:
```typescript
// src/modules/chatbot/server/chat-contact-service.ts lines 140-171
const users = await prisma.user.findMany({
  where: { tenantId },
  select: { id, name, email, phone, profilePictureUrl, createdAt, updatedAt },
})

const userContacts = users.map(user => ({
  id: `user:${user.id}`,
  metadata: {
    type: 'tenant_user',
    userId: user.id,
    email: user.email,
  },
}))
```

## Possible Scenarios

### Scenario 1: User Was Deleted
- User existed when contact list loaded
- User was deleted before message was sent
- Solution: Refresh contacts or show error "User no longer available"

### Scenario 2: Wrong Tenant
- Sender and recipient belong to different tenants
- Session `tenantId` doesn't match recipient's `tenantId`
- Solution: Check server logs for `tenantId` mismatch

### Scenario 3: Contact Metadata Corruption
- Contact metadata has wrong `userId`
- The ID doesn't match any real user
- Solution: Recreate contacts or fix metadata

## Enhanced Logging Added

### Client-side (FullScreenChatbot.tsx)
- Shows `authUserEmail` and `sessionToken` status
- Shows `peerUserId` and `recipientEmail` being sent

### Server-side (user-threads/route.ts)
- Logs `senderId`, `senderEmail`, `tenantId`
- Logs `recipientId`, `recipientEmail`, `contentLength`

### Service-level (tenant-user-chat-service.ts)
- Already logs all available users when recipient not found
- Shows attempted ID and email

## Next Steps

1. **Deploy the changes** to get enhanced logging
2. **Try sending a message again**
3. **Check server logs** (Vercel logs) for the detailed output
4. **Compare** the `tenantId` from session with the recipient's expected tenant
5. **Verify** if recipient user exists in database with that ID

## Temporary Workaround

If a user was deleted:
1. Remove them from contacts manually
2. Refresh the page to reload contacts
3. The deleted user won't appear in the new contact list

## Long-term Fix

Consider adding:
1. **Contact validation** before showing in list
2. **Real-time contact updates** when users are deleted
3. **Better error message** like "This user is no longer available"
4. **Auto-refresh contacts** when 404 errors occur

