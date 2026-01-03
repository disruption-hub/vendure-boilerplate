import type { ChatMemorySnapshot, ChatMessageSnapshot, ChatFacade, SendMessageCommand, UpdateMemoryCommand } from './contracts'
import { domainEvents } from '../events'
import type { DomainEventMap } from '../events'
import type { EventBus } from '@/core/messaging/event-bus'

export interface ChatStoreAdapter {
  send(command: SendMessageCommand): Promise<ChatMessageSnapshot>
  readMemory(sessionId: string): Promise<ChatMemorySnapshot | null>
  writeMemory(command: UpdateMemoryCommand): Promise<ChatMemorySnapshot>
}

export interface ChatFacadeDependencies {
  store: ChatStoreAdapter
  events?: EventBus<DomainEventMap>
}

export const createChatFacade = ({ store, events = domainEvents }: ChatFacadeDependencies): ChatFacade => {
  return {
    async sendMessage(command) {
      const message = await store.send(command)
      events.emit('chat:message.sent', {
        sessionId: command.sessionId,
        messageId: message.id,
        contentPreview: command.content.slice(0, 160),
      })
      return message
    },

    async getMemory(sessionId) {
      return store.readMemory(sessionId)
    },

    async updateMemory(command) {
      const next = await store.writeMemory(command)
      events.emit('chat:memory.updated', {
        sessionId: command.sessionId,
        memory: next.values,
      })
      return next
    },
  }
}
