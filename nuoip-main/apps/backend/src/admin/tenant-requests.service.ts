import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateTenantRequestDto } from './dto/update-tenant-request.dto'

export interface TenantRequestSummary {
  id: string
  companyName: string
  contactName: string
  email: string
  desiredSubdomain: string
  status: string
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

@Injectable()
export class AdminTenantRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  private isPrismaError(error: unknown, code: string): boolean {
    return Boolean(
      error &&
        typeof error === 'object' &&
        'code' in (error as Record<string, unknown>) &&
        (error as Record<string, unknown>).code === code,
    )
  }

  async listTenantRequests(status?: string): Promise<TenantRequestSummary[]> {
    const where: any = {}
    if (status) {
      where.status = status
    }

    const requests = await this.prisma.tenantSignupRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        companyName: true,
        contactName: true,
        email: true,
        desiredSubdomain: true,
        status: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return requests.map((request) => this.toSummary(request))
  }

  async updateTenantRequest(requestId: string, dto: UpdateTenantRequestDto): Promise<TenantRequestSummary> {
    try {
      if (!dto.action || !['approve', 'reject'].includes(dto.action)) {
        throw new BadRequestException('Action must be either "approve" or "reject"')
      }

      const updateData: any = {
        status: dto.action === 'approve' ? 'approved' : 'rejected',
      }

      if (dto.reason) {
        updateData.metadata = {
          ...(updateData.metadata || {}),
          rejectionReason: dto.reason,
        }
      }

      const request = await this.prisma.tenantSignupRequest.update({
        where: { id: requestId },
        data: updateData,
        select: {
          id: true,
          companyName: true,
          contactName: true,
          email: true,
          desiredSubdomain: true,
          status: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      // If approved, create the tenant
      if (dto.action === 'approve') {
        try {
          const rootDomain = process.env.ROOT_DOMAIN || 'flowcast.chat'
          const domain = `${request.desiredSubdomain}.${rootDomain}`

          await this.prisma.tenant.create({
            data: {
              name: request.companyName,
              domain: domain,
              subdomain: request.desiredSubdomain,
              displayName: request.companyName,
              contactEmail: request.email,
              isActive: true,
              settings: {
                features: [],
                limits: {
                  maxUsers: 10,
                  maxTrademarks: 5,
                },
                branding: {
                  primaryColor: '#3b82f6',
                  logoUrl: null,
                },
              },
            },
          })
        } catch (error) {
          // If tenant creation fails, log but don't fail the request update
          console.error('Failed to create tenant after approval:', error)
        }
      }

      return this.toSummary(request)
    } catch (error) {
      if (this.isPrismaError(error, 'P2025')) {
        throw new NotFoundException('Tenant request not found')
      }
      throw error
    }
  }

  private toSummary(request: {
    id: string
    companyName: string
    contactName: string
    email: string
    desiredSubdomain: string
    status: string
    metadata: unknown
    createdAt: Date
    updatedAt: Date
  }): TenantRequestSummary {
    return {
      id: request.id,
      companyName: request.companyName,
      contactName: request.contactName,
      email: request.email,
      desiredSubdomain: request.desiredSubdomain,
      status: request.status,
      metadata:
        request.metadata && typeof request.metadata === 'object'
          ? (request.metadata as Record<string, unknown>)
          : null,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
    }
  }
}

