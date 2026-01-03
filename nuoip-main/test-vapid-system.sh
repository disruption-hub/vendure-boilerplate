#!/bin/bash

echo "🧪 VAPID Keys System Testing Script"
echo "=================================="

# Test 1: Check if VAPID API is accessible
echo "1. Testing VAPID API endpoint..."
VAPID_RESPONSE=$(curl -s "https://ipnuo-as2kulsj6-matmaxworlds-projects.vercel.app/api/admin/system/vapid")
if echo "$VAPID_RESPONSE" | grep -q '"success":true'; then
    echo "   ✅ VAPID API is accessible"
    PUBLIC_KEY=$(echo "$VAPID_RESPONSE" | grep -o '"publicKey":"[^"]*"' | cut -d'"' -f4)
    echo "   📋 Public Key: ${PUBLIC_KEY:0:20}..."
else
    echo "   ❌ VAPID API is not accessible"
fi

# Test 2: Check if PWA is accessible
echo ""
echo "2. Testing PWA accessibility..."
PWA_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://ipnuo-as2kulsj6-matmaxworlds-projects.vercel.app/")
if [ "$PWA_RESPONSE" = "200" ] || [ "$PWA_RESPONSE" = "307" ]; then
    echo "   ✅ PWA is accessible"
else
    echo "   ❌ PWA is not accessible (HTTP $PWA_RESPONSE)"
fi

# Test 3: Check if admin panel is accessible
echo ""
echo "3. Testing admin panel accessibility..."
ADMIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://ipnuo-as2kulsj6-matmaxworlds-projects.vercel.app/admin")
if [ "$ADMIN_RESPONSE" = "200" ]; then
    echo "   ✅ Admin panel is accessible"
else
    echo "   ❌ Admin panel is not accessible (HTTP $ADMIN_RESPONSE)"
fi

# Test 4: Check if push notification API is accessible
echo ""
echo "4. Testing push notification API..."
PUSH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://ipnuo-as2kulsj6-matmaxworlds-projects.vercel.app/api/notifications/push")
if [ "$PUSH_RESPONSE" = "405" ] || [ "$PUSH_RESPONSE" = "200" ]; then
    echo "   ✅ Push notification API is accessible"
else
    echo "   ❌ Push notification API is not accessible (HTTP $PUSH_RESPONSE)"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Go to: https://ipnuo-as2kulsj6-matmaxworlds-projects.vercel.app/admin"
echo "2. Login as super_admin"
echo "3. Click 'VAPID Keys' in sidebar"
echo "4. Click 'Test Keys' button"
echo "5. Open PWA: https://ipnuo-as2kulsj6-matmaxworlds-projects.vercel.app/"
echo "6. Click '🔔 Enable Notifications'"
echo "7. Test a payment to verify notifications work"
