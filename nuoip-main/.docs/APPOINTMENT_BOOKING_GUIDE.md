# 📅 Appointment Booking System - Complete Guide

## 🎯 Overview

The appointment booking system allows users to schedule calendar appointments through the chatbot interface. The system shows available time slots (9:00 AM, 9:30 AM, 10:30 AM, etc.) from Monday to Friday and creates Google Calendar events when users confirm their selection.

## 🏗️ Architecture

### Core Components

1. **CalendarTool** (`src/lib/ai/tools/calendar-tool.ts`)
   - Handles Google Calendar API interactions
   - Manages available time slots
   - Creates, lists, and cancels calendar events

2. **AppointmentBookingFlow** (`src/lib/ai/appointment-booking-flow.ts`)
   - Manages the conversation flow for booking appointments
   - Handles user interactions and state management
   - Processes appointment details and confirmations

3. **TenantChatbotService** (`src/lib/ai/tenant-chatbot/tenant-chatbot-service.ts`)
   - Integrates appointment booking into the main chatbot
   - Routes appointment-related messages to the booking flow

## 🔧 How It Works

### 1. User Initiates Booking

When a user sends a message containing appointment-related keywords:
- "schedule an appointment"
- "book a meeting"
- "I need a time slot"
- "agendar una cita" (Spanish)

The system detects these keywords and routes the conversation to the appointment booking flow.

### 2. Available Time Slots Generation

The system generates available time slots with these rules:
- **Days**: Monday to Friday only
- **Hours**: 9:00 AM to 5:00 PM
- **Intervals**: 30-minute slots
- **Duration**: 30 minutes (configurable)

Example available slots:
```
1. 9:00 AM
2. 9:30 AM
3. 10:00 AM
4. 10:30 AM
5. 11:00 AM
6. 11:30 AM
```

### 3. Slot Selection

Users can select a time slot by:
- Typing the number (1, 2, 3, etc.)
- Typing the time (9:00 AM, 9:30 AM, etc.)

### 4. Appointment Details Collection

The system collects:
- **Title**: What the appointment is for
- **Attendees**: Email addresses for invitations
- **Location**: Optional meeting location
- **Description**: Optional additional details

### 5. Calendar Event Creation

Once confirmed, the system:
- Creates a Google Calendar event
- Sends invitations to attendees
- Provides confirmation details to the user

## 🚀 Usage Examples

### Example Conversation Flow

```
User: "I want to schedule an appointment"

Bot: "Here are the available time slots for [date]:
1. 9:00 AM
2. 9:30 AM
3. 10:00 AM
4. 10:30 AM
5. 11:00 AM
6. 11:30 AM

Please select a time slot by typing the number (1-6) or the time you prefer."

User: "2"

Bot: "Great! You've selected 9:30 AM. Please provide the following details:
1. What is the appointment for? (title/subject)
2. Any additional details? (optional)
3. Your email address for the invitation
4. Any specific location? (optional)

Please provide these details or type 'confirm' if you want to use default details."

User: "Appointment for consultation
john@example.com
At our main office"

Bot: "Perfect! Your appointment has been scheduled for 9:30 AM.

**Appointment Details:**
- Title: Appointment for consultation
- Time: 9:30 AM
- Date: [date]
- Attendees: john@example.com
- Location: At our main office

You should receive a calendar invitation shortly. Is there anything else I can help you with?"
```

## 🔧 Configuration

### Google Calendar Setup

The system uses Google Calendar API with service account credentials:

```json
{
  "type": "service_account",
  "project_id": "matmaxwellness",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "excel-sheets@matmaxwellness.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

### Environment Variables

```env
# Google Calendar Integration
GOOGLE_SERVICE_ACCOUNT_EMAIL=excel-sheets@matmaxwellness.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=primary
```

## 🛠️ API Endpoints

### Calendar Tool Methods

#### `getAvailableTimeSlots(parameters)`
- **Parameters**: `{ date?, duration?, timeZone? }`
- **Returns**: Available time slots for the specified date
- **Example**: Get slots for tomorrow with 60-minute duration

#### `scheduleMeeting(parameters)`
- **Parameters**: `{ title, startTime, endTime, attendees?, location?, timeZone? }`
- **Returns**: Created calendar event details
- **Example**: Schedule a meeting with attendees

#### `listUpcomingMeetings(parameters)`
- **Parameters**: `{ maxResults? }`
- **Returns**: List of upcoming calendar events
- **Example**: Get next 10 meetings

#### `cancelMeeting(parameters)`
- **Parameters**: `{ eventId }`
- **Returns**: Confirmation of cancellation
- **Example**: Cancel a specific meeting

## 🧪 Testing

### Test the Appointment Booking Flow

```bash
# Run the test script
node test-appointment-booking.js
```

### Test Calendar Integration

```bash
# Test calendar connection
node scripts/test-calendar-connection.js

# Verify calendar configuration
node scripts/verify-calendar-config.js
```

## 🔒 Security & Permissions

### Required Google Calendar Permissions

- **Calendar Read**: View calendar events
- **Calendar Write**: Create, update, delete events
- **Calendar Sharing**: Send invitations

### Service Account Setup

1. Create service account in Google Cloud Console
2. Download JSON credentials
3. Share calendar with service account email
4. Configure environment variables

## 🌐 Multi-language Support

The system supports both English and Spanish:

### English Keywords
- "schedule", "book", "appointment", "meeting"
- "time slot", "available", "calendar"

### Spanish Keywords
- "agendar", "programar", "cita", "reunión"
- "horario", "disponible", "calendario"

## 📊 Analytics & Monitoring

### Conversation Tracking

The system tracks:
- Appointment booking attempts
- Successful bookings
- Failed bookings
- User preferences
- Time slot popularity

### Error Handling

Common error scenarios:
- **No available slots**: Suggests alternative dates
- **Calendar API errors**: Provides fallback options
- **Invalid time selection**: Asks for clarification
- **Missing details**: Prompts for required information

## 🚀 Deployment

### Production Checklist

- [ ] Google Calendar API enabled
- [ ] Service account credentials configured
- [ ] Calendar sharing permissions set
- [ ] Environment variables set
- [ ] Database calendar settings configured
- [ ] Test appointment booking flow
- [ ] Verify calendar event creation

### Monitoring

- Monitor calendar API quota usage
- Track appointment booking success rates
- Monitor error rates and types
- Set up alerts for calendar API failures

## 🔧 Troubleshooting

### Common Issues

1. **"Calendar integration is disabled"**
   - Check tenant calendar settings
   - Verify global calendar configuration

2. **"Google Calendar credentials are missing"**
   - Verify service account credentials
   - Check environment variables

3. **"No available time slots"**
   - Check calendar sharing permissions
   - Verify service account has calendar access

4. **"Failed to schedule meeting"**
   - Check Google Calendar API quota
   - Verify calendar permissions

### Debug Steps

1. Check calendar configuration:
   ```bash
   node scripts/verify-calendar-config.js
   ```

2. Test calendar connection:
   ```bash
   node scripts/test-calendar-connection.js
   ```

3. Check service account permissions
4. Verify calendar sharing settings
5. Review Google Cloud Console logs

## 📈 Future Enhancements

### Planned Features

- **Recurring appointments**: Support for weekly/monthly bookings
- **Custom time slots**: Allow custom availability windows
- **Multiple calendars**: Support for different calendar types
- **Appointment reminders**: Automated reminder notifications
- **Rescheduling**: Allow users to modify existing appointments
- **Waitlist**: Queue system for popular time slots
- **Integration**: Connect with other calendar providers (Outlook, etc.)

### Advanced Features

- **Smart scheduling**: AI-powered optimal time suggestions
- **Conflict resolution**: Automatic handling of scheduling conflicts
- **Bulk operations**: Schedule multiple appointments
- **Analytics dashboard**: Detailed booking statistics
- **Custom workflows**: Tenant-specific booking processes

---

## 🎉 Success!

Your appointment booking system is now fully functional! Users can:

✅ **View available time slots** (9:00 AM, 9:30 AM, 10:30 AM, etc.)  
✅ **Select preferred times** from Monday to Friday  
✅ **Provide appointment details** (title, attendees, location)  
✅ **Receive calendar invitations** automatically  
✅ **Get confirmation** with all appointment details  

The system integrates seamlessly with your existing chatbot and provides a smooth, conversational booking experience.
