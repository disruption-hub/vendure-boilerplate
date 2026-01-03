# VAPID Keys Testing Guide

## Step 3: Test Configuration

### 3.1 Test VAPID Keys in Admin Panel
1. Go to your admin panel: https://ipnuo-as2kulsj6-matmaxworlds-projects.vercel.app/admin
2. Login as super_admin
3. Click "VAPID Keys" in the sidebar
4. Click "Test Keys" button
5. You should see a success toast: "VAPID Keys Valid"

### 3.2 Test PWA Push Notifications
1. Open your PWA: https://ipnuo-as2kulsj6-matmaxworlds-projects.vercel.app/
2. Look for the "📱 Install App" button (if available)
3. Click "🔔 Enable Notifications" button
4. Allow notifications when prompted
5. You should see: "🔔 Notifications ON" and a success toast

### 3.3 Test Payment Notification Flow
1. Create a payment link in admin panel
2. Process a test payment
3. Check if you receive a push notification
4. Check if the payment appears in the PWA chat

### 3.4 Verify Service Worker
1. Open browser DevTools (F12)
2. Go to Application tab → Service Workers
3. Verify service worker is registered and active
4. Check Console for any errors

## Complete Testing Checklist

- [ ] VAPID keys generated and stored in database
- [ ] Admin panel shows "Configured" status
- [ ] "Test Keys" button shows success
- [ ] PWA loads without errors
- [ ] Notifications permission granted
- [ ] Service worker registered
- [ ] Push subscription created
- [ ] Payment webhook triggers notification
- [ ] Notification appears on device
- [ ] Payment details shown in chat

## Troubleshooting

### If VAPID Test Fails:
- Check database connection
- Verify keys are properly stored
- Check API endpoint response

### If PWA Notifications Don't Work:
- Check browser notification permissions
- Verify service worker is active
- Check console for JavaScript errors
- Ensure HTTPS (required for push notifications)

### If Payment Notifications Don't Arrive:
- Verify webhook is configured
- Check payment processing
- Verify push subscription is stored
- Check notification API logs
