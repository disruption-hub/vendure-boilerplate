# Configuración: Localhost + Railway Baileys Worker

## Arquitectura Actual

- **Localhost (UI/UX)**: Ejecutando la aplicación Next.js localmente
- **Railway (Baileys Worker)**: Ejecutando el worker de Baileys en Railway
- **Base de Datos Compartida**: Ambos conectados a la misma PostgreSQL en Railway

## Flujo de Trabajo

1. **Emparejar Sesión desde Localhost:**
   - Abres la UI en `http://localhost:3000`
   - Creas una nueva sesión de WhatsApp
   - Escaneas el código QR
   - La sesión se guarda en la base de datos compartida

2. **Worker de Railway Detecta la Sesión:**
   - El worker en Railway consulta la base de datos cada 30 segundos
   - Detecta la sesión activa
   - Mantiene la conexión Baileys activa
   - Maneja mensajes entrantes y salientes

3. **Actualizaciones en Tiempo Real:**
   - El worker emite eventos a Soketi
   - La UI en localhost recibe actualizaciones vía WebSocket
   - Los cambios se reflejan en tiempo real

## Variables Configuradas en Railway

✅ **DATABASE_URL**: Configurada (base de datos compartida)
✅ **SOKETI_HOST**: `soketi-production-2f36.up.railway.app`
✅ **SOKETI_PORT**: `443`
✅ **SOKETI_USE_TLS**: `true`
✅ **SOKETI_APP_ID**: `HDvH9W5N`
✅ **SOKETI_APP_KEY**: `2tnjwoq2kffg0i0zv50e2j16wj7y2afa`
✅ **SOKETI_APP_SECRET**: `iirjyq90av7dylqgveff09ekv7w5v3jj`

## Verificación

Para verificar que todo funciona:

1. **Ver logs del worker de Railway:**
   ```bash
   railway logs
   ```
   
   Deberías ver:
   ```
   [baileys-worker] [INFO] Worker loop: checking sessions {"activeSessionCount":X,"activeManagerCount":Y}
   ```

2. **Emparejar una sesión desde localhost:**
   - Ve a `http://localhost:3000`
   - Crea una nueva sesión de WhatsApp
   - Escanea el QR
   - Verifica en los logs de Railway que detecta la sesión

3. **Verificar conexión:**
   - El worker debería mostrar logs de conexión Baileys
   - La UI debería mostrar la sesión como "Conectada"
   - Los mensajes deberían funcionar

## Notas Importantes

- El worker de Railway maneja **todas** las sesiones activas
- Las sesiones emparejadas desde localhost son detectadas automáticamente
- No necesitas ejecutar Baileys localmente - Railway lo maneja todo
- La UI en localhost solo muestra el estado y permite crear sesiones

