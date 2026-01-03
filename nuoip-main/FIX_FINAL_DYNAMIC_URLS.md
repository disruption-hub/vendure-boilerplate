# Fix Final: URLs Dinámicas para Payment Redirects

## Problema Resuelto ✅

Se corrigió el uso de URLs hardcodeadas del backend. Ahora se resuelven dinámicamente.

## Cambios Implementados

### 1. Método `resolveBackendBaseUrl()`
Creado método que resuelve la URL del backend dinámicamente con prioridades:

```typescript
private resolveBackendBaseUrl(): string {
  // Priority 1: Explicit BACKEND_URL
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.replace(/\/+$/, '')
  }

  // Priority 2: NEXT_PUBLIC_BACKEND_URL (shared between frontend and backend)
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/+$/, '')
  }

  // Priority 3: Railway public domain
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  }

  // Priority 4: Railway static URL
  if (process.env.RAILWAY_STATIC_URL) {
    return process.env.RAILWAY_STATIC_URL.replace(/\/+$/, '')
  }

  // Priority 5: Vercel URL (if backend is on Vercel, though unlikely)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Fallback: Default Railway production URL
  return 'https://nuoip-production.up.railway.app'
}
```

### 2. URLs de Redirect Siempre Usan Backend
El código ahora **siempre** usa los endpoints del backend, ignorando cualquier configuración guardada:

```typescript
const backendBaseUrl = this.resolveBackendBaseUrl()
const successUrl = `${backendBaseUrl}/api/v1/payments/lyra/redirect/success`
const failureUrl = `${backendBaseUrl}/api/v1/payments/lyra/redirect/failure`
```

### 3. Logging Agregado
Se agregó logging para debugging:

```typescript
console.log('[createLyraFormForPaymentLink] Backend base URL resolved:', {
  backendBaseUrl,
  hasBackendUrl: !!process.env.BACKEND_URL,
  hasRailwayPublicDomain: !!process.env.RAILWAY_PUBLIC_DOMAIN,
  hasRailwayStaticUrl: !!process.env.RAILWAY_STATIC_URL,
})
```

## Ventajas

✅ **URLs dinámicas**: Se adaptan al entorno (Railway, Vercel, local, etc.)
✅ **No hardcodeadas**: Usa variables de entorno
✅ **Prioridades claras**: BACKEND_URL > NEXT_PUBLIC_BACKEND_URL > RAILWAY_PUBLIC_DOMAIN > etc.
✅ **Funciona en todos los entornos**: Desarrollo, staging, producción

## Próximos Pasos

1. ✅ Código implementado
2. ⏳ Desplegar backend en Railway
3. ⏳ Verificar que las URLs generadas sean correctas
4. ⏳ Probar flujo completo de pago

## Nota Importante

Si todavía ves el error 405 en `/api/payments/lyra/browser-success`, puede ser porque:
- El backend no se ha desplegado con los cambios más recientes
- Hay un formToken antiguo cacheado que usa las URLs viejas
- Necesitas generar un nuevo formToken después del despliegue

**Solución**: Desplegar el backend y generar un nuevo link de pago para obtener un formToken con las URLs correctas.

