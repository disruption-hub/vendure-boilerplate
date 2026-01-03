# Verificación: Vercel + Railway Baileys Worker + CORS

## Configuración Actual

### ✅ CORS en Next.js
- Next.js maneja CORS automáticamente para rutas API
- CSP permite conexiones WebSocket (`wss:`) y HTTPS
- Headers de seguridad configurados en `next.config.ts`

### ✅ Variables de Entorno Requeridas en Vercel

Asegúrate de que estas variables estén configuradas en Vercel:

```bash
# Base de Datos (REQUERIDA - misma que Railway)
DATABASE_URL=postgresql://postgres:P9M0apRhFKNGf3AjCwYPQ2XzLNR.g2FA@yamabiko.proxy.rlwy.net:10585/railway

# Soketi (REQUERIDAS para actualizaciones en tiempo real)
SOKETI_PUBLIC_HOST=soketi-production-2f36.up.railway.app
SOKETI_PUBLIC_PORT=443
SOKETI_DEFAULT_APP_ID=HDvH9W5N
SOKETI_DEFAULT_APP_KEY=2tnjwoq2kffg0i0zv50e2j16wj7y2afa
SOKETI_DEFAULT_APP_SECRET=iirjyq90av7dylqgveff09ekv7w5v3jj

# NextAuth (REQUERIDAS)
NEXTAUTH_SECRET=tu-secret-key
NEXTAUTH_URL=https://tu-app.vercel.app

# Otras variables según tu configuración
OPENROUTER_API_KEY=...
BREVO_API_KEY=...
```

## Verificación de CORS

### 1. Verificar Headers CORS en Rutas API

Las rutas API de Next.js (`/api/*`) automáticamente:
- Permiten requests desde cualquier origen en desarrollo
- Respetan las políticas de CORS en producción
- No requieren configuración adicional

### 2. Verificar Conexión WebSocket (Soketi)

El CSP en `next.config.ts` ya permite:
```javascript
"connect-src 'self' https: wss:"
```

Esto permite conexiones a:
- `https://soketi-production-2f36.up.railway.app` (HTTPS)
- `wss://soketi-production-2f36.up.railway.app:443` (WebSocket seguro)

### 3. Verificar Comunicación Railway ↔ Vercel

**Railway Worker → Base de Datos:**
- ✅ DATABASE_URL configurada en Railway
- ✅ Worker lee sesiones activas desde la BD

**Vercel → Base de Datos:**
- ✅ DATABASE_URL debe ser la misma en Vercel
- ✅ Vercel crea/actualiza sesiones en la BD

**Railway Worker → Soketi:**
- ✅ Variables Soketi configuradas en Railway
- ✅ Worker emite eventos a Soketi

**Vercel → Soketi:**
- ✅ Variables Soketi deben estar en Vercel
- ✅ Vercel puede leer configuración desde BD o env vars

## Flujo de Comunicación

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Vercel    │────────▶│   Database   │◀────────│   Railway   │
│  (UI/API)   │         │  (PostgreSQL)│         │  (Worker)   │
└─────────────┘         └──────────────┘         └─────────────┘
      │                                              │
      │                                              │
      ▼                                              ▼
┌─────────────┐                              ┌─────────────┐
│   Soketi    │◀─────────────────────────────│   Soketi    │
│  (Public)   │                              │  (Events)   │
└─────────────┘                              └─────────────┘
      ▲
      │
      │ (WebSocket)
      │
┌─────────────┐
│   Browser   │
│  (Usuario)  │
└─────────────┘
```

## Checklist de Verificación

### En Vercel:
- [ ] DATABASE_URL configurada (misma que Railway)
- [ ] Variables Soketi configuradas
- [ ] NEXTAUTH_SECRET y NEXTAUTH_URL configuradas
- [ ] Aplicación desplegada y funcionando

### En Railway:
- [ ] DATABASE_URL configurada ✅
- [ ] Variables Soketi configuradas ✅
- [ ] Worker ejecutándose ✅
- [ ] Worker detecta sesiones activas ✅

### Pruebas:
- [ ] Crear sesión desde Vercel → Se guarda en BD
- [ ] Worker detecta sesión → Se conecta Baileys
- [ ] Escanear QR → Sesión se conecta
- [ ] Eventos en tiempo real → UI se actualiza
- [ ] Enviar mensaje → Funciona correctamente

## Comandos de Verificación

### Verificar variables en Vercel:
```bash
# Desde el dashboard de Vercel o usando Vercel CLI
vercel env ls
```

### Verificar variables en Railway:
```bash
railway variables
```

### Verificar logs del worker:
```bash
railway logs | grep -E "(Worker loop|activeSessionCount|connected)"
```

### Verificar conexión Soketi desde navegador:
```javascript
// En la consola del navegador en Vercel
fetch('/api/realtime/config')
  .then(r => r.json())
  .then(console.log)
```

## Notas Importantes

1. **Misma Base de Datos**: Vercel y Railway deben usar la misma `DATABASE_URL`
2. **Soketi Público**: Soketi debe ser accesible públicamente para que Vercel se conecte
3. **CORS Automático**: Next.js maneja CORS automáticamente, no necesitas configuración adicional
4. **WebSocket Seguro**: Asegúrate de usar `wss://` (WebSocket seguro) en producción

## Solución de Problemas

### Error: "CORS policy blocked"
- Verifica que `next.config.ts` tenga `connect-src 'self' https: wss:`
- Verifica que Soketi esté accesible públicamente

### Error: "Cannot connect to Soketi"
- Verifica variables `SOKETI_PUBLIC_HOST` y `SOKETI_PUBLIC_PORT` en Vercel
- Verifica que Soketi esté ejecutándose en Railway
- Prueba conectarte manualmente: `wss://soketi-production-2f36.up.railway.app:443`

### Error: "Worker no detecta sesiones"
- Verifica `DATABASE_URL` en Railway
- Verifica logs del worker: `railway logs`
- Verifica que la sesión esté en estado `CONNECTING` o `CONNECTED` en la BD

