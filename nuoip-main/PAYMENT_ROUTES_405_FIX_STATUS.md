# Estado del Fix para Error 405 en Payment Routes

## Problema
Las rutas `/api/payments/lyra/browser-success` y `/api/payments/lyra/browser-failure` devuelven **HTTP 405** en producción (Vercel), aunque funcionan correctamente en el build local.

## Diagnóstico

### Tests Realizados
```bash
# OPTIONS funciona (204)
curl -X OPTIONS https://matmax.flowcast.chat/api/payments/lyra/browser-success
# ✅ HTTP Status: 204

# POST devuelve 405
curl -X POST https://matmax.flowcast.chat/api/payments/lyra/browser-success
# ❌ HTTP Status: 405, x-matched-path: /404

# GET devuelve 404
curl -X GET https://matmax.flowcast.chat/api/payments/lyra/browser-success
# ❌ HTTP Status: 404, x-matched-path: /404

# Otras rutas API funcionan
curl -X POST https://matmax.flowcast.chat/api/crm/tickets
# ✅ HTTP Status: 400 (respuesta del backend, no 405)
```

### Observaciones
1. **OPTIONS funciona**: La ruta está siendo reconocida parcialmente
2. **POST/GET no funcionan**: Vercel devuelve 405/404 con `x-matched-path: /404`
3. **Build local correcto**: Las rutas aparecen en `routes-manifest.json` como `ƒ` (Dynamic)
4. **Otras rutas API funcionan**: `/api/health`, `/api/crm/tickets`, etc. funcionan correctamente

## Cambios Realizados

### 1. Simplificación de Rutas
- Eliminados métodos PUT, PATCH, DELETE, HEAD (innecesarios)
- Mantenidos solo POST, GET, OPTIONS
- Estructura alineada con otras rutas API que funcionan

### 2. Estructura Final
```typescript
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS(request: NextRequest) { ... }
export async function POST(request: NextRequest) { ... }
export async function GET(request: NextRequest) { ... }
```

## Posibles Causas

1. **Caché de Vercel**: Vercel podría estar cacheando una versión antigua de las rutas
2. **Problema de Despliegue**: Las rutas podrían no estar desplegándose correctamente
3. **Problema de Routing**: Next.js/Vercel podría tener un problema específico con estas rutas
4. **Problema de Build**: Aunque el build local es correcto, podría haber un problema en el build de Vercel

## Próximos Pasos

### Opción 1: Verificar Logs de Vercel
- Revisar logs de despliegue en Vercel Dashboard
- Verificar si hay errores durante el build
- Verificar si las rutas están siendo reconocidas en el build de producción

### Opción 2: Forzar Rebuild Limpio
```bash
# Limpiar caché de Vercel
vercel --prod --force --no-cache
```

### Opción 3: Verificar Configuración de Vercel
- Verificar si hay rewrites o redirects que interfieran
- Verificar configuración de `vercel.json`
- Verificar si hay middleware que intercepte estas rutas

### Opción 4: Enfoque Alternativo
Si el problema persiste, considerar:
- Usar un middleware de Next.js para manejar estas rutas
- Mover la lógica a otra ruta API que funcione
- Usar un rewrite en `next.config.ts` o `vercel.json`

## Archivos Modificados
- `apps/nextjs/src/app/api/payments/lyra/browser-success/route.ts`
- `apps/nextjs/src/app/api/payments/lyra/browser-failure/route.ts`

## Commits
- `1db70b797`: fix: simplify browser-success/failure routes to match working API route patterns

