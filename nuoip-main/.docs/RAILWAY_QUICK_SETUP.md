# Configuración Rápida de Variables en Railway

## Comando para configurar DATABASE_URL

```bash
railway variables --set "DATABASE_URL=postgresql://user:password@host:port/database"
```

## Obtener DATABASE_URL desde otro servicio de Railway

Si tu base de datos PostgreSQL está en otro servicio del mismo proyecto:

1. **Desde el dashboard de Railway:**
   - Ve a tu servicio de PostgreSQL
   - Copia la variable `DATABASE_URL` o `POSTGRES_URL`
   - Ve a tu servicio `profound-healing` (Baileys worker)
   - Pega la variable en "Variables"

2. **O desde CLI:**
   ```bash
   # Cambiar al servicio de PostgreSQL (si está enlazado)
   railway service <nombre-servicio-postgres>
   railway variables
   
   # Copiar DATABASE_URL y luego volver al servicio del worker
   railway service profound-healing
   railway variables --set "DATABASE_URL=<valor-copiado>"
   ```

## Variables Mínimas Requeridas

```bash
# DATABASE_URL (REQUERIDA)
railway variables --set "DATABASE_URL=postgresql://..."

# Variables de Soketi (si usas actualizaciones en tiempo real)
railway variables --set "SOKETI_HOST=soketi-production-2f36.up.railway.app"
railway variables --set "SOKETI_PORT=443"
railway variables --set "SOKETI_USE_TLS=true"
railway variables --set "SOKETI_APP_ID=tu-app-id"
railway variables --set "SOKETI_APP_KEY=tu-app-key"
railway variables --set "SOKETI_APP_SECRET=tu-app-secret"
```

## Verificar Configuración

```bash
railway variables
railway logs
```

## Reiniciar Servicio

Después de configurar las variables:

```bash
railway redeploy
```

