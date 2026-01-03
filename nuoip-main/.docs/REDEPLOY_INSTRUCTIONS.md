# ✅ Redeploy del Backend NestJS en Railway

## Estado Actual

✅ **Cambios pusheados a GitHub**: Los cambios con `@swc/cli` y `@swc/core` en `dependencies` ya están en el repositorio.

## Opciones para Redeploy

### Opción 1: Dashboard de Railway (Recomendado)

1. Ve a: https://railway.com/project/a3f22a0e-add0-40bc-8bb9-ed353e7fee0d
2. Selecciona el servicio del backend NestJS
3. Ve a la pestaña **Deployments**
4. Haz clic en **Redeploy** en el último deployment
5. O espera a que Railway detecte automáticamente el push y despliegue

### Opción 2: Railway CLI (Requiere Service ID)

Si conoces el Service ID:

```bash
cd backend
railway redeploy --service <SERVICE_ID> --yes
```

### Opción 3: Trigger Manual desde CLI

```bash
cd backend
railway up --detach
```

## Verificación

Después del redeploy, verifica que el build sea exitoso:

1. Revisa los logs en Railway Dashboard
2. Verifica que el servicio esté corriendo
3. Prueba el endpoint: `https://ipnuo-backend-production.up.railway.app`

## Cambios Aplicados

- ✅ `@swc/cli` y `@swc/core` movidos a `dependencies`
- ✅ `railway.json` creado con configuración de inicio
- ✅ `nixpacks.toml` configurado para instalar dependencias correctamente

El build debería funcionar ahora porque las dependencias SWC se instalarán con `npm ci`.

