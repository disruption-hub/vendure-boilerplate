export interface SendMessageCommand {
  sessionId: string
  content: string
  attachments?: Array<{ id: string; url: string; kind: string }>
  metadata?: Record<string, unknown>
}

export interface UpdateMemoryCommand {
  sessionId: string
  patch: Record<string, unknown>
}

export interface ChatMemorySnapshot {
  sessionId: string
  values: Record<string, unknown>
  updatedAt: Date
}

export interface ChatMessageSnapshot {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: Date
}

export interface ChatFacade {
  sendMessage(command: SendMessageCommand): Promise<ChatMessageSnapshot>
  getMemory(sessionId: string): Promise<ChatMemorySnapshot | null>
  updateMemory(command: UpdateMemoryCommand): Promise<ChatMemorySnapshot>
}
