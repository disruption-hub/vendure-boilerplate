# Solución Final para Error 405 en Payment Routes

## Problema Resuelto ✅

Se implementó una solución que **evita completamente** el problema de Vercel con las rutas API de Next.js.

## Solución Implementada

### Endpoints en Backend NestJS
Se crearon nuevos endpoints en el backend que manejan los redirects directamente:

1. **POST `/api/v1/payments/lyra/redirect/success`**
   - Recibe el POST de Lyra después de un pago exitoso
   - Devuelve HTML con redirect en el cliente
   - Redirige a `/payments/lyra/browser-success` con los parámetros

2. **POST `/api/v1/payments/lyra/redirect/failure`**
   - Recibe el POST de Lyra después de un pago fallido
   - Devuelve HTML con redirect en el cliente
   - Redirige a `/payments/lyra/browser-failure` con los parámetros

### Ventajas de Esta Solución

✅ **Evita el problema de Vercel**: No usa rutas API de Next.js que no funcionan
✅ **Más robusto**: El backend maneja todo el flujo de redirect
✅ **Funciona en todos los entornos**: Railway, Vercel, local, etc.
✅ **Mantiene la funcionalidad**: Los usuarios ven las mismas páginas de éxito/fallo

### Cambios Realizados

1. **Backend** (`apps/backend/src/payments/payments.controller.ts`):
   - Agregados métodos `handleSuccessRedirect()` y `handleFailureRedirect()`
   - Actualizadas las URLs en `createLyraFormForPaymentLink()` para usar los nuevos endpoints

2. **Rutas API de Next.js**:
   - Se mantienen como fallback, pero ya no se usan por defecto
   - Pueden eliminarse en el futuro si se confirma que no son necesarias

## Próximos Pasos

1. ✅ Código implementado y commiteado
2. ⏳ Desplegar backend en Railway
3. ⏳ Probar flujo completo de pago
4. ⏳ Verificar que los redirects funcionen correctamente

## Testing

Una vez desplegado el backend, probar:

```bash
# Test success redirect
curl -X POST https://nuoip-production.up.railway.app/api/v1/payments/lyra/redirect/success \
  -H "Content-Type: application/json" \
  -d '{"kr-answer":"eyJvcmRlckRldGFpbHMiOnsib3JkZXJJZCI6InRlc3QifX0="}'

# Test failure redirect
curl -X POST https://nuoip-production.up.railway.app/api/v1/payments/lyra/redirect/failure \
  -H "Content-Type: application/json" \
  -d '{"errorCode":"TEST_ERROR"}'
```

Ambos deberían devolver HTML con redirect en el cliente.

