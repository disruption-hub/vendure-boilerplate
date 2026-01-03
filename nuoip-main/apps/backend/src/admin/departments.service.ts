import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AdminDepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTenantDepartments(tenantId: string): Promise<{ success: boolean; departments: any[] }> {
    // Validate tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    })

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`)
    }

    // Get all departments for this tenant
    const departments = await this.prisma.department.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        isDefault: true,
        description: true,
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    })

    return {
      success: true,
      departments: departments.map(dept => ({
        id: dept.id,
        name: dept.name,
        isDefault: dept.isDefault,
        description: dept.description,
      })),
    }
  }

  async createDepartment(payload: { tenantId: string; name: string; description?: string; isDefault?: boolean }): Promise<{ success: boolean; department: any }> {
    // Validate tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: payload.tenantId },
      select: { id: true },
    })

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${payload.tenantId} not found`)
    }

    try {
      const department = await this.prisma.department.create({
        data: {
          tenantId: payload.tenantId,
          name: payload.name.trim(),
          description: payload.description?.trim() || null,
          isDefault: payload.isDefault || false,
        },
        select: {
          id: true,
          name: true,
          isDefault: true,
          description: true,
        },
      })

      return {
        success: true,
        department: {
          id: department.id,
          name: department.name,
          isDefault: department.isDefault,
          description: department.description,
        },
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('A department with this name already exists for this tenant')
      }
      throw error
    }
  }

  async updateDepartment(payload: { id: string; tenantId: string; name?: string; description?: string; isDefault?: boolean }): Promise<{ success: boolean; department: any }> {
    // Validate department exists and belongs to tenant
    const department = await this.prisma.department.findFirst({
      where: {
        id: payload.id,
        tenantId: payload.tenantId,
      },
      select: { id: true },
    })

    if (!department) {
      throw new NotFoundException(`Department with ID ${payload.id} not found for tenant ${payload.tenantId}`)
    }

    const updateData: any = {}
    if (payload.name !== undefined) {
      updateData.name = payload.name.trim()
    }
    if (payload.description !== undefined) {
      updateData.description = payload.description?.trim() || null
    }
    if (payload.isDefault !== undefined) {
      updateData.isDefault = payload.isDefault
    }

    try {
      const updated = await this.prisma.department.update({
        where: { id: payload.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          isDefault: true,
          description: true,
        },
      })

      return {
        success: true,
        department: {
          id: updated.id,
          name: updated.name,
          isDefault: updated.isDefault,
          description: updated.description,
        },
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('A department with this name already exists for this tenant')
      }
      throw error
    }
  }

  async deleteDepartment(payload: { id: string; tenantId: string }): Promise<{ success: boolean }> {
    // Validate department exists and belongs to tenant
    const department = await this.prisma.department.findFirst({
      where: {
        id: payload.id,
        tenantId: payload.tenantId,
      },
      select: { id: true },
    })

    if (!department) {
      throw new NotFoundException(`Department with ID ${payload.id} not found for tenant ${payload.tenantId}`)
    }

    await this.prisma.department.delete({
      where: { id: payload.id },
    })

    return { success: true }
  }
}

