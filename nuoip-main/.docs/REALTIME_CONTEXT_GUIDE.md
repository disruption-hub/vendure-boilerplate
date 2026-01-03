# Guía de Uso del Contexto de Tiempo Real (Soketi/Pusher)

## Descripción General

El sistema de mensajería en tiempo real ahora utiliza un **contexto compartido** (`RealtimeContext`) que permite que múltiples componentes se suscriban a actualizaciones de Soketi sin duplicar conexiones. Esto es ideal para que tanto el chat principal como los sidebars reciban actualizaciones simultáneamente.

## Arquitectura

```
RealtimeProvider (Contexto)
    ↓
    ├── FullScreenChatbot (usa el contexto)
    ├── RealtimeChatSidebar (usa el contexto)
    └── Cualquier otro componente (puede usar el contexto)
```

## Componentes Principales

### 1. `RealtimeContext` (`src/contexts/RealtimeContext.tsx`)

El contexto principal que maneja la conexión de Pusher/Soketi.

**Características:**
- Conexión única y compartida a Soketi
- Gestión automática de reconexión
- Suscripción/desuscripción de canales
- Eventos de presencia (usuarios en línea)
- Indicadores de tipeo (typing)

### 2. Hooks Personalizados

#### `useRealtime()`
Hook básico para acceder al contexto.

```typescript
import { useRealtime } from '@/contexts/RealtimeContext'

function MyComponent() {
  const { isConnected, isReady, subscribe, unsubscribe } = useRealtime()
  
  // Usar las funciones del contexto
}
```

#### `useRealtimeMessages()` 
Hook para suscribirse a un thread específico.

```typescript
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'

function ChatThread({ tenantId, userId, peerId }) {
  const { isSubscribed, isConnected } = useRealtimeMessages({
    tenantId,
    userId,
    peerId,
    onNewMessage: (message) => {
      console.log('Nuevo mensaje:', message)
    },
    onMessageRead: (event) => {
      console.log('Mensaje leído:', event)
    },
    onTyping: (userId, isTyping) => {
      console.log(`${userId} está escribiendo:`, isTyping)
    },
  })
  
  return <div>Estado: {isConnected ? 'Conectado' : 'Desconectado'}</div>
}
```

#### `useRealtimeConversations()`
Hook para suscribirse a múltiples conversaciones (ideal para sidebars).

```typescript
import { useRealtimeConversations } from '@/hooks/useRealtimeMessages'

function ConversationList({ tenantId, userId, peerIds }) {
  const { subscribedChannels, isConnected } = useRealtimeConversations({
    tenantId,
    userId,
    peerIds: ['user1', 'user2', 'user3'],
    onNewMessage: (message) => {
      // Actualizar UI con nuevo mensaje
      updateConversationPreview(message)
    },
    onMessageRead: (event) => {
      // Limpiar contadores de no leídos
      clearUnreadCount(event.threadKey)
    },
  })
  
  return <div>{subscribedChannels.length} canales activos</div>
}
```

#### `useRealtimePresence()`
Hook para detectar usuarios en línea.

```typescript
import { useRealtimePresence } from '@/hooks/useRealtimeMessages'

function UserList({ tenantId, userIds }) {
  const { onlineUsers, isOnline } = useRealtimePresence(tenantId, userIds)
  
  return (
    <div>
      {userIds.map(userId => (
        <div key={userId}>
          {userId} - {isOnline(userId) ? '🟢 En línea' : '⚫ Desconectado'}
        </div>
      ))}
    </div>
  )
}
```

## Uso en la Aplicación

### 1. Envolver con el Provider

En tu página o layout principal, envuelve los componentes con `RealtimeProvider`:

```typescript
// src/app/(chat)/chat/full/page.tsx
import { RealtimeProvider } from '@/contexts/RealtimeContext'
import FullScreenChatbot from '@/components/chatbot/fullscreen/FullScreenChatbot'

export default function ChatPage() {
  return (
    <RealtimeProvider>
      <FullScreenChatbot />
    </RealtimeProvider>
  )
}
```

### 2. Usar en Componentes Hijos

Cualquier componente dentro del provider puede usar los hooks:

```typescript
// Sidebar de conversaciones
function ChatSidebar() {
  const { isConnected } = useRealtime()
  
  const { subscribedChannels } = useRealtimeConversations({
    tenantId: 'tenant-123',
    userId: 'user-456',
    peerIds: ['user-1', 'user-2'],
    onNewMessage: (msg) => {
      // Actualizar preview
      updateLastMessage(msg)
    },
  })
  
  return <div>Conectado a {subscribedChannels.length} chats</div>
}
```

## Componente de Ejemplo: RealtimeChatSidebar

Hemos creado un componente de sidebar totalmente funcional que demuestra el uso completo:

```typescript
import { RealtimeChatSidebar } from '@/components/chatbot/RealtimeChatSidebar'

function MyApp() {
  const contacts = [
    { id: 'user:123', name: 'Juan Pérez', email: 'juan@example.com' },
    { id: 'user:456', name: 'María García', email: 'maria@example.com' },
  ]
  
  return (
    <RealtimeProvider>
      <div className="flex h-screen">
        <RealtimeChatSidebar 
          contacts={contacts}
          onConversationSelect={(id) => console.log('Selected:', id)}
          selectedContactId="user:123"
        />
        <FullScreenChatbot />
      </div>
    </RealtimeProvider>
  )
}
```

## Eventos Disponibles

### Mensajes
- `tenant-user-message` - Nuevo mensaje recibido
- `tenant-user-message-read` - Mensaje marcado como leído
- `tenant-user-message-delivered` - Mensaje entregado

### Presencia
- `pusher:subscription_succeeded` - Suscripción exitosa
- `pusher:member_added` - Usuario se conectó
- `pusher:member_removed` - Usuario se desconectó

### Tipeo
- `client-typing` - Usuario está escribiendo

## Ventajas de este Enfoque

1. **Conexión Única**: Solo una conexión WebSocket para toda la aplicación
2. **Estado Compartido**: Todos los componentes ven los mismos datos en tiempo real
3. **Fácil de Usar**: Hooks simples y declarativos
4. **Eficiente**: No duplica suscripciones ni conexiones
5. **Mantenible**: Lógica centralizada en un solo lugar
6. **Escalable**: Fácil agregar nuevos componentes que necesiten tiempo real

## Ejemplo Completo de Integración

```typescript
// src/app/(chat)/chat/full/page.tsx
import { RealtimeProvider } from '@/contexts/RealtimeContext'
import { RealtimeChatSidebar } from '@/components/chatbot/RealtimeChatSidebar'
import FullScreenChatbot from '@/components/chatbot/fullscreen/FullScreenChatbot'

export default function FullChatPage() {
  return (
    <RealtimeProvider>
      <div className="flex h-screen">
        {/* Sidebar recibe actualizaciones en tiempo real */}
        <RealtimeChatSidebar 
          contacts={contacts}
          onConversationSelect={handleSelect}
        />
        
        {/* Chat principal también recibe actualizaciones */}
        <FullScreenChatbot />
      </div>
    </RealtimeProvider>
  )
}
```

## Solución de Problemas

### El contexto no está conectado
- Verifica que `RealtimeProvider` esté envolviendo tus componentes
- Asegúrate de que el usuario tenga `sessionToken`, `userId` y `tenantId` en el store

### No se reciben mensajes
- Verifica que el canal esté correctamente formateado: `presence-tenant.{tenantId}.thread.{threadKey}`
- Revisa la consola para errores de autorización
- Confirma que la configuración de Soketi esté activa en `/api/chat/realtime/config`

### Múltiples conexiones
- Asegúrate de tener solo un `RealtimeProvider` en tu árbol de componentes
- Verifica que no estés inicializando Pusher manualmente en otros lugares

## API Reference

Ver los archivos:
- `src/contexts/RealtimeContext.tsx` - Contexto principal
- `src/hooks/useRealtimeMessages.ts` - Hooks personalizados
- `src/components/chatbot/RealtimeChatSidebar.tsx` - Componente de ejemplo

