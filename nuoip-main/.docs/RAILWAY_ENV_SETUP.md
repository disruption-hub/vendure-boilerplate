# Configurar Variables de Entorno en Railway para Baileys Worker

El worker de Baileys necesita conectarse a la base de datos que ya está desplegada en Railway.

## Variables Requeridas

### 1. DATABASE_URL (REQUERIDA)
Esta es la URL de conexión a tu base de datos PostgreSQL en Railway.

**Para obtenerla:**
- Ve al dashboard de Railway
- Selecciona tu servicio de base de datos PostgreSQL
- Ve a la pestaña "Variables"
- Copia el valor de `DATABASE_URL` o `POSTGRES_URL`

**O desde CLI:**
```bash
# Si tienes un servicio de PostgreSQL vinculado al proyecto
railway variables --service <nombre-del-servicio-postgres>
```

**Para configurarla:**
```bash
railway variables --set "DATABASE_URL=postgresql://user:password@host:port/database"
```

### 2. Variables de Soketi (REQUERIDAS para actualizaciones en tiempo real)
```bash
railway variables --set "SOKETI_HOST=soketi-production-2f36.up.railway.app"
railway variables --set "SOKETI_PORT=443"
railway variables --set "SOKETI_USE_TLS=true"
railway variables --set "SOKETI_APP_ID=tu-app-id"
railway variables --set "SOKETI_APP_KEY=tu-app-key"
railway variables --set "SOKETI_APP_SECRET=tu-app-secret"
```

### 3. Variables Opcionales
```bash
railway variables --set "BAILEYS_FALLBACK_VERSION=2.3000.0"
railway variables --set "NODE_ENV=production"
```

## Configuración Rápida

Si tu base de datos está en el mismo proyecto de Railway, Railway puede compartir variables automáticamente. Verifica:

1. **En el Dashboard de Railway:**
   - Ve a tu proyecto `zippy-perfection`
   - Ve a la pestaña "Variables"
   - Busca `DATABASE_URL` o `POSTGRES_URL`
   - Si existe, cópiala y configúrala en el servicio `profound-healing`

2. **O vincula el servicio de base de datos:**
   ```bash
   # Lista todos los servicios en el proyecto
   railway service
   
   # Si hay un servicio de PostgreSQL, Railway puede compartir variables automáticamente
   ```

## Verificar Configuración

Después de configurar las variables:

```bash
# Ver todas las variables configuradas
railway variables

# Ver logs para verificar que se conecta correctamente
railway logs
```

Deberías ver en los logs:
```
[baileys-worker] [INFO] Worker loop: checking sessions {"activeSessionCount":X,"activeManagerCount":Y}
```

En lugar de errores de conexión a `localhost:5432`.

## Nota Importante

- El worker de Railway debe usar la **misma base de datos** que tu aplicación en Vercel
- Asegúrate de que `DATABASE_URL` apunte a la base de datos compartida
- Las sesiones emparejadas desde la UI (localhost o Vercel) serán detectadas automáticamente por el worker de Railway

