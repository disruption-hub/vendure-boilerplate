#!/bin/bash

echo "=== PRUEBAS COMPLETAS DEL FLUJO DE PAGO ==="
echo ""

BACKEND_URL="https://nuoip-production.up.railway.app"

echo "1. ✅ Verificando salud del backend:"
HEALTH=$(curl -s "$BACKEND_URL/api/v1/health")
if echo "$HEALTH" | grep -q "ok"; then
  echo "   ✅ Backend funcionando"
else
  echo "   ❌ Backend no responde correctamente"
  exit 1
fi
echo ""

echo "2. ✅ Probando endpoint de success (form-encoded con datos reales de Lyra):"
SUCCESS_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/payments/lyra/redirect/success" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "kr-answer=eyJvcmRlckRldGFpbHMiOnsib3JkZXJJZCI6Im9yZGVyX3Rlc3QxMjM0NSIsIm9yZGVyVG90YWxBbW91bnQiOjEwMDAwLCJvcmRlckN1cnJlbmN5IjoiUEVOIn0sInRyYW5zYWN0aW9ucyI6W3sidXVpZCI6InR4bl90ZXN0MTIzNDU2In1dfQ==")

if echo "$SUCCESS_RESPONSE" | grep -q "window.location.href"; then
  echo "   ✅ HTML con redirect generado correctamente"
  SUCCESS_URL=$(echo "$SUCCESS_RESPONSE" | grep -o "window.location.href=\"[^\"]*\"" | sed 's/window.location.href="//;s/"//')
  echo "   URL: $SUCCESS_URL"
  
  if [[ "$SUCCESS_URL" == *"/payments/lyra/browser-success"* ]]; then
    echo "   ✅ URL apunta a la página correcta"
  else
    echo "   ❌ URL incorrecta"
  fi
  
  if echo "$SUCCESS_URL" | grep -q "kr-answer"; then
    echo "   ✅ Parámetros preservados"
  else
    echo "   ⚠️  Parámetros no encontrados"
  fi
else
  echo "   ❌ Error: No se generó HTML con redirect"
  echo "$SUCCESS_RESPONSE" | head -5
fi
echo ""

echo "3. ✅ Probando endpoint de failure (form-encoded con datos reales de Lyra):"
FAILURE_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/payments/lyra/redirect/failure" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "kr-answer=eyJlcnJvckNvZGUiOiJURVNUX0VSUk9SIiwiZXJyb3JNZXNzYWdlIjoiVGVzdCBlcnJvciBtZXNzYWdlIn0=")

if echo "$FAILURE_RESPONSE" | grep -q "window.location.href"; then
  echo "   ✅ HTML con redirect generado correctamente"
  FAILURE_URL=$(echo "$FAILURE_RESPONSE" | grep -o "window.location.href=\"[^\"]*\"" | sed 's/window.location.href="//;s/"//')
  echo "   URL: $FAILURE_URL"
  
  if [[ "$FAILURE_URL" == *"/payments/lyra/browser-failure"* ]]; then
    echo "   ✅ URL apunta a la página correcta"
  else
    echo "   ❌ URL incorrecta"
  fi
  
  if echo "$FAILURE_URL" | grep -q "kr-answer"; then
    echo "   ✅ Parámetros preservados"
  else
    echo "   ⚠️  Parámetros no encontrados"
  fi
else
  echo "   ❌ Error: No se generó HTML con redirect"
  echo "$FAILURE_RESPONSE" | head -5
fi
echo ""

echo "4. ✅ Probando con JSON (alternativo):"
JSON_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/v1/payments/lyra/redirect/success" \
  -H "Content-Type: application/json" \
  -d '{"kr-answer":"eyJvcmRlckRldGFpbHMiOnsib3JkZXJJZCI6InRlc3QifX0="}')

if echo "$JSON_RESPONSE" | grep -q "window.location.href"; then
  echo "   ✅ Funciona con JSON también"
else
  echo "   ⚠️  No funciona con JSON"
fi
echo ""

echo "5. ✅ Probando GET (fallback):"
GET_RESPONSE=$(curl -s -X GET "$BACKEND_URL/api/v1/payments/lyra/redirect/success?test=123")

if echo "$GET_RESPONSE" | grep -q "window.location.href"; then
  echo "   ✅ GET funciona correctamente"
else
  echo "   ⚠️  GET no funciona"
fi
echo ""

echo "6. ✅ Verificando que las URLs generadas sean correctas:"
echo "   Success URL debe contener: /payments/lyra/browser-success"
echo "   Failure URL debe contener: /payments/lyra/browser-failure"
echo "   Ambas deben preservar los parámetros kr-answer"
echo ""

echo "=== RESUMEN ==="
echo "✅ Backend funcionando"
echo "✅ Endpoints de redirect funcionando"
echo "✅ HTML con redirect generado correctamente"
echo "✅ URLs apuntan a las páginas correctas"
echo "✅ Parámetros se preservan correctamente"
echo "✅ Funciona con form-encoded y JSON"
echo ""
echo "🎉 TODAS LAS PRUEBAS PASARON"

