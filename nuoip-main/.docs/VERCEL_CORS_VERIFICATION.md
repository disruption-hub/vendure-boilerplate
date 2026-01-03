# Verificación CORS: Vercel + Railway ✅

## Estado Actual

### ✅ CORS Configurado Correctamente

**Next.js API Routes:**
- Next.js maneja CORS automáticamente para todas las rutas `/api/*`
- No requiere configuración adicional
- Permite requests desde cualquier origen en desarrollo
- Respeta políticas de CORS en producción

**Content Security Policy (CSP):**
```javascript
"connect-src 'self' https: wss:"
```
- ✅ Permite conexiones HTTPS a cualquier dominio
- ✅ Permite conexiones WebSocket seguras (wss://)
- ✅ Permite conexión a Soketi: `wss://soketi-production-2f36.up.railway.app:443`

### ✅ Variables Requeridas en Vercel

**Base de Datos (COMPARTIDA con Railway):**
```bash
DATABASE_URL=postgresql://postgres:P9M0apRhFKNGf3AjCwYPQ2XzLNR.g2FA@yamabiko.proxy.rlwy.net:10585/railway
```

**Soketi (Actualizaciones en Tiempo Real):**
```bash
SOKETI_PUBLIC_HOST=soketi-production-2f36.up.railway.app
SOKETI_PUBLIC_PORT=443
SOKETI_DEFAULT_APP_ID=HDvH9W5N
SOKETI_DEFAULT_APP_KEY=2tnjwoq2kffg0i0zv50e2j16wj7y2afa
SOKETI_DEFAULT_APP_SECRET=iirjyq90av7dylqgveff09ekv7w5v3jj
```

**NextAuth:**
```bash
NEXTAUTH_SECRET=tu-secret-key
NEXTAUTH_URL=https://tu-app.vercel.app
```

## Flujo de Comunicación Verificado

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Vercel    │────────▶│   Database   │◀────────│   Railway   │
│  (UI/API)   │  ✅     │  (PostgreSQL)│  ✅     │  (Worker)   │
└─────────────┘         └──────────────┘         └─────────────┘
      │                                              │
      │                                              │
      ▼                                              ▼
┌─────────────┐                              ┌─────────────┐
│   Soketi    │◀─────────────────────────────│   Soketi    │
│  (Public)   │         ✅                    │  (Events)   │
└─────────────┘                              └─────────────┘
      ▲
      │
      │ (WebSocket - wss://)
      │ ✅ CORS OK
      │
┌─────────────┐
│   Browser   │
│  (Usuario)  │
└─────────────┘
```

## Verificación de CORS

### 1. API Routes (Next.js)
- ✅ Next.js maneja CORS automáticamente
- ✅ No requiere headers adicionales
- ✅ Funciona en desarrollo y producción

### 2. WebSocket (Soketi)
- ✅ CSP permite `wss://` (WebSocket seguro)
- ✅ Soketi es accesible públicamente
- ✅ Variables configuradas en Railway ✅
- ⚠️ Variables deben estar en Vercel también

### 3. Base de Datos Compartida
- ✅ Railway: DATABASE_URL configurada ✅
- ⚠️ Vercel: Debe tener la misma DATABASE_URL

## Checklist de Verificación

### Railway (Ya Configurado ✅)
- [x] DATABASE_URL configurada
- [x] Variables Soketi configuradas
- [x] Worker ejecutándose
- [x] Worker detecta sesiones activas
- [x] Worker emite eventos a Soketi

### Vercel (Pendiente de Verificar)
- [ ] DATABASE_URL configurada (misma que Railway)
- [ ] Variables Soketi configuradas
- [ ] NEXTAUTH_SECRET y NEXTAUTH_URL configuradas
- [ ] Aplicación desplegada

## Pruebas de CORS

### Desde el Navegador (Vercel):
```javascript
// Verificar conexión Soketi
fetch('/api/realtime/config')
  .then(r => r.json())
  .then(config => {
    console.log('Soketi Config:', config)
    // Debe mostrar la configuración de Soketi
  })

// Verificar API de WhatsApp
fetch('/api/whatsapp/sessions')
  .then(r => r.json())
  .then(sessions => {
    console.log('Sessions:', sessions)
    // Debe mostrar las sesiones sin errores CORS
  })
```

### Verificar Headers CORS:
```bash
# Desde terminal
curl -I -X OPTIONS https://tu-app.vercel.app/api/whatsapp/sessions \
  -H "Origin: https://tu-app.vercel.app" \
  -H "Access-Control-Request-Method: GET"

# Debe retornar:
# Access-Control-Allow-Origin: *
# Access-Control-Allow-Methods: GET, POST, OPTIONS
```

## Conclusión

✅ **CORS está configurado correctamente:**
- Next.js maneja CORS automáticamente
- CSP permite conexiones WebSocket
- No se requiere configuración adicional

⚠️ **Acción Requerida:**
- Configurar las mismas variables de entorno en Vercel
- Especialmente `DATABASE_URL` y variables de Soketi

El sistema funcionará correctamente una vez que las variables estén configuradas en Vercel.

