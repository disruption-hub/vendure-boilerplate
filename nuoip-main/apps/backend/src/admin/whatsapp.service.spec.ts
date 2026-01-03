import { AdminWhatsAppService } from './whatsapp.service'
import { PrismaService } from '../prisma/prisma.service'
import { AdminSystemSettingsService } from './system-settings.service'

type MockPrismaService = {
  chatbotContact: {
    findUnique: jest.Mock
  }
  whatsAppContact: {
    findUnique: jest.Mock
    findFirst: jest.Mock
  }
  whatsAppSession: {
    findUnique: jest.Mock
    findMany: jest.Mock
  }
  whatsAppMessage: {
    findMany: jest.Mock
  }
}

describe('AdminWhatsAppService - getMessages', () => {
  const prisma: MockPrismaService = {
    chatbotContact: {
      findUnique: jest.fn(),
    },
    whatsAppContact: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    whatsAppSession: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    whatsAppMessage: {
      findMany: jest.fn(),
    },
  }

  const mockSystemSettingsService = {
    getSettings: jest.fn(),
  } as unknown as AdminSystemSettingsService

  let service: AdminWhatsAppService

  beforeEach(() => {
    jest.resetAllMocks()
    service = new AdminWhatsAppService(
      prisma as unknown as PrismaService,
      mockSystemSettingsService
    )
  })

  describe('getMessages - Query by ChatbotContact ID', () => {
    it('should resolve ChatbotContact to JID and fetch messages', async () => {
      const chatbotContactId = 'chatbot-contact-1'
      const tenantId = 'tenant-1'
      const jid = '51981281297@s.whatsapp.net'
      const sessionId = 'session-1'

      const mockMessages = [
        {
          id: 'msg-1',
          sessionId,
          messageId: 'msg-id-1',
          remoteJid: jid,
          content: 'Hello',
          fromMe: false,
          timestamp: new Date('2024-01-01'),
          users: null,
        },
      ]

      // Mock ChatbotContact lookup
      prisma.chatbotContact.findUnique.mockResolvedValue({
        id: chatbotContactId,
        tenantId,
      })

      // Mock WhatsAppContact lookup
      prisma.whatsAppContact.findFirst.mockResolvedValue({
        jid,
        sessionId,
      })

      // Mock session lookup for tenant
      prisma.whatsAppSession.findMany.mockResolvedValue([
        { sessionId },
        { sessionId: 'session-2' },
      ])

      // Mock message query
      prisma.whatsAppMessage.findMany.mockResolvedValue(mockMessages)

      const result = await service.getMessages(undefined, undefined, 100, chatbotContactId)

      expect(result.messages).toHaveLength(1)
      expect(result.messages[0].content).toBe('Hello')
      expect(prisma.chatbotContact.findUnique).toHaveBeenCalledWith({
        where: { id: chatbotContactId },
        select: { id: true, tenantId: true },
      })
      expect(prisma.whatsAppContact.findFirst).toHaveBeenCalledWith({
        where: { chatbotContactId },
        select: { jid: true, sessionId: true },
      })
      expect(prisma.whatsAppMessage.findMany).toHaveBeenCalled()
    })

    it('should handle ChatbotContact without linked WhatsAppContact', async () => {
      const chatbotContactId = 'chatbot-contact-2'
      const tenantId = 'tenant-2'

      prisma.chatbotContact.findUnique.mockResolvedValue({
        id: chatbotContactId,
        tenantId,
      })

      prisma.whatsAppContact.findFirst.mockResolvedValue(null)
      prisma.whatsAppSession.findMany.mockResolvedValue([])
      prisma.whatsAppMessage.findMany.mockResolvedValue([])

      const result = await service.getMessages(undefined, undefined, 100, chatbotContactId)

      expect(result.messages).toHaveLength(0)
    })
  })

  describe('getMessages - Query by WhatsAppContact ID', () => {
    it('should resolve WhatsAppContact ID to JID and fetch messages', async () => {
      const whatsappContactId = 'whatsapp-contact-1'
      const tenantId = 'tenant-1'
      const jid = '272593504436465@lid'
      const sessionId = 'session-1'

      const mockMessages = [
        {
          id: 'msg-2',
          sessionId,
          messageId: 'msg-id-2',
          remoteJid: jid,
          content: 'Test message',
          fromMe: true,
          timestamp: new Date('2024-01-02'),
          users: { id: 'user-1', name: 'User', email: 'user@test.com' },
        },
      ]

      prisma.chatbotContact.findUnique.mockResolvedValue(null)
      prisma.whatsAppContact.findUnique.mockResolvedValue({
        jid,
        sessionId,
      })
      prisma.whatsAppSession.findUnique.mockResolvedValue({
        tenantId,
      })
      prisma.whatsAppSession.findMany.mockResolvedValue([{ sessionId }])
      prisma.whatsAppMessage.findMany.mockResolvedValue(mockMessages)

      const result = await service.getMessages(undefined, undefined, 100, whatsappContactId)

      expect(result.messages).toHaveLength(1)
      expect(result.messages[0].content).toBe('Test message')
      expect(prisma.whatsAppContact.findUnique).toHaveBeenCalledWith({
        where: { id: whatsappContactId },
        select: { jid: true, sessionId: true },
      })
    })
  })

  describe('getMessages - Query by direct JID', () => {
    it('should handle @lid format and generate variations', async () => {
      const jid = '272593504436465@lid'
      const tenantId = 'tenant-1'
      const sessionId = 'session-1'

      const mockMessages = [
        {
          id: 'msg-3',
          sessionId,
          messageId: 'msg-id-3',
          remoteJid: jid,
          content: 'JID message',
          fromMe: false,
          timestamp: new Date('2024-01-03'),
          users: null,
        },
      ]

      prisma.chatbotContact.findUnique.mockResolvedValue(null)
      prisma.whatsAppContact.findUnique.mockResolvedValue(null)
      prisma.whatsAppContact.findFirst.mockResolvedValue({
        jid,
        sessionId,
      })
      prisma.whatsAppContact.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
        jid,
        sessionId,
      })
      prisma.whatsAppSession.findUnique.mockResolvedValue({ tenantId })
      prisma.whatsAppSession.findMany.mockResolvedValue([{ sessionId }])
      prisma.whatsAppMessage.findMany.mockResolvedValue(mockMessages)

      const result = await service.getMessages(sessionId, undefined, 100, jid)

      expect(result.messages).toHaveLength(1)
      // Verify JID variations were used in query
      const findManyCall = prisma.whatsAppMessage.findMany.mock.calls[0][0]
      expect(findManyCall.where.remoteJid.in).toContain(jid)
      expect(findManyCall.where.remoteJid.in).toContain('272593504436465@s.whatsapp.net')
    })

    it('should handle @s.whatsapp.net format and generate variations', async () => {
      const jid = '51981281297@s.whatsapp.net'
      const tenantId = 'tenant-1'
      const sessionId = 'session-1'

      prisma.chatbotContact.findUnique.mockResolvedValue(null)
      prisma.whatsAppContact.findUnique.mockResolvedValue(null)
      prisma.whatsAppContact.findFirst.mockResolvedValue({
        jid,
        sessionId,
      })
      prisma.whatsAppSession.findUnique.mockResolvedValue({ tenantId })
      prisma.whatsAppSession.findMany.mockResolvedValue([{ sessionId }])
      prisma.whatsAppMessage.findMany.mockResolvedValue([])

      await service.getMessages(sessionId, undefined, 100, jid)

      const findManyCall = prisma.whatsAppMessage.findMany.mock.calls[0][0]
      expect(findManyCall.where.remoteJid.in).toContain(jid)
      expect(findManyCall.where.remoteJid.in).toContain('51981281297@lid')
    })

    it('should handle @g.us (group) format without variations', async () => {
      const jid = '51956287630-1558542962@g.us'
      const tenantId = 'tenant-1'
      const sessionId = 'session-1'

      prisma.chatbotContact.findUnique.mockResolvedValue(null)
      prisma.whatsAppContact.findUnique.mockResolvedValue(null)
      prisma.whatsAppContact.findFirst.mockResolvedValue({
        jid,
        sessionId,
      })
      prisma.whatsAppSession.findUnique.mockResolvedValue({ tenantId })
      prisma.whatsAppSession.findMany.mockResolvedValue([{ sessionId }])
      prisma.whatsAppMessage.findMany.mockResolvedValue([])

      await service.getMessages(sessionId, undefined, 100, jid)

      const findManyCall = prisma.whatsAppMessage.findMany.mock.calls[0][0]
      expect(findManyCall.where.remoteJid.in).toEqual([jid]) // Groups don't have variations
    })
  })

  describe('getMessages - Query by phone number', () => {
    it('should resolve phone number to JID and fetch messages', async () => {
      const phoneNumber = '51981281297'
      const jid = `${phoneNumber}@s.whatsapp.net`
      const tenantId = 'tenant-1'
      const sessionId = 'session-1'

      const mockMessages = [
        {
          id: 'msg-4',
          sessionId,
          messageId: 'msg-id-4',
          remoteJid: jid,
          content: 'Phone message',
          fromMe: false,
          timestamp: new Date('2024-01-04'),
          users: null,
        },
      ]

      prisma.chatbotContact.findUnique.mockResolvedValue(null)
      prisma.whatsAppContact.findUnique.mockResolvedValue(null)
      prisma.whatsAppContact.findFirst
        .mockResolvedValueOnce(null) // First call for phone lookup
        .mockResolvedValueOnce({
          jid,
          sessionId,
        }) // Second call for tenant lookup
      prisma.whatsAppSession.findUnique.mockResolvedValue({ tenantId })
      prisma.whatsAppSession.findMany.mockResolvedValue([{ sessionId }])
      prisma.whatsAppMessage.findMany.mockResolvedValue(mockMessages)

      const result = await service.getMessages(sessionId, undefined, 100, phoneNumber)

      expect(result.messages).toHaveLength(1)
      expect(prisma.whatsAppContact.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ phoneNumber }, { jid: { contains: phoneNumber } }],
        },
        select: { jid: true, sessionId: true },
      })
    })
  })

  describe('getMessages - Query by sessionId only', () => {
    it('should fetch messages for a specific session', async () => {
      const sessionId = 'session-1'
      const tenantId = 'tenant-1'

      const mockMessages = [
        {
          id: 'msg-5',
          sessionId,
          messageId: 'msg-id-5',
          remoteJid: '51981281297@s.whatsapp.net',
          content: 'Session message',
          fromMe: true,
          timestamp: new Date('2024-01-05'),
          users: { id: 'user-1', name: 'User', email: 'user@test.com' },
        },
      ]

      prisma.whatsAppSession.findUnique.mockResolvedValue({ tenantId })
      prisma.whatsAppMessage.findMany.mockResolvedValue(mockMessages)

      const result = await service.getMessages(sessionId, undefined, 100, undefined)

      expect(result.messages).toHaveLength(1)
      expect(prisma.whatsAppMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sessionId: { in: [sessionId] },
          }),
        })
      )
    })
  })

  describe('getMessages - Fallback mechanism', () => {
    it('should try fallback query when primary query returns 0 results', async () => {
      const chatbotContactId = 'chatbot-contact-1'
      const tenantId = 'tenant-1'
      const jid = '51981281297@s.whatsapp.net'
      const sessionId = 'session-1'

      const mockFallbackMessages = [
        {
          id: 'msg-6',
          sessionId: 'session-2',
          messageId: 'msg-id-6',
          remoteJid: jid,
          content: 'Fallback message',
          fromMe: false,
          timestamp: new Date('2024-01-06'),
          users: null,
        },
      ]

      prisma.chatbotContact.findUnique.mockResolvedValue({
        id: chatbotContactId,
        tenantId,
      })
      prisma.whatsAppContact.findFirst.mockResolvedValue({
        jid,
        sessionId,
      })
      prisma.whatsAppSession.findMany
        .mockResolvedValueOnce([{ sessionId }]) // First call for session resolution
        .mockResolvedValueOnce([{ sessionId }, { sessionId: 'session-2' }]) // Second call for fallback
      prisma.whatsAppMessage.findMany
        .mockResolvedValueOnce([]) // Primary query returns 0
        .mockResolvedValueOnce(mockFallbackMessages) // Fallback query returns messages

      const result = await service.getMessages(undefined, undefined, 100, chatbotContactId)

      expect(result.messages).toHaveLength(1)
      expect(result.messages[0].content).toBe('Fallback message')
      expect(prisma.whatsAppMessage.findMany).toHaveBeenCalledTimes(2)
    })
  })

  describe('getMessages - Status filtering', () => {
    it('should filter messages by status', async () => {
      const sessionId = 'session-1'
      const tenantId = 'tenant-1'
      const status = 'SENT'

      prisma.whatsAppSession.findUnique.mockResolvedValue({ tenantId })
      prisma.whatsAppMessage.findMany.mockResolvedValue([])

      await service.getMessages(sessionId, status, 100, undefined)

      const findManyCall = prisma.whatsAppMessage.findMany.mock.calls[0][0]
      expect(findManyCall.where.status).toBe(status)
    })

    it('should not filter by status when status is "all"', async () => {
      const sessionId = 'session-1'
      const tenantId = 'tenant-1'
      const status = 'all'

      prisma.whatsAppSession.findUnique.mockResolvedValue({ tenantId })
      prisma.whatsAppMessage.findMany.mockResolvedValue([])

      await service.getMessages(sessionId, status, 100, undefined)

      const findManyCall = prisma.whatsAppMessage.findMany.mock.calls[0][0]
      expect(findManyCall.where.status).toBeUndefined()
    })
  })

  describe('getMessages - Error handling', () => {
    it('should return empty array on error', async () => {
      const chatbotContactId = 'chatbot-contact-error'

      prisma.chatbotContact.findUnique.mockRejectedValue(new Error('Database error'))

      const result = await service.getMessages(undefined, undefined, 100, chatbotContactId)

      expect(result.messages).toEqual([])
    })

    it('should return empty array when no contactId or sessionId provided', async () => {
      const result = await service.getMessages(undefined, undefined, 100, undefined)

      expect(result.messages).toEqual([])
      expect(prisma.whatsAppMessage.findMany).not.toHaveBeenCalled()
    })
  })

  describe('getMessages - Multi-tenant isolation', () => {
    it('should only query messages from tenant sessions', async () => {
      const chatbotContactId = 'chatbot-contact-1'
      const tenantId = 'tenant-1'
      const jid = '51981281297@s.whatsapp.net'
      const sessionId1 = 'session-1'
      const sessionId2 = 'session-2'

      prisma.chatbotContact.findUnique.mockResolvedValue({
        id: chatbotContactId,
        tenantId,
      })
      prisma.whatsAppContact.findFirst.mockResolvedValue({
        jid,
        sessionId: sessionId1,
      })
      prisma.whatsAppSession.findMany.mockResolvedValue([
        { sessionId: sessionId1 },
        { sessionId: sessionId2 },
      ])
      prisma.whatsAppMessage.findMany.mockResolvedValue([])

      await service.getMessages(undefined, undefined, 100, chatbotContactId)

      const findManyCall = prisma.whatsAppMessage.findMany.mock.calls[0][0]
      expect(findManyCall.where.sessionId.in).toContain(sessionId1)
      expect(findManyCall.where.sessionId.in).toContain(sessionId2)
      expect(findManyCall.where.sessionId.in).toHaveLength(2)
    })
  })

  describe('getMessages - Message ordering', () => {
    it('should return messages in chronological order (oldest first)', async () => {
      const sessionId = 'session-1'
      const tenantId = 'tenant-1'

      const mockMessages = [
        {
          id: 'msg-new',
          sessionId,
          messageId: 'msg-id-new',
          remoteJid: '51981281297@s.whatsapp.net',
          content: 'New message',
          fromMe: false,
          timestamp: new Date('2024-01-10'),
          users: null,
        },
        {
          id: 'msg-old',
          sessionId,
          messageId: 'msg-id-old',
          remoteJid: '51981281297@s.whatsapp.net',
          content: 'Old message',
          fromMe: false,
          timestamp: new Date('2024-01-01'),
          users: null,
        },
      ]

      prisma.whatsAppSession.findUnique.mockResolvedValue({ tenantId })
      prisma.whatsAppMessage.findMany.mockResolvedValue(mockMessages)

      const result = await service.getMessages(sessionId, undefined, 100, undefined)

      expect(result.messages).toHaveLength(2)
      expect(result.messages[0].content).toBe('Old message')
      expect(result.messages[1].content).toBe('New message')
    })
  })

  describe('getMessages - Limit handling', () => {
    it('should respect the limit parameter', async () => {
      const sessionId = 'session-1'
      const tenantId = 'tenant-1'
      const limit = 50

      prisma.whatsAppSession.findUnique.mockResolvedValue({ tenantId })
      prisma.whatsAppMessage.findMany.mockResolvedValue([])

      await service.getMessages(sessionId, undefined, limit, undefined)

      const findManyCall = prisma.whatsAppMessage.findMany.mock.calls[0][0]
      expect(findManyCall.take).toBe(limit)
    })

    it('should use default limit of 100 when not provided', async () => {
      const sessionId = 'session-1'
      const tenantId = 'tenant-1'

      prisma.whatsAppSession.findUnique.mockResolvedValue({ tenantId })
      prisma.whatsAppMessage.findMany.mockResolvedValue([])

      await service.getMessages(sessionId, undefined, undefined, undefined)

      const findManyCall = prisma.whatsAppMessage.findMany.mock.calls[0][0]
      expect(findManyCall.take).toBe(100)
    })
  })
})

