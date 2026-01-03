import { ConflictException, NotFoundException } from '@nestjs/common'
import { AdminTenantsService } from './tenants.service'
import { PrismaService } from '../prisma/prisma.service'

type MockPrismaService = {
  tenant: {
    findMany: jest.Mock
    create: jest.Mock
    update: jest.Mock
  }
  user: {
    groupBy: jest.Mock
  }
  trademark: {
    groupBy: jest.Mock
  }
  memorySession: {
    groupBy: jest.Mock
  }
}

describe('AdminTenantsService', () => {
  const prisma: MockPrismaService = {
    tenant: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      groupBy: jest.fn(),
    },
    trademark: {
      groupBy: jest.fn(),
    },
    memorySession: {
      groupBy: jest.fn(),
    },
  }

  let service: AdminTenantsService

  beforeEach(() => {
    jest.resetAllMocks()
    service = new AdminTenantsService(prisma as unknown as PrismaService)
  })

  it('aggregates tenant metrics when listing tenants', async () => {
    prisma.tenant.findMany.mockResolvedValue([
      {
        id: 'tenant-1',
        name: 'Acme',
        domain: 'acme.test',
        isActive: true,
        settings: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      },
    ])

    prisma.user.groupBy.mockResolvedValue([{ tenantId: 'tenant-1', _count: { _all: 3 } }])
    prisma.trademark.groupBy.mockResolvedValue([{ tenantId: 'tenant-1', _count: { _all: 7 } }])
    prisma.memorySession.groupBy.mockResolvedValue([{ tenantId: 'tenant-1', _count: { _all: 2 } }])

    const result = await service.listTenants()

    expect(result).toEqual([
      expect.objectContaining({
        id: 'tenant-1',
        name: 'Acme',
        userCount: 3,
        trademarkCount: 7,
        memorySessionCount: 2,
      }),
    ])
  })

  it('creates tenants and returns hydrated summary', async () => {
    prisma.tenant.create.mockResolvedValue({
      id: 'tenant-2',
      name: 'Beta',
      domain: null,
      isActive: true,
      settings: null,
      createdAt: new Date('2024-02-01T00:00:00.000Z'),
      updatedAt: new Date('2024-02-01T00:00:00.000Z'),
    })

    const result = await service.createTenant({ name: 'Beta' })

    expect(prisma.tenant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'Beta' }),
      }),
    )
    expect(result).toEqual(
      expect.objectContaining({
        id: 'tenant-2',
        name: 'Beta',
        userCount: 0,
        trademarkCount: 0,
        memorySessionCount: 0,
      }),
    )
  })

  it('maps Prisma unique violations to ConflictException', async () => {
    const prismaError: { code: string } = { code: 'P2002' }
    prisma.tenant.create.mockRejectedValueOnce(prismaError)

    await expect(service.createTenant({ name: 'Acme' })).rejects.toBeInstanceOf(ConflictException)
  })

  it('maps Prisma not found errors to NotFoundException during deactivate', async () => {
    const prismaError: { code: string } = { code: 'P2025' }
    prisma.tenant.update.mockRejectedValueOnce(prismaError)

    await expect(service.deactivateTenant('missing')).rejects.toBeInstanceOf(NotFoundException)
  })
})
