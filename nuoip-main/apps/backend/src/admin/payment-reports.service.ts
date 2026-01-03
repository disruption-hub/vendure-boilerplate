import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { PaymentLink, PaymentLinkStatus, PaymentLinkChannel } from '@prisma/client'

export interface PaymentCurrencySummary {
  currency: string
  linkCount: number
  totalAmountCents: number
  completedAmountCents: number
  completedCount: number
  averageTicketCents: number
}

export interface PaymentStatusBreakdownItem {
  status: string
  count: number
}

export interface PaymentChannelBreakdownItem {
  channel: string
  count: number
}

export interface PaymentReportSummary {
  totals: {
    totalLinks: number
    completedLinks: number
    completionRate: number
    totalAmountCents: number
    completedAmountCents: number
    averageTicketCents: number
    currencyTotals: PaymentCurrencySummary[]
  }
  statusBreakdown: PaymentStatusBreakdownItem[]
  channelBreakdown: PaymentChannelBreakdownItem[]
  recentLinks: Array<{
    id: string
    token: string
    productId: string
    amountCents: number
    currency: string
    status: string
    channel: string
    customerName?: string | null
    customerEmail?: string | null
    createdAt: string
    product: {
      id: string
      productCode: string
      name: string
    }
  }>
  generatedAt: string
}

@Injectable()
export class AdminPaymentReportsService {
  constructor(private readonly prisma: PrismaService) { }

  async getReports(params: {
    tenantId?: string
    limit?: number
    days?: number
  } = {}): Promise<PaymentReportSummary> {
    const where: any = {}

    if (params.tenantId) {
      where.tenantId = params.tenantId
    }

    if (params.days && params.days > 0) {
      const daysAgo = new Date()
      daysAgo.setDate(daysAgo.getDate() - params.days)
      where.createdAt = {
        gte: daysAgo,
      }
    }

    // Get all links matching the criteria
    const allLinks = await this.prisma.paymentLink.findMany({
      where,
      include: {
        paymentProduct: { // Changed from 'product' to 'paymentProduct'
          select: {
            id: true,
            productCode: true,
            name: true,
          },
        },
      },
    })

    // Calculate totals
    const totalLinks = allLinks.length
    const completedLinks = allLinks.filter(link => link.status === 'completed').length
    const completionRate = totalLinks > 0 ? completedLinks / totalLinks : 0

    // Calculate amounts
    const totalAmountCents = allLinks.reduce((sum, link) => sum + link.amountCents, 0)
    const completedAmountCents = allLinks
      .filter(link => link.status === 'completed')
      .reduce((sum, link) => sum + link.amountCents, 0)
    const averageTicketCents = totalLinks > 0 ? Math.round(totalAmountCents / totalLinks) : 0

    // Calculate currency totals
    const currencyMap = new Map<string, {
      linkCount: number
      totalAmountCents: number
      completedAmountCents: number
      completedCount: number
    }>()

    allLinks.forEach(link => {
      const existing = currencyMap.get(link.currency) || {
        linkCount: 0,
        totalAmountCents: 0,
        completedAmountCents: 0,
        completedCount: 0,
      }

      existing.linkCount++
      existing.totalAmountCents += link.amountCents

      if (link.status === 'completed') {
        existing.completedCount++
        existing.completedAmountCents += link.amountCents
      }

      currencyMap.set(link.currency, existing)
    })

    const currencyTotals: PaymentCurrencySummary[] = Array.from(currencyMap.entries()).map(([currency, data]) => ({
      currency,
      linkCount: data.linkCount,
      totalAmountCents: data.totalAmountCents,
      completedAmountCents: data.completedAmountCents,
      completedCount: data.completedCount,
      averageTicketCents: data.linkCount > 0 ? Math.round(data.totalAmountCents / data.linkCount) : 0,
    }))

    // Calculate status breakdown
    const statusMap = new Map<string, number>()
    allLinks.forEach(link => {
      const count = statusMap.get(link.status) || 0
      statusMap.set(link.status, count + 1)
    })

    const statusBreakdown: PaymentStatusBreakdownItem[] = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
    }))

    // Calculate channel breakdown
    const channelMap = new Map<string, number>()
    allLinks.forEach(link => {
      const count = channelMap.get(link.channel) || 0
      channelMap.set(link.channel, count + 1)
    })

    const channelBreakdown: PaymentChannelBreakdownItem[] = Array.from(channelMap.entries()).map(([channel, count]) => ({
      channel,
      count,
    }))

    // Get recent links
    const recentLimit = params.limit || 10
    const recentLinks = allLinks
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, recentLimit)
      .map(link => ({
        id: link.id,
        token: link.token,
        productId: link.productId,
        amountCents: link.amountCents,
        currency: link.currency,
        status: link.status,
        channel: link.channel,
        customerName: link.customerName,
        customerEmail: link.customerEmail,
        createdAt: link.createdAt.toISOString(),
        product: link.product ? {
          id: link.product.id,
          productCode: link.product.productCode,
          name: link.product.name,
        } : undefined,
      }))

    return {
      totals: {
        totalLinks,
        completedLinks,
        completionRate,
        totalAmountCents,
        completedAmountCents,
        averageTicketCents,
        currencyTotals,
      },
      statusBreakdown,
      channelBreakdown,
      recentLinks,
      generatedAt: new Date().toISOString(),
    }
  }
}

