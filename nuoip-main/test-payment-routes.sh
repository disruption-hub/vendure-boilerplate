#!/bin/bash

echo "=== Testing Payment Routes ==="
echo ""

echo "1. Testing OPTIONS on lyra-success:"
curl -X OPTIONS https://matmax.flowcast.chat/api/payments/lyra-success -w "\nHTTP Status: %{http_code}\n" -s -o /dev/null

echo ""
echo "2. Testing POST on lyra-success:"
curl -X POST https://matmax.flowcast.chat/api/payments/lyra-success \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "kr-answer=eyJvcmRlckRldGFpbHMiOnsib3JkZXJJZCI6InRlc3QxMjMifX0=" \
  -w "\nHTTP Status: %{http_code}\nLocation: %{redirect_url}\n" \
  -s -o /dev/null

echo ""
echo "3. Testing GET on lyra-success:"
curl -X GET https://matmax.flowcast.chat/api/payments/lyra-success \
  -w "\nHTTP Status: %{http_code}\nLocation: %{redirect_url}\n" \
  -s -o /dev/null

echo ""
echo "4. Testing POST on lyra-failure:"
curl -X POST https://matmax.flowcast.chat/api/payments/lyra-failure \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "kr-answer=eyJlcnJvckNvZGUiOiJURVNUX0VSUk9SIn0=" \
  -w "\nHTTP Status: %{http_code}\nLocation: %{redirect_url}\n" \
  -s -o /dev/null

echo ""
echo "5. Testing /api/health (should work):"
curl -X GET https://matmax.flowcast.chat/api/health \
  -w "\nHTTP Status: %{http_code}\n" \
  -s -o /dev/null

echo ""
echo "=== Test Complete ==="

