import { AdminSystemService } from './system.service'

describe('AdminSystemService', () => {
  const prisma = {
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    tenant: {
      count: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
    trademark: {
      count: jest.fn(),
    },
    memorySession: {
      count: jest.fn(),
    },
    knowledgeNode: {
      count: jest.fn(),
    },
  }

  const config = {
    get: jest.fn(),
  }

  let service: AdminSystemService
  const originalFetch = global.fetch

  beforeEach(() => {
    jest.resetAllMocks()
    prisma.$transaction.mockImplementation(async (operations: Promise<unknown>[]) => Promise.all(operations))
    prisma.$queryRaw.mockResolvedValue([{ size: BigInt(1048576) }])
    prisma.tenant.count.mockResolvedValueOnce(5).mockResolvedValueOnce(3)
    prisma.user.count.mockResolvedValue(42)
    prisma.trademark.count.mockResolvedValue(17)
    prisma.memorySession.count.mockResolvedValue(9)
    prisma.knowledgeNode.count.mockResolvedValue(11)

    config.get.mockImplementation((key: string) => {
      switch (key) {
        case 'ADMIN_HEALTH_SERVICES':
          return JSON.stringify([{ name: 'Backend API', url: '/health' }])
        case 'ADMIN_HEALTH_BASE_URL':
          return 'http://localhost:3001'
        case 'ADMIN_HEALTH_TIMEOUT_MS':
          return 100
        case 'PORT':
          return '3001'
        case 'HOST':
          return 'http://localhost'
        default:
          return undefined
      }
    })

    service = new AdminSystemService(prisma as unknown as any, config as unknown as any)

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
    } as any)
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('returns aggregated system statistics', async () => {
    const stats = await service.getSystemStats()

    expect(prisma.$transaction).toHaveBeenCalled()
    expect(prisma.$queryRaw).toHaveBeenCalled()
    expect(stats).toEqual(
      expect.objectContaining({
        totalTenants: 5,
        activeTenants: 3,
        totalUsers: 42,
        totalTrademarks: 17,
        totalMemorySessions: 9,
        totalKnowledgeNodes: 11,
        databaseSize: '1.0 MB',
      }),
    )
  })

  it('evaluates service health based on configured targets', async () => {
    const health = await service.getSystemHealth()

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/health', expect.any(Object))
    expect(health.services).toHaveLength(1)
    expect(health.services[0]).toEqual(
      expect.objectContaining({
        name: 'Backend API',
        status: 'healthy',
      }),
    )
  })
})
