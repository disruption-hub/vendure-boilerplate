# Configuración de Soketi en Railway

El worker de Baileys necesita las credenciales de Soketi para transmitir eventos (incluyendo códigos QR) al frontend.

## Opción 1: Variables de Entorno (Recomendado)

Configura las siguientes variables de entorno en Railway para el servicio del worker de Baileys:

### Variables Requeridas:
- `SOKETI_APP_ID` - ID de la aplicación Soketi
- `SOKETI_APP_KEY` - Clave pública de Soketi
- `SOKETI_APP_SECRET` - Secreto de Soketi
- `SOKETI_HOST` o `SOKETI_PUBLIC_HOST` - Host de Soketi (ej: `soketi.example.com`)

### Variables Opcionales:
- `SOKETI_PORT` o `SOKETI_PUBLIC_PORT` - Puerto de Soketi (por defecto: `443`)
- `SOKETI_USE_TLS` - Usar TLS (por defecto: `true`)

### Cómo configurar en Railway:

1. Ve al dashboard de Railway
2. Selecciona el servicio del worker de Baileys
3. Ve a la pestaña "Variables"
4. Agrega las variables de entorno necesarias
5. Reinicia el servicio

## Opción 2: Configuración en Base de Datos

Alternativamente, puedes configurar Soketi a través del admin dashboard:

1. Ve al admin dashboard
2. Navega a la sección de configuración del sistema
3. Configura los ajustes de "Realtime" (Soketi)
4. Guarda la configuración

El worker intentará primero usar las variables de entorno, y si no las encuentra, usará la configuración de la base de datos.

## Verificación

Después de configurar, verifica los logs del worker en Railway. Deberías ver:

```
[whatsapp-soketi-emitter] Soketi client resolved from environment variables
```

En lugar de:

```
[whatsapp-soketi-emitter] Soketi client could not be resolved - no configuration found
```

## Notas

- Si usas un servicio de Soketi externo (como Soketi Cloud), usa las credenciales proporcionadas por el servicio
- Si ejecutas Soketi en Railway, usa el host interno del servicio de Soketi para `SOKETI_HOST`
- El puerto por defecto es `443` (HTTPS/WSS), pero puede variar según tu configuración

