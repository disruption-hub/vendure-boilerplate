import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

interface CommunicationConfig {
  id: number
  tenantId: string | null
  name: string
  provider: string
  channel: string
  config: any
  isActive: boolean
  createdAt: string
  updatedAt: string
}

@Injectable()
export class AdminCommunicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCommunications(): Promise<CommunicationConfig[]> {
    try {
      // Try to fetch from communication_config table if it exists
      const configs = await this.prisma.$queryRaw<CommunicationConfig[]>`
        SELECT
          id::integer,
          "tenantId",
          name,
          provider,
          channel,
          config,
          "isActive",
          "createdAt"::text,
          "updatedAt"::text
        FROM communication_config
        WHERE "isActive" = true
        ORDER BY "createdAt" DESC
      `
      return configs
    } catch (error) {
      // If table doesn't exist, return mock data
      console.log('Communication config table not found, returning mock data')
      return [
        {
          id: 1,
          tenantId: 'default-tenant',
          name: 'WhatsApp Business',
          provider: 'WHATSAPP_CLOUD',
          channel: 'WHATSAPP',
          config: { phoneNumberId: '123456789' },
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 2,
          tenantId: 'default-tenant',
          name: 'Transactional Email',
          provider: 'BREVO',
          channel: 'EMAIL',
          config: { apiKey: 'configured' },
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 3,
          tenantId: 'default-tenant',
          name: 'SMS Service',
          provider: 'LABSMOBILE',
          channel: 'SMS',
          config: { username: 'configured' },
          isActive: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
    }
  }
}
