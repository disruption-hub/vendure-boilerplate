import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'

export interface SystemStatsResponse {
  totalTenants: number
  totalUsers: number
  activeTenants: number
  totalTrademarks: number
  totalMemorySessions: number
  totalKnowledgeNodes: number
  databaseSize: string
  databaseSizeBytes: number
  timestamp: string
}

export interface ServiceHealthSummary {
  name: string
  url: string
  status: 'healthy' | 'unhealthy' | 'unknown'
  responseTime?: number
  lastChecked: string
}

export interface SystemHealthResponse {
  services: ServiceHealthSummary[]
  timestamp: string
}

interface ServiceTarget {
  name: string
  url: string
}

@Injectable()
export class AdminSystemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getSystemStats(): Promise<SystemStatsResponse> {
    const [totalTenants, activeTenants, totalUsers, totalTrademarks, totalMemorySessions, totalKnowledgeNodes] =
      await this.prisma.$transaction([
        this.prisma.tenant.count(),
        this.prisma.tenant.count({ where: { isActive: true } }),
        this.prisma.user.count(),
        this.prisma.trademark.count(),
        this.prisma.memorySession.count(),
        this.prisma.knowledgeNode.count(),
      ])

    const databaseSize = await this.resolveDatabaseSize()

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      totalTrademarks,
      totalMemorySessions,
      totalKnowledgeNodes,
      databaseSize: databaseSize.formatted ?? 'unavailable',
      databaseSizeBytes: databaseSize.bytes ?? 0,
      timestamp: new Date().toISOString(),
    }
  }

  async getSystemHealth(): Promise<SystemHealthResponse> {
    const services = await Promise.all(this.getServiceTargets().map((target) => this.checkService(target)))

    return {
      services,
      timestamp: new Date().toISOString(),
    }
  }

  private async checkService(target: ServiceTarget): Promise<ServiceHealthSummary> {
    const resolvedUrl = this.resolveServiceUrl(target.url)
    const controller = new AbortController()
    const timeoutMs = this.configService.get<number>('ADMIN_HEALTH_TIMEOUT_MS') ?? 5000
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    const startedAt = Date.now()

    try {
      const response = await fetch(resolvedUrl, { signal: controller.signal })
      const responseTime = Date.now() - startedAt
      return {
        name: target.name,
        url: resolvedUrl,
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime,
        lastChecked: new Date().toISOString(),
      }
    } catch (error) {
      return {
        name: target.name,
        url: resolvedUrl,
        status: 'unhealthy',
        responseTime: Date.now() - startedAt,
        lastChecked: new Date().toISOString(),
      }
    } finally {
      clearTimeout(timeout)
    }
  }

  private getServiceTargets(): ServiceTarget[] {
    const envTargets = this.configService.get<string>('ADMIN_HEALTH_SERVICES')
    if (envTargets) {
      try {
        const parsed = JSON.parse(envTargets) as ServiceTarget[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((item) => typeof item?.name === 'string' && typeof item?.url === 'string')
        }
      } catch (error) {
        // Ignore malformed JSON and fall back to defaults
      }
    }

    return [
      { name: 'Backend API', url: '/health' },
      { name: 'Identity Service', url: 'http://identity-service:8000/health' },
      { name: 'Memory Service', url: 'http://memory-service:3001/health' },
      { name: 'Analytics Service', url: 'http://analytics-service:3002/health' },
      { name: 'Search Service', url: 'http://search-service:3003/health' },
      { name: 'Agent Service', url: 'http://agent-service:8001/health' },
      { name: 'Data Ingestion Service', url: 'http://data-ingestion-service:3004/health' },
      { name: 'Knowledge Base Service', url: 'http://knowledge-base-service:3005/health' },
      { name: 'Configuration Service', url: 'http://configuration-service:3008/health' },
      { name: 'Admin Service', url: 'http://admin-service:3007/health' },
    ]
  }

  private resolveServiceUrl(candidate: string): string {
    try {
      const url = new URL(candidate)
      return url.toString()
    } catch (error) {
      const base = this.configService.get<string>('ADMIN_HEALTH_BASE_URL') ?? this.defaultBaseUrl()
      return new URL(candidate, base).toString()
    }
  }

  private defaultBaseUrl(): string {
    const port = this.configService.get<string>('PORT') ?? '3001'
    const rawHost =
      this.configService.get<string>('ADMIN_HEALTH_HOST') ??
      this.configService.get<string>('HOST') ??
      'localhost'

    const hostWithProtocol = rawHost.includes('://') ? rawHost : `http://${rawHost}`

    try {
      const base = new URL(hostWithProtocol)
      const normalizedPort = port ? Number.parseInt(port, 10) : undefined
      if (normalizedPort && !Number.isNaN(normalizedPort)) {
        base.port = normalizedPort.toString()
      }
      return base.toString()
    } catch (error) {
      return `http://localhost:${port}`
    }
  }

  private async resolveDatabaseSize(): Promise<{ bytes: number | null; formatted: string | null }> {
    try {
      const result = await this.prisma.$queryRaw<{ size: bigint }[]>`SELECT pg_database_size(current_database()) AS size`
      const raw = result?.[0]?.size
      if (typeof raw === 'bigint') {
        const bytes = Number(raw)
        if (Number.isFinite(bytes)) {
          return {
            bytes,
            formatted: this.formatBytes(bytes),
          }
        }
      }
    } catch (error) {
      return { bytes: null, formatted: null }
    }

    return { bytes: null, formatted: null }
  }

  private formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) {
      return '0 B'
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
    const value = bytes / Math.pow(1024, exponent)
    return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
  }
}
