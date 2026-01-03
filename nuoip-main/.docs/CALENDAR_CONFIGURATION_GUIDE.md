# Calendar Configuration System

## Overview

The Calendar Configuration System allows administrators to manage calendar integrations for their tenants and users. This includes setting up Google Calendar, Outlook, and Apple Calendar integrations with proper credential management.

## Database Schema

### New Fields Added

#### Users Table
- `calendarConfig` (JSONB): Individual user calendar configuration

#### Tenants Table  
- `calendarSettings` (JSONB): Global tenant calendar settings

## Configuration Structure

### Tenant Calendar Settings
```typescript
interface TenantCalendarSettings {
  globalEnabled: boolean;           // Master switch for calendar integration
  defaultProvider: 'google' | 'outlook' | 'apple' | 'none';
  allowedProviders: string[];       // Which providers users can choose
  requireAdminApproval: boolean;   // Whether calendar changes need approval
  defaultPermissions: {
    canSchedule: boolean;
    canView: boolean;
    canModify: boolean;
    canDelete: boolean;
  };
  defaultSettings: {
    permissions: CalendarPermissions;
    defaults: {
      meetingDuration: number;      // Default meeting duration in minutes
      bufferTime: number;          // Buffer time between meetings
      workingHours: {
        start: string;             // HH:MM format
        end: string;               // HH:MM format
        days: number[];             // 0-6 (Sunday-Saturday)
      };
      autoAccept: boolean;
      requireApproval: boolean;
    };
    notifications: {
      email: boolean;
      inApp: boolean;
      reminderMinutes: number[];   // Reminder times in minutes
    };
    credentials: {
      serviceAccountEmail: string;
      privateKey: string;
      calendarId: string;
      timeZone: string;
    };
  };
}
```

### User Calendar Configuration
```typescript
interface CalendarConfig {
  enabled: boolean;
  provider: 'google' | 'outlook' | 'apple' | 'none';
  credentials?: {
    serviceAccountEmail?: string;
    privateKey?: string;
    calendarId?: string;
    timeZone?: string;
  };
  permissions: CalendarPermissions;
  defaults: CalendarDefaults;
  notifications: NotificationSettings;
}
```

## Admin Panel Features

### 1. Tenant Settings Tab
- **Global Enable/Disable**: Master switch for calendar integration
- **Default Provider**: Set the default calendar provider
- **Allowed Providers**: Restrict which providers users can use
- **Default Permissions**: Set baseline permissions for all users
- **Default Credentials**: Configure service account credentials
- **Working Hours**: Set global business hours
- **Notification Settings**: Configure default notification preferences

### 2. User Configurations Tab
- **View All Users**: See all user calendar configurations
- **Edit Individual Users**: Configure specific user settings
- **Override Credentials**: Users can have their own credentials
- **Permission Management**: Granular permissions per user
- **Sync Status**: Monitor calendar sync health

## API Endpoints

### GET `/api/admin/calendar-config`
- **Purpose**: Fetch calendar configuration data
- **Parameters**: 
  - `tenantId` (required): Tenant ID
  - `userId` (optional): Specific user ID
- **Returns**: Tenant settings and user configurations

### POST `/api/admin/calendar-config/tenant`
- **Purpose**: Update tenant calendar settings
- **Body**: `{ tenantId: string, settings: TenantCalendarSettings }`
- **Access**: Admin and Super Admin only

### POST `/api/admin/calendar-config/user`
- **Purpose**: Update user calendar configuration
- **Body**: `{ userId: string, config: CalendarConfig }`
- **Access**: Admin and Super Admin only

## Credential Management

### Google Calendar Setup
1. **Service Account**: Create a Google Cloud service account
2. **Credentials**: Download the JSON key file
3. **Calendar Access**: Share the calendar with the service account
4. **Configuration**: Enter credentials in admin panel

### Security Considerations
- **Encryption**: Credentials are stored as JSONB in the database
- **Access Control**: Only admins can view/edit credentials
- **Audit Trail**: All changes are logged
- **Rotation**: Credentials can be updated without affecting users

## Usage Workflow

### 1. Tenant Setup
1. Admin logs into the system
2. Navigates to Admin Panel → Calendar Configuration
3. Enables global calendar integration
4. Sets default provider (e.g., Google Calendar)
5. Configures default credentials
6. Sets working hours and permissions

### 2. User Configuration
1. Admin goes to "User Configurations" tab
2. Selects a user to configure
3. Enables calendar for the user
4. Sets provider and credentials (or uses defaults)
5. Configures user-specific permissions
6. Saves configuration

### 3. Chatbot Integration
1. Users can now use calendar commands in chat
2. "Schedule a meeting for tomorrow at 2 PM"
3. "Show my calendar for this week"
4. "Cancel the meeting with John"

## Supported Providers

### Google Calendar
- **Service Account Authentication**
- **Calendar ID**: Primary or specific calendar
- **Time Zone Support**: Multiple time zones
- **Permissions**: Full CRUD operations

### Outlook (Future)
- **OAuth2 Authentication**
- **Graph API Integration**
- **Office 365 Support**

### Apple Calendar (Future)
- **iCloud Integration**
- **CalDAV Protocol**
- **iOS/macOS Support**

## Error Handling

### Common Issues
1. **Invalid Credentials**: Clear error messages for authentication failures
2. **Calendar Access**: Permissions errors are logged and displayed
3. **Sync Failures**: Automatic retry with exponential backoff
4. **Rate Limiting**: Respect API rate limits

### Monitoring
- **Sync Status**: Real-time sync status for each user
- **Error Logs**: Detailed error logging for debugging
- **Performance Metrics**: API response times and success rates

## Security Best Practices

### Credential Storage
- **Encryption**: All credentials encrypted at rest
- **Access Control**: Role-based access to credential management
- **Audit Logging**: All credential changes are logged
- **Rotation**: Regular credential rotation recommended

### API Security
- **Authentication**: All endpoints require admin authentication
- **Authorization**: Role-based access control
- **Rate Limiting**: Prevent abuse of calendar APIs
- **Input Validation**: All inputs validated and sanitized

## Troubleshooting

### Common Problems
1. **"Calendar not found"**: Check calendar ID and permissions
2. **"Authentication failed"**: Verify service account credentials
3. **"Sync disabled"**: Check if calendar is enabled for user
4. **"Permission denied"**: Verify user has required permissions

### Debug Steps
1. Check tenant settings are properly configured
2. Verify user has calendar enabled
3. Test credentials with Google Calendar API directly
4. Check database for configuration errors
5. Review application logs for detailed error messages

## Future Enhancements

### Planned Features
- **Outlook Integration**: Full Office 365 support
- **Apple Calendar**: iCloud calendar integration
- **Bulk Operations**: Mass user configuration
- **Templates**: Pre-configured calendar setups
- **Analytics**: Calendar usage analytics and reporting
- **Mobile App**: Mobile calendar management
- **Webhooks**: Real-time calendar updates
- **Recurring Events**: Advanced recurring meeting support

### Integration Opportunities
- **CRM Systems**: Salesforce, HubSpot integration
- **Project Management**: Jira, Asana calendar sync
- **Communication**: Slack, Teams calendar notifications
- **Analytics**: Calendar usage insights and optimization
