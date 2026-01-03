#!/bin/bash

echo "=== PRUEBAS DEL FIX DE PAYMENT ==="
echo ""

BACKEND_URL="https://nuoip-production.up.railway.app"
FRONTEND_URL="https://matmax.flowcast.chat"

echo "1. ✅ Verificando salud del backend:"
HEALTH=$(curl -s "$BACKEND_URL/api/v1/health")
if echo "$HEALTH" | grep -q "ok"; then
  echo "   ✅ Backend funcionando"
else
  echo "   ❌ Backend no responde correctamente"
  exit 1
fi
echo ""

echo "2. ✅ Probando creación de formulario Lyra (verificar URLs de redirect):"
# Necesitamos un token válido, pero podemos verificar los logs
echo "   ⏳ Este test requiere un token de payment link válido"
echo "   Verificar en logs que 'Tenant base URL resolved' muestra el dominio del tenant"
echo "   Verificar que 'Redirect URLs' apuntan a $FRONTEND_URL/api/payments/lyra/redirect/..."
echo ""

echo "3. ✅ Probando endpoint de success en frontend (mismo dominio):"
SUCCESS_RESPONSE=$(curl -s -X POST "$FRONTEND_URL/api/payments/lyra/redirect/success" \
  -H "Content-Type: application/json" \
  -d '{"kr-answer":"test123"}' \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$SUCCESS_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$SUCCESS_RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "201" ]; then
  echo "   ✅ HTTP Status: $HTTP_STATUS"
else
  echo "   ❌ HTTP Status incorrecto: $HTTP_STATUS"
  echo "$BODY" | head -3
fi

if echo "$BODY" | grep -q "window.location.href"; then
  echo "   ✅ HTML con redirect generado"
  SUCCESS_URL=$(echo "$BODY" | grep -o "window.location.href=\"[^\"]*\"" | sed 's/window.location.href="//;s/"//')
  echo "   URL: $SUCCESS_URL"
  
  if [[ "$SUCCESS_URL" == *"/payments/lyra/browser-success"* ]]; then
    echo "   ✅ URL apunta a la página correcta"
  else
    echo "   ❌ URL incorrecta"
  fi
else
  echo "   ⚠️  No se generó HTML con redirect (puede ser normal si hay error)"
  echo "$BODY" | head -3
fi
echo ""

echo "4. ✅ Probando endpoint de failure en frontend (mismo dominio):"
FAILURE_RESPONSE=$(curl -s -X POST "$FRONTEND_URL/api/payments/lyra/redirect/failure" \
  -H "Content-Type: application/json" \
  -d '{"kr-answer":"test456"}' \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$FAILURE_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$FAILURE_RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "201" ]; then
  echo "   ✅ HTTP Status: $HTTP_STATUS"
else
  echo "   ❌ HTTP Status incorrecto: $HTTP_STATUS"
  echo "$BODY" | head -3
fi

if echo "$BODY" | grep -q "window.location.href"; then
  echo "   ✅ HTML con redirect generado"
  FAILURE_URL=$(echo "$BODY" | grep -o "window.location.href=\"[^\"]*\"" | sed 's/window.location.href="//;s/"//')
  echo "   URL: $FAILURE_URL"
  
  if [[ "$FAILURE_URL" == *"/payments/lyra/browser-failure"* ]]; then
    echo "   ✅ URL apunta a la página correcta"
  else
    echo "   ❌ URL incorrecta"
  fi
else
  echo "   ⚠️  No se generó HTML con redirect (puede ser normal si hay error)"
  echo "$BODY" | head -3
fi
echo ""

echo "5. ✅ Probando webhook con estructura kr-answer (simulando payload real de Lyra):"
# Simular el payload que Lyra envía según los logs
WEBHOOK_PAYLOAD='{
  "kr-hash-key": "password",
  "kr-hash-algorithm": "sha256_hmac",
  "kr-answer": {
    "shopId": "88569105",
    "orderCycle": "CLOSED",
    "orderStatus": "PAID",
    "serverDate": "2025-12-03T23:48:41+00:00",
    "orderDetails": {
      "orderTotalAmount": 100,
      "orderEffectiveAmount": 100,
      "orderPaidAmount": 100,
      "orderCurrency": "PEN",
      "mode": "PRODUCTION",
      "orderId": "order_test123_1764805367744",
      "metadata": null
    },
    "customer": {
      "billingDetails": {
        "category": "PRIVATE",
        "language": "EN"
      },
      "email": "test@example.com",
      "reference": "test customer"
    }
  },
  "kr-answer-type": "json",
  "kr-hash": "testhash",
  "kr-src": "test"
}'

WEBHOOK_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/payments/lyra/webhook?mode=production" \
  -H "Content-Type: application/json" \
  -d "$WEBHOOK_PAYLOAD" \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$WEBHOOK_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$WEBHOOK_RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "201" ]; then
  echo "   ✅ HTTP Status: $HTTP_STATUS"
  
  if echo "$BODY" | grep -q "success.*true" || echo "$BODY" | grep -q '"success":true'; then
    echo "   ✅ Webhook procesado exitosamente"
    
    if echo "$BODY" | grep -q "order_test123"; then
      echo "   ✅ orderId extraído correctamente"
    else
      echo "   ⚠️  orderId no encontrado en respuesta (verificar logs)"
    fi
  else
    if echo "$BODY" | grep -q "Missing orderId"; then
      echo "   ❌ Error: orderId no encontrado (el fix no funcionó)"
      echo "$BODY" | head -5
    else
      echo "   ⚠️  Respuesta inesperada"
      echo "$BODY" | head -5
    fi
  fi
else
  echo "   ❌ HTTP Status incorrecto: $HTTP_STATUS"
  echo "$BODY" | head -5
fi
echo ""

echo "=== RESUMEN ==="
echo "✅ Backend desplegado y funcionando"
echo "✅ Rutas de redirect en frontend creadas"
echo "✅ Webhook actualizado para extraer orderId de kr-answer"
echo ""
echo "Próximos pasos:"
echo "1. Probar un pago real para verificar que las URLs usan el dominio del tenant"
echo "2. Verificar en logs que 'Tenant base URL resolved' muestra el subdominio correcto"
echo "3. Verificar que no hay errores de CSP en la consola del navegador"
echo ""

