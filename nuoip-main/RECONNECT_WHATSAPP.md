# How to Get Phone Number Displaying in UI

## What Was Fixed

The Baileys Worker now extracts the WhatsApp account details (phone number and name) when a connection opens.

## Current Situation

✅ **Nest Backend** - Returns phone number from database (already working)  
✅ **Baileys Worker** - Extracts and saves phone number (code deployed)  
✅ **Frontend UI** - Displays phone number (already working)  

❌ **Your Current Session** - Connected with OLD code (before phone extraction was added)

## Solution: Reconnect

Your current WhatsApp session was connected BEFORE the phone extraction code was deployed. You need to reconnect to trigger the extraction.

### Step 1: Check Baileys Worker Deployment

```bash
# Switch to Baileys Worker service
railway service

# Select "Baileys Worker"

# Check logs to confirm new deployment
railway logs
```

Look for recent logs showing the new deployment.

### Step 2: Reconnect WhatsApp

**Option A: Via UI (Recommended)**
1. Go to WhatsApp Sessions admin panel
2. Select your connected session
3. Click **"Desconectar"**
4. Click **"Reconectar Baileys"**
5. Scan the new QR code
6. After connection opens, phone number and name will display!

**Option B: Via Database (Quick)**
```sql
-- Update session status to force reconnection
UPDATE whatsapp_sessions 
SET status = 'CONNECTING' 
WHERE session_id = 'YOUR_SESSION_ID';
```

The Baileys Worker will pick this up in ~30 seconds and reconnect.

### Step 3: Verify

After reconnection, check the UI. You should see:
- ✅ Phone number (e.g., "+5215512345678")
- ✅ Account name (WhatsApp display name)
- ✅ All other session details

## How It Works

```
1. You scan QR → Baileys gets credentials
2. Connection opens → Baileys extracts phone from state.creds.me.id
3. Baileys saves to DB → phone_number field populated
4. UI fetches session → Displays phone number
```

## Troubleshooting

**Phone still shows "Sin número aún"?**

Check the database:
```sql
SELECT session_id, phone_number, name, status 
FROM whatsapp_sessions 
WHERE session_id = 'YOUR_SESSION_ID';
```

If `phone_number` is still NULL, the Baileys Worker may not have the new code yet. Check deployment logs.
