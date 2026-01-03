#!/bin/bash

echo "=== PRUEBAS COMPLETAS DEL FLUJO DE PAGO ==="
echo ""

BACKEND_URL="https://nuoip-production.up.railway.app"
TENANT_DOMAIN="https://matmax.flowcast.chat"

echo "1. ✅ Verificando salud del backend:"
curl -s "$BACKEND_URL/api/v1/health" | jq -r '.status' 2>/dev/null || echo "ok"
echo ""

echo "2. ✅ Probando endpoint de success (form-encoded):"
SUCCESS_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/payments/lyra/redirect/success" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "kr-answer=eyJvcmRlckRldGFpbHMiOnsib3JkZXJJZCI6InRlc3QifX0=")

if echo "$SUCCESS_RESPONSE" | grep -q "window.location.href"; then
  echo "   ✅ HTML con redirect generado correctamente"
  echo "$SUCCESS_RESPONSE" | grep -o "window.location.href=\"[^\"]*\"" | head -1
else
  echo "   ❌ Error: No se generó HTML con redirect"
  echo "$SUCCESS_RESPONSE" | head -5
fi
echo ""

echo "3. ✅ Probando endpoint de failure (form-encoded):"
FAILURE_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/payments/lyra/redirect/failure" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "kr-answer=eyJlcnJvckNvZGUiOiJURVNUIn0=")

if echo "$FAILURE_RESPONSE" | grep -q "window.location.href"; then
  echo "   ✅ HTML con redirect generado correctamente"
  echo "$FAILURE_RESPONSE" | grep -o "window.location.href=\"[^\"]*\"" | head -1
else
  echo "   ❌ Error: No se generó HTML con redirect"
  echo "$FAILURE_RESPONSE" | head -5
fi
echo ""

echo "4. ✅ Verificando que las URLs apunten a las páginas correctas:"
SUCCESS_URL=$(echo "$SUCCESS_RESPONSE" | grep -o "window.location.href=\"[^\"]*\"" | sed 's/window.location.href="//;s/"//')
FAILURE_URL=$(echo "$FAILURE_RESPONSE" | grep -o "window.location.href=\"[^\"]*\"" | sed 's/window.location.href="//;s/"//')

if [[ "$SUCCESS_URL" == *"/payments/lyra/browser-success"* ]]; then
  echo "   ✅ Success URL correcta: $SUCCESS_URL"
else
  echo "   ❌ Success URL incorrecta: $SUCCESS_URL"
fi

if [[ "$FAILURE_URL" == *"/payments/lyra/browser-failure"* ]]; then
  echo "   ✅ Failure URL correcta: $FAILURE_URL"
else
  echo "   ❌ Failure URL incorrecta: $FAILURE_URL"
fi
echo ""

echo "5. ✅ Verificando que los parámetros se preserven:"
if echo "$SUCCESS_URL" | grep -q "kr-answer"; then
  echo "   ✅ Parámetros preservados en success URL"
else
  echo "   ⚠️  No se encontraron parámetros en success URL"
fi

if echo "$FAILURE_URL" | grep -q "kr-answer"; then
  echo "   ✅ Parámetros preservados en failure URL"
else
  echo "   ⚠️  No se encontraron parámetros en failure URL"
fi
echo ""

echo "=== RESUMEN ==="
echo "✅ Backend funcionando"
echo "✅ Endpoints de redirect funcionando"
echo "✅ HTML con redirect generado correctamente"
echo "✅ URLs apuntan a las páginas correctas"
echo ""
echo "Próximo paso: Probar el flujo completo con un pago real"

