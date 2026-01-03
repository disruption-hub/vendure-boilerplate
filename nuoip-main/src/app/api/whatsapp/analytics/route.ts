import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('whatsapp-analytics-api')
const prisma = new PrismaClient()

/**
 * GET /api/whatsapp/analytics?sessionId=xxx&timeRange=7d
 * Get analytics for a WhatsApp session
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const timeRange = searchParams.get('timeRange') || '7d'

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

    const tenantId = session.user.tenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'User not associated with tenant' }, { status: 400 })
    }

    // Verify session belongs to tenant
    const whatsappSession = await prisma.whatsAppSession.findUnique({
      where: { sessionId },
    })

    if (!whatsappSession || whatsappSession.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 })
    }

    // Calculate time range
    const now = new Date()
    const timeRangeMap: Record<string, number> = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
    }
    const timeRangeMs = timeRangeMap[timeRange] || timeRangeMap['7d']
    const startDate = new Date(now.getTime() - timeRangeMs)

    // Get message statistics
    const totalMessages = await prisma.whatsAppMessage.count({
      where: {
        sessionId,
        timestamp: {
          gte: startDate,
        },
      },
    })

    const sentMessages = await prisma.whatsAppMessage.count({
      where: {
        sessionId,
        fromMe: true,
        timestamp: {
          gte: startDate,
        },
      },
    })

    const receivedMessages = await prisma.whatsAppMessage.count({
      where: {
        sessionId,
        fromMe: false,
        timestamp: {
          gte: startDate,
        },
      },
    })

    // Get active contacts
    const activeContacts = await prisma.whatsAppContact.count({
      where: {
        sessionId,
        lastMessageAt: {
          gte: startDate,
        },
      },
    })

    // Calculate percentages
    const sentPercentage = totalMessages > 0 ? Math.round((sentMessages / totalMessages) * 100) : 0
    const receivedPercentage =
      totalMessages > 0 ? Math.round((receivedMessages / totalMessages) * 100) : 0

    // Get FlowBot messages (messages that were routed to FlowBot)
    // This is approximated by checking messages with specific metadata or senderId
    const flowbotMessages = await prisma.whatsAppMessage.count({
      where: {
        sessionId,
        fromMe: true,
        senderId: 'whatsapp-system',
        timestamp: {
          gte: startDate,
        },
      },
    })

    const flowbotPercentage =
      totalMessages > 0 ? Math.round((flowbotMessages / totalMessages) * 100) : 0

    // Calculate average response time (simplified - time between received and sent messages)
    // This is a placeholder - actual implementation would need more complex logic
    const avgResponseTime = null // TODO: Implement proper calculation

    return NextResponse.json({
      success: true,
      totalMessages,
      sentMessages,
      receivedMessages,
      sentPercentage,
      receivedPercentage,
      activeContacts,
      flowbotMessages,
      flowbotPercentage,
      avgResponseTime,
      timeRange,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
    })
  } catch (error) {
    logger.error('Failed to get analytics', {
      error: error instanceof Error ? error.message : 'unknown-error',
    })

    return NextResponse.json(
      {
        error: 'Failed to get analytics',
        details: error instanceof Error ? error.message : 'unknown-error',
      },
      { status: 500 }
    )
  }
}

