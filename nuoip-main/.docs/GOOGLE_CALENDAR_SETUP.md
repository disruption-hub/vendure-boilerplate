# Google Calendar Integration Setup

This document explains how to set up Google Calendar integration for the chatbot's meeting scheduling functionality.

## Prerequisites

1. Google Cloud Console account
2. Google Calendar API enabled
3. Service account with appropriate permissions

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API

### 2. Create a Service Account

1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Fill in the details:
   - Name: `nuo-calendar-service`
   - Description: `Service account for NUO chatbot calendar integration`
4. Click "Create and Continue"
5. Skip the "Grant access" step for now
6. Click "Done"

### 3. Generate Service Account Key

1. Click on the created service account
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Download the JSON file

### 4. Share Calendar with Service Account

1. Open Google Calendar
2. Go to calendar settings
3. Share the calendar with the service account email
4. Give "Make changes to events" permission

### 5. Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Google Calendar Integration
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=primary
```

### 6. Install Dependencies

```bash
npm install googleapis google-auth-library
```

## Usage

The chatbot can now:

1. **Schedule meetings**: "Schedule a meeting for tomorrow at 2 PM"
2. **List meetings**: "Show me my upcoming meetings"
3. **Cancel meetings**: "Cancel the meeting on Friday"

## Tool Functions Available

- `schedule_meeting`: Create new calendar events
- `list_meetings`: Retrieve upcoming events
- `cancel_meeting`: Delete calendar events

## Security Notes

- Keep your service account credentials secure
- Use environment variables for all sensitive data
- Regularly rotate service account keys
- Monitor API usage and set appropriate quotas

## Troubleshooting

### Common Issues

1. **"Calendar not found"**: Ensure the service account has access to the calendar
2. **"Authentication failed"**: Check that the private key is correctly formatted
3. **"Insufficient permissions"**: Verify the service account has "Make changes to events" permission

### Testing

You can test the integration using the API endpoint:

```bash
curl -X POST http://localhost:3000/api/chatbot/tools \
  -H "Content-Type: application/json" \
  -d '{
    "toolCall": {
      "name": "schedule_meeting",
      "parameters": {
        "title": "Test Meeting",
        "startTime": "2024-01-15T10:00:00",
        "endTime": "2024-01-15T11:00:00"
      }
    }
  }'
```
