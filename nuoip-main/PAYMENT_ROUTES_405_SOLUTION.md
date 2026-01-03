# Solución Temporal para Error 405 en Payment Routes

## Problema Identificado
Las rutas `/api/payments/lyra-success` y `/api/payments/lyra-failure` devuelven **HTTP 405** en producción (Vercel), aunque:
- ✅ OPTIONS funciona (204)
- ✅ Build local correcto
- ✅ Estructura idéntica a otras rutas que funcionan
- ❌ POST y GET devuelven 405/404 con `x-matched-path: /404`

## Diagnóstico
El problema parece ser un bug específico de Vercel con estas rutas. Aunque:
- Las rutas están correctamente implementadas
- El build local es correcto
- La estructura es idéntica a otras rutas que funcionan
- Se probaron múltiples nombres y ubicaciones

Vercel no reconoce estas rutas API en producción.

## Solución Temporal Implementada
Se cambió el enfoque de `NextResponse.redirect()` a devolver HTML con redirect en el cliente:

```typescript
// En lugar de:
return NextResponse.redirect(new URL(redirectUrl, request.url), { status: 302 })

// Ahora devuelve:
const html = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
  <script>window.location.href="${redirectUrl}";</script>
</head>
<body>
  <p>Redirecting... <a href="${redirectUrl}">Click here</a></p>
</body>
</html>`
return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html' } })
```

**Sin embargo, el problema persiste** porque Vercel no reconoce las rutas en absoluto (devuelve 405 antes de ejecutar el código).

## Próximos Pasos Recomendados

### Opción 1: Usar el Backend para el Redirect
En lugar de usar rutas API de Next.js, hacer que el backend NestJS maneje el redirect directamente:

1. El backend devuelve una respuesta HTML con redirect
2. Lyra llama directamente al backend
3. El backend hace el redirect a la página de éxito/fallo

### Opción 2: Usar Rewrites en next.config.ts
Agregar rewrites explícitos para estas rutas:

```typescript
async rewrites() {
  return [
    {
      source: '/api/payments/lyra-success',
      destination: '/api/payments/lyra-success',
      has: [
        {
          type: 'method',
          value: 'POST',
        },
      ],
    },
  ];
}
```

### Opción 3: Contactar Soporte de Vercel
Este parece ser un bug específico de Vercel. Contactar soporte con:
- URL de las rutas que fallan
- Logs del build
- Comparación con rutas que funcionan

## Estado Actual
- ✅ Código correctamente implementado
- ✅ Build local funciona
- ❌ Vercel no reconoce las rutas en producción
- ⏳ Pendiente: Solución definitiva

## Archivos Afectados
- `apps/nextjs/src/app/api/payments/lyra-success/route.ts`
- `apps/nextjs/src/app/api/payments/lyra-failure/route.ts`
- `apps/backend/src/payments/payments.controller.ts` (configura URLs)

