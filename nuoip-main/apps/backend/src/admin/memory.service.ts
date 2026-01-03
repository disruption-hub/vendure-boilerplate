import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export interface MemoryDetailsResponse {
  overview: {
    totalSessions: number
    totalMessages: number
    totalEntities: number
    totalSummaries: number
    totalKnowledgeNodes: number
    totalKnowledgeRelationships: number
  }
  systemHealth: {
    databaseConnected: boolean
    lastUpdated: string
    memoryStats: {
      unique_sessions: number
      total_messages: number
      oldest_message: string | null
      newest_message: string | null
    }
  }
  recentActivity: {
    sessions: Array<{
      sessionId: string
      createdAt: string
      message_count: number
    }>
    messages: Array<{
      role: string
      content: string
      timestamp: string
    }>
  }
}

@Injectable()
export class AdminMemoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getMemoryDetails(): Promise<MemoryDetailsResponse> {
    try {
      // Get overview counts
      const [
        totalSessions,
        totalMessages,
        totalEntities,
        totalSummaries,
        totalKnowledgeNodes,
        totalKnowledgeRelationships,
      ] = await this.prisma.$transaction([
        this.prisma.memorySession.count(),
        this.prisma.bufferMessage.count(),
        this.prisma.memoryEntity.count(),
        this.prisma.conversationSummary.count(),
        this.prisma.knowledgeNode.count(),
        this.prisma.knowledgeRelationship.count(),
      ])

      // Get memory stats from buffer messages
      const uniqueSessions = await this.prisma.bufferMessage.groupBy({
        by: ['sessionId'],
        _count: {
          sessionId: true,
        },
      })

      const oldestMessage = await this.prisma.bufferMessage.findFirst({
        orderBy: {
          timestamp: 'asc',
        },
        select: {
          timestamp: true,
        },
      })

      const newestMessage = await this.prisma.bufferMessage.findFirst({
        orderBy: {
          timestamp: 'desc',
        },
        select: {
          timestamp: true,
        },
      })

      // Get recent sessions (last 10)
      const recentSessions = await this.prisma.memorySession.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
        select: {
          sessionId: true,
          createdAt: true,
        },
      })

      // Get message counts for each session
      const sessionIds = recentSessions.map((s) => s.sessionId)
      const messageCounts = await this.prisma.bufferMessage.groupBy({
        by: ['sessionId'],
        where: {
          sessionId: {
            in: sessionIds,
          },
        },
        _count: {
          id: true,
        },
      })

      const messageCountMap = messageCounts.reduce((acc, item) => {
        acc[item.sessionId] = item._count.id
        return acc
      }, {} as Record<string, number>)

      // Get recent messages (last 10)
      const recentMessages = await this.prisma.bufferMessage.findMany({
        orderBy: {
          timestamp: 'desc',
        },
        take: 10,
        select: {
          role: true,
          content: true,
          timestamp: true,
        },
      })

      // Check database connection
      let databaseConnected = false
      try {
        await this.prisma.$queryRaw`SELECT 1`
        databaseConnected = true
      } catch {
        databaseConnected = false
      }

      return {
        overview: {
          totalSessions,
          totalMessages,
          totalEntities,
          totalSummaries,
          totalKnowledgeNodes,
          totalKnowledgeRelationships,
        },
        systemHealth: {
          databaseConnected,
          lastUpdated: new Date().toISOString(),
          memoryStats: {
            unique_sessions: uniqueSessions.length,
            total_messages: totalMessages,
            oldest_message: oldestMessage?.timestamp?.toISOString() ?? null,
            newest_message: newestMessage?.timestamp?.toISOString() ?? null,
          },
        },
        recentActivity: {
          sessions: recentSessions.map((session) => ({
            sessionId: session.sessionId,
            createdAt: session.createdAt.toISOString(),
            message_count: messageCountMap[session.sessionId] ?? 0,
          })),
          messages: recentMessages.map((message) => ({
            role: message.role,
            content: message.content,
            timestamp: message.timestamp.toISOString(),
          })),
        },
      }
    } catch (error) {
      // Log error for debugging
      console.error('Error fetching memory details:', error)
      // If there's an error, return a response with error state
      return {
        overview: {
          totalSessions: 0,
          totalMessages: 0,
          totalEntities: 0,
          totalSummaries: 0,
          totalKnowledgeNodes: 0,
          totalKnowledgeRelationships: 0,
        },
        systemHealth: {
          databaseConnected: false,
          lastUpdated: new Date().toISOString(),
          memoryStats: {
            unique_sessions: 0,
            total_messages: 0,
            oldest_message: null,
            newest_message: null,
          },
        },
        recentActivity: {
          sessions: [],
          messages: [],
        },
      }
    }
  }
}

