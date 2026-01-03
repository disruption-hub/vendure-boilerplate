# Ticket Email Templates - Communication Hub Integration

## Overview

Ticket email notifications are now fully integrated with the Communication Hub, allowing you to customize email templates from the admin interface.

## How It Works

When a ticket event occurs (created, comment added, status changed), the system:

1. **Tries to fetch the template** from the Communication Hub using a `templateKey`
2. **Renders the template** with ticket-specific variables
3. **Falls back to inline HTML** if the template is not configured

## Default Templates

Three default email templates are available:

### 1. `ticket-created`
**Sent to:** Assigned operators  
**When:** A new ticket is created  
**Variables:**
```javascript
{
  ticket: {
    id: string
    number: string           // e.g., "AB12CD34"
    title: string
    description: string
    type: string             // help_desk | system_feature | system_bug
    typeLabel: string        // Translated label
    priority: string         // urgent | high | medium | low
    priorityLabel: string    // Translated label
    status: string
    createdAt: string        // ISO date
    createdAtFormatted: string  // Localized date
    link: string             // URL to view ticket
  },
  customer: {
    name: string
    email: string
  },
  assignedTo: {
    name: string
  },
  createdBy: {
    name: string
  }
}
```

### 2. `ticket-comment-added`
**Sent to:** Customer (only for public comments)  
**When:** A new comment is added to the ticket  
**Variables:**
```javascript
{
  ticket: {
    id: string
    number: string
    title: string
    link: string
  },
  customer: {
    name: string
    email: string
  },
  comment: {
    author: string
    content: string          // Plain text
    contentFormatted: string // HTML with <br> tags
  }
}
```

### 3. `ticket-status-changed`
**Sent to:** Customer  
**When:** Ticket status changes (especially to resolved/closed)  
**Variables:**
```javascript
{
  ticket: {
    id: string
    number: string
    title: string
    oldStatus: string
    oldStatusLabel: string
    newStatus: string
    newStatusLabel: string
    link: string
  },
  customer: {
    name: string
    email: string
  },
  updatedBy: {
    name: string
  },
  isResolved: boolean        // true if newStatus === 'resolved'
  isClosed: boolean          // true if newStatus === 'closed'
  statusEmoji: string        // ✅ | 🔒 | 🔄
}
```

## Installation

### Step 1: Run the seed script

```bash
npx ts-node prisma/seeds/ticket-email-templates.ts
```

This will create the three default templates in both Spanish (es) and English (en).

### Step 2: Verify templates in Communication Hub

1. Log in as an admin
2. Navigate to **Communication Hub** → **Templates**
3. Look for templates in the "tickets" category
4. Verify they are marked as "Default" and "Active"

## Customization

### Edit Templates

1. Go to **Communication Hub** → **Templates**
2. Find the ticket template you want to edit
3. Click **Edit**
4. Modify the HTML content and/or subject line
5. Use `{{variable.path}}` syntax to insert dynamic content
6. Save changes

### Template Variables

Templates use Mustache-style syntax: `{{variable.name}}`

**Examples:**
- `{{ticket.title}}` - Insert ticket title
- `{{customer.name}}` - Insert customer name
- `{{ticket.priorityLabel}}` - Insert translated priority label

### Multi-language Support

Each template can have translations in multiple languages:

1. Edit a template
2. Add a new translation
3. Select the language (es, en, etc.)
4. Provide subject and content for that language
5. Save

The system will automatically select the appropriate language based on:
- User's preferred language (if available)
- Fallback to the first available translation

### Tenant-Specific Templates

You can override default templates for specific tenants:

1. As a tenant admin, go to Communication Hub → Templates
2. Create a new template with the same `templateKey`
3. The tenant-specific template will be used instead of the default

## Testing

### Test Email Sending

You can test templates by:

1. Creating a test ticket
2. Adding a comment
3. Changing the ticket status
4. Check the recipient's email inbox

### Preview Templates

In the Communication Hub Template Studio:

1. Select a ticket template
2. Click **Preview**
3. Provide sample JSON variables
4. View rendered output

Example test variables:
```json
{
  "ticket": {
    "number": "TEST1234",
    "title": "Test Ticket",
    "description": "This is a test ticket",
    "typeLabel": "Soporte al Cliente",
    "priority": "high",
    "priorityLabel": "Alta",
    "createdAtFormatted": "5 de noviembre de 2025, 10:30"
  },
  "customer": {
    "name": "Test User",
    "email": "test@example.com"
  }
}
```

## Troubleshooting

### Emails Not Sending

1. **Check Communication Hub configuration:**
   - Go to Communication Hub → Configuration
   - Verify email channel is enabled
   - Check Brevo API credentials are correct

2. **Check template exists:**
   - Verify template with correct `templateKey` exists
   - Ensure template is marked as "Active"
   - Check template channel is set to "EMAIL"

3. **Check logs:**
   - Look for warnings: "Template not found or not an email template"
   - Look for errors: "Failed to fetch and render template"

### Fallback to Inline HTML

If templates are not configured, the system will automatically use inline HTML fallbacks. This ensures emails always work, even without Communication Hub configuration.

To disable fallbacks and force template usage, modify the notification service code.

## API Integration

### Manual Template Rendering

```typescript
import { renderTemplatePreview } from '@/features/communications/api/communication-api'

const result = await renderTemplatePreview({
  templateKey: 'ticket-created',
  language: 'es',
  variables: {
    ticket: { /* ... */ },
    customer: { /* ... */ }
  }
})

console.log(result.html) // Rendered HTML
console.log(result.subject) // Rendered subject
```

### Direct Service Usage

```typescript
import { sendTicketCreatedEmail } from '@/lib/services/notifications/ticket-notification-service'

await sendTicketCreatedEmail(tenantId, {
  ticketId: 'ticket-id',
  ticketNumber: 'ABC123',
  title: 'Customer Issue',
  // ... other ticket data
}, ['operator@example.com'])
```

## Best Practices

1. **Always provide fallback text:** Ensure plain text version is generated for email clients that don't support HTML

2. **Test multi-language:** If you serve international customers, test all language variants

3. **Use semantic variable names:** Organize variables in logical groups (ticket, customer, etc.)

4. **Keep templates responsive:** Ensure email templates work on mobile devices

5. **Monitor email delivery:** Check Communication Hub logs regularly

6. **Update translations together:** When modifying a template, update all language variants

## Support

For questions or issues with ticket email templates:

1. Check Communication Hub logs for errors
2. Verify Brevo API credentials and quota
3. Ensure templates are properly configured
4. Contact system administrator if problems persist

