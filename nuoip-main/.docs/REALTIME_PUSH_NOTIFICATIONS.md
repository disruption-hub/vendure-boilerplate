# Sistema de Notificaciones Push en Tiempo Real con Soketi

## Descripción General

El sistema de notificaciones ahora utiliza **dos canales complementarios** para garantizar la entrega de notificaciones:

1. **Soketi (WebSocket)** - Para usuarios activos con la aplicación abierta
2. **Web Push API** - Para usuarios en segundo plano o con la app cerrada

Esta arquitectura dual garantiza que:
- Los usuarios activos reciben notificaciones **instantáneamente** vía WebSocket
- Los usuarios inactivos reciben notificaciones **vía push del navegador**
- No hay duplicación gracias al sistema de deduplicación

## Arquitectura

```
┌─────────────────┐
│  Webhook/Pago   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ sendPushNotification()          │
│ (push-notification-service.ts)  │
└──────────┬──────────────────────┘
           │
           ├──────────────────────────────┐
           │                              │
           ▼                              ▼
┌──────────────────────┐      ┌──────────────────────┐
│  Soketi WebSocket    │      │   Web Push API       │
│  (Real-time)         │      │   (Background)       │
└──────────┬───────────┘      └──────────┬───────────┘
           │                              │
           ▼                              ▼
┌──────────────────────┐      ┌──────────────────────┐
│ useRealtime          │      │ Service Worker       │
│ PaymentNotifications │      │ + postMessage        │
└──────────┬───────────┘      └──────────┬───────────┘
           │                              │
           └──────────┬───────────────────┘
                      ▼
          ┌──────────────────────┐
          │ Payment              │
          │ NotificationBridge   │
          └──────────┬───────────┘
                     ▼
          ┌──────────────────────┐
          │ Dashboard Store      │
          │ (UI Update)          │
          └──────────────────────┘
```

## Componentes Principales

### 1. Contexto de Tiempo Real (`RealtimeContext.tsx`)

Extendido para soportar notificaciones:

```typescript
export interface PaymentNotificationEvent {
  type: 'payment'
  id?: string
  amount: number | string
  currency?: string
  customer?: {
    name?: string
    email?: string
  }
  link?: {
    id?: string
    description?: string
  }
  mode?: string
  timestamp?: string
  tenantId?: string
}

// En SubscriptionOptions:
interface SubscriptionOptions {
  channelName: string
  onPaymentNotification?: EventHandler<PaymentNotificationEvent>
  onGenericEvent?: EventHandler<any>
  // ... otros handlers
}
```

### 2. Hook de Notificaciones (`useRealtimeNotifications.ts`)

```typescript
import { useRealtimePaymentNotifications } from '@/hooks/useRealtimeNotifications'

function MyComponent() {
  useRealtimePaymentNotifications((notification) => {
    console.log('Pago recibido:', notification)
    // Actualizar UI
  })
}
```

### 3. Servicio del Servidor (`soketi.ts`)

```typescript
import { broadcastPaymentNotification } from '@/lib/realtime/soketi'

await broadcastPaymentNotification({
  type: 'payment',
  id: 'payment-123',
  amount: 100.50,
  currency: 'USD',
  customer: {
    name: 'Juan Pérez',
    email: 'juan@example.com'
  },
  tenantId: 'tenant-abc',
  timestamp: new Date().toISOString()
})
```

### 4. Bridge de Notificaciones (`PaymentNotificationBridge.tsx`)

Componente que escucha **ambos canales**:

```typescript
export function PaymentNotificationBridge() {
  // Canal 1: Service Worker (Web Push)
  usePaymentNotificationMessages(handleNotification)
  
  // Canal 2: Soketi (Real-time WebSocket)
  useRealtimePaymentNotifications(handleRealtimeNotification)
  
  // Sistema de deduplicación previene duplicados
}
```

## Flujo de Notificaciones

### Escenario 1: Usuario Activo (App Abierta)

```
1. Webhook de pago llega al servidor
   ↓
2. sendPushNotification() se ejecuta
   ↓
3. broadcastPaymentNotification() envía vía Soketi
   ↓
4. Cliente recibe por WebSocket INSTANTÁNEAMENTE
   ↓
5. useRealtimePaymentNotifications() captura el evento
   ↓
6. PaymentNotificationBridge actualiza el store
   ↓
7. UI se actualiza en tiempo real
```

### Escenario 2: Usuario Inactivo (App en Background)

```
1. Webhook de pago llega al servidor
   ↓
2. sendPushNotification() se ejecuta
   ↓
3. Web Push API envía notificación
   ↓
4. Service Worker recibe y muestra notificación del navegador
   ↓
5. Usuario hace clic en la notificación
   ↓
6. Service Worker postMessage a la página
   ↓
7. usePaymentNotificationMessages() captura el evento
   ↓
8. PaymentNotificationBridge actualiza el store
```

## Configuración de Canales

### Canal de Notificaciones por Tenant

```typescript
// Formato del canal
const channelName = `private-tenant.${tenantId}.notifications`

// Eventos soportados:
- 'payment-notification' - Notificaciones de pago
- Custom events - Eventos personalizados vía broadcastTenantNotification()
```

### Autorización

El canal es **privado** y requiere autorización:
- Solo usuarios del tenant pueden suscribirse
- Autenticación vía `/api/chat/realtime/auth`
- Token de sesión requerido

## Integración en la Aplicación

### Layout Principal

```typescript
// src/app/layout.tsx
<RealtimeProvider>
  <PaymentNotificationBridge />
  {children}
</RealtimeProvider>
```

El `RealtimeProvider` está en el **layout raíz**, por lo que:
- ✅ Funciona en toda la aplicación
- ✅ Conexión única compartida
- ✅ Notificaciones disponibles en cualquier página

### Envío de Notificaciones desde el Servidor

```typescript
// En cualquier webhook o endpoint
import { broadcastPaymentNotification } from '@/lib/realtime/soketi'

// Opción 1: Usar el servicio existente (envía por ambos canales)
await sendPushNotification({
  type: 'payment',
  title: 'Pago Recibido',
  body: 'Cliente pagó $100',
  data: {
    id: 'payment-123',
    amount: 100,
    currency: 'USD',
    customer: { name: 'Juan' }
  },
  tenantId: 'tenant-abc'
})

// Opción 2: Solo Soketi (usuarios activos)
await broadcastPaymentNotification({
  type: 'payment',
  id: 'payment-123',
  amount: 100,
  currency: 'USD',
  tenantId: 'tenant-abc'
})

// Opción 3: Notificación genérica
await broadcastTenantNotification(
  'tenant-abc',
  'custom-event',
  { some: 'data' }
)
```

## Sistema de Deduplicación

El `PaymentNotificationBridge` incluye deduplicación automática:

```typescript
const seenRef = useRef<Set<string>>(new Set())

// Basado en payment ID o link ID
const dedupeKey = notification.id || notification.link?.id

if (seenRef.current.has(dedupeKey)) {
  return // Ya procesado
}

seenRef.current.add(dedupeKey)
```

Esto previene:
- Duplicados entre Soketi y Web Push
- Múltiples procesamiento del mismo pago
- Alertas duplicadas al usuario

## Ventajas del Sistema Dual

### 1. **Latencia Ultra-Baja**
- Soketi: ~50ms de latencia
- Web Push: Varios segundos

### 2. **Confiabilidad**
- Si Soketi falla → Web Push como fallback
- Si usuario cierra tab → Web Push sigue funcionando

### 3. **Experiencia de Usuario**
- App abierta: Notificación in-app inmediata
- App cerrada: Notificación del navegador
- Sin interrupciones en el flujo

### 4. **Eficiencia**
- Una conexión WebSocket para todas las notificaciones
- No necesita polling
- Menor uso de batería

## Monitoreo y Logs

```typescript
// Los logs incluyen información detallada:
logger.info('Payment notification broadcasted successfully', {
  channel,
  tenantId,
  paymentId: payload.id,
})

// En el cliente:
console.log('Payment notification from Soketi:', notification)
console.log('Payment notification from Service Worker:', notification)
```

## Testing

### Test Manual - Soketi

```typescript
// En cualquier API route o script
import { broadcastPaymentNotification } from '@/lib/realtime/soketi'

await broadcastPaymentNotification({
  type: 'payment',
  id: 'test-123',
  amount: 99.99,
  currency: 'USD',
  customer: { name: 'Test User' },
  tenantId: 'your-tenant-id',
  timestamp: new Date().toISOString()
})
```

### Test Manual - Web Push

```bash
# Enviar notificación de prueba
curl -X POST http://localhost:3000/api/notifications/push \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment",
    "title": "Test Payment",
    "body": "Test notification",
    "data": {
      "id": "test-123",
      "amount": 100,
      "currency": "USD"
    },
    "tenantId": "your-tenant-id"
  }'
```

## Troubleshooting

### Notificaciones no llegan vía Soketi

1. Verificar que Soketi esté configurado:
   ```typescript
   // GET /api/chat/realtime/config
   // Debe retornar config válido
   ```

2. Verificar que el usuario esté conectado:
   ```typescript
   const { isConnected, isReady } = useRealtime()
   console.log({ isConnected, isReady })
   ```

3. Verificar suscripción al canal:
   ```typescript
   // Debe aparecer en logs:
   // "useRealtimeNotifications: Subscribing to private-tenant.{id}.notifications"
   ```

### Notificaciones duplicadas

- Verificar que solo hay un `PaymentNotificationBridge` en la app
- Revisar que el sistema de deduplicación esté funcionando
- Confirmar que el `payment.id` está presente en los payloads

### Web Push no funciona

1. Verificar permisos del navegador
2. Confirmar que VAPID keys estén configuradas
3. Verificar que el Service Worker esté registrado
4. Revisar subscriptions en base de datos

## Próximos Pasos (Opcional)

1. **Notificaciones Ricas**: Agregar imágenes, acciones personalizadas
2. **Sonidos**: Reproducir audio en notificaciones in-app
3. **Prioridad**: Sistema de priorización de notificaciones
4. **Historial**: Guardar notificaciones en base de datos
5. **Analytics**: Tracking de tasa de apertura y engagement

## Referencias

- Contexto: `src/contexts/RealtimeContext.tsx`
- Hook: `src/hooks/useRealtimeNotifications.ts`
- Bridge: `src/components/notifications/PaymentNotificationBridge.tsx`
- Servidor: `src/lib/realtime/soketi.ts`
- Servicio: `src/lib/services/notifications/push-notification-service.ts`

