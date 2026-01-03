# Actualizar Comando de Inicio - Baileys Worker

## ⚠️ Limitación del Railway CLI

**Railway CLI no permite actualizar el comando de inicio (`startCommand`) directamente.** Esta configuración solo se puede cambiar desde el Railway Dashboard.

## Solución: Usar Railway Dashboard

### Pasos Rápidos

1. **Abre Railway Dashboard:**
   - URL: https://railway.app/project/99370a3c-0bda-423f-b4ff-7697000cfcb1
   - O ve a tu proyecto en Railway

2. **Selecciona el servicio:**
   - Haz clic en **"Baileys Worker"** (antes `nuoip-worker`)

3. **Actualiza el comando:**
   - Ve a **Settings** → **Deploy**
   - Busca **"Start Command"**
   - **Cambia de:**
     ```
     cd apps/backend && npm run start:prod
     ```
   - **A:**
     ```
     cd apps/backend && npm run worker:baileys
     ```

4. **Guarda y redeplega:**
   - Haz clic en **"Save"**
   - Railway debería redeplegar automáticamente
   - O ve a **Deployments** → **"Redeploy"**

## Verificación

Después de actualizar, verifica los logs:

```bash
railway link --service "Baileys Worker"
railway logs
```

### Logs Correctos ✅

Deberías ver:
```
✅ Starting Baileys worker service (standalone)
✅ Prisma Client initialized and connected to database
✅ Baileys worker service is running
✅ Worker loop: checking sessions
```

### Logs Incorrectos ❌

NO deberías ver:
```
❌ [Nest] Starting Nest application...
❌ [InstanceLoader] ConfigHostModule dependencies initialized
❌ Error: DATABASE_URL is required but not found
```

## Script de Ayuda

Puedes ejecutar el script de ayuda:

```bash
./update-baileys-worker-start-command.sh
```

Este script muestra las instrucciones pero no puede hacer el cambio automáticamente (limitación de Railway CLI).

## Alternativa: Railway API (Futuro)

Railway tiene una API REST que podría permitir esto, pero actualmente:
- Requiere autenticación con tokens
- No está documentada públicamente para cambios de configuración
- El Dashboard es el método recomendado

## Resumen

| Método | Disponible | Recomendado |
|--------|------------|-------------|
| Railway Dashboard | ✅ Sí | ✅ **Sí** |
| Railway CLI | ❌ No | ❌ No |
| Railway API | ⚠️ No documentado | ❌ No |

**Conclusión:** Debes usar el Railway Dashboard para actualizar el comando de inicio.

