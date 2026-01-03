import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Prisma } from '@prisma/client'

export interface ScheduleTemplateResponse {
  id: string
  name: string
  description: string | null
  tenantId: string
  departmentId: string | null
  isActive: boolean
  recurringType: string
  recurringDays: number[]
  timeZone: string
  createdAt: Date
  updatedAt: Date
  slots: Array<{
    id: string
    templateId: string
    startTime: string
    endTime: string
    duration: number
    bufferTime: number
    isActive: boolean
    maxBookings: number | null
    priority: number
    createdAt: Date
    updatedAt: Date
  }>
  exceptions: Array<{
    id: string
    templateId: string | null
    exceptionType: string
    date: Date
    startTime: string | null
    endTime: string | null
    newStartTime: string | null
    newEndTime: string | null
    reason: string | null
    createdAt: Date
    updatedAt: Date
  }>
}

export interface CreateScheduleTemplateDto {
  name: string
  description?: string | null
  tenantId?: string
  departmentId?: string | null
  isActive?: boolean
  recurringType: 'daily' | 'weekly' | 'monthly'
  recurringDays: number[]
  timeZone: string
  slots: Array<{
    startTime: string
    endTime: string
    duration?: number
    bufferTime?: number
    isActive?: boolean
    maxBookings?: number | null
    priority?: number
  }>
}

export interface UpdateScheduleTemplateDto extends Partial<CreateScheduleTemplateDto> { }

@Injectable()
export class AdminScheduleService {
  constructor(private readonly prisma: PrismaService) { }

  async getScheduleTemplates(tenantId?: string): Promise<ScheduleTemplateResponse[]> {
    const where: Prisma.ScheduleTemplateWhereInput = {}

    if (tenantId) {
      where.tenantId = tenantId
    }

    const templates = await this.prisma.scheduleTemplate.findMany({
      where: {
        tenantId
      },
      include: {
        scheduleSlots: {
          orderBy: [
            {
              priority: "asc"
            },
            {
              startTime: "asc"
            }
          ]
        },
        scheduleExceptions: {
          orderBy: {
            date: "asc"
          }
        },
        department: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return templates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      tenantId: template.tenantId,
      departmentId: template.departmentId,
      isActive: template.isActive,
      recurringType: template.recurringType,
      recurringDays: template.recurringDays,
      timeZone: template.timeZone,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      slots: (template.scheduleSlots || []).map((slot) => ({
        id: slot.id,
        templateId: slot.templateId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: slot.duration,
        bufferTime: slot.bufferTime,
        isActive: slot.isActive,
        maxBookings: slot.maxBookings,
        priority: slot.priority,
        createdAt: slot.createdAt,
        updatedAt: slot.updatedAt,
      })),
      exceptions: (template.scheduleExceptions || []).map((exception) => ({
        id: exception.id,
        templateId: exception.templateId,
        exceptionType: exception.exceptionType,
        date: exception.date,
        startTime: exception.startTime,
        endTime: exception.endTime,
        newStartTime: exception.newStartTime,
        newEndTime: exception.newEndTime,
        reason: exception.reason,
        createdAt: exception.createdAt,
        updatedAt: exception.updatedAt,
      })),
    }))
  }

  async getScheduleTemplateById(id: string): Promise<ScheduleTemplateResponse> {
    const template = await this.prisma.scheduleTemplate.findUnique({
      where: { id },
      include: {
        slots: {
          orderBy: [{ priority: 'asc' }, { startTime: 'asc' }],
        },
        exceptions: {
          orderBy: { date: 'asc' },
        },
      },
    })

    if (!template) {
      throw new NotFoundException(`Schedule template with ID ${id} not found`)
    }

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      tenantId: template.tenantId,
      departmentId: template.departmentId,
      isActive: template.isActive,
      recurringType: template.recurringType,
      recurringDays: template.recurringDays,
      timeZone: template.timeZone,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      slots: (template.scheduleSlots || []).map((slot) => ({
        id: slot.id,
        templateId: slot.templateId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: slot.duration,
        bufferTime: slot.bufferTime,
        isActive: slot.isActive,
        maxBookings: slot.maxBookings,
        priority: slot.priority,
        createdAt: slot.createdAt,
        updatedAt: slot.updatedAt,
      })),
      exceptions: (template.scheduleExceptions || []).map((exception) => ({
        id: exception.id,
        templateId: exception.templateId,
        exceptionType: exception.exceptionType,
        date: exception.date,
        startTime: exception.startTime,
        endTime: exception.endTime,
        newStartTime: exception.newStartTime,
        newEndTime: exception.newEndTime,
        reason: exception.reason,
        createdAt: exception.createdAt,
        updatedAt: exception.updatedAt,
      })),
    }
  }

  async createScheduleTemplate(
    payload: CreateScheduleTemplateDto,
  ): Promise<ScheduleTemplateResponse> {
    if (!payload.name || !payload.recurringType || !payload.timeZone) {
      throw new BadRequestException('Name, recurringType, and timeZone are required')
    }

    if (!Array.isArray(payload.recurringDays)) {
      throw new BadRequestException('recurringDays must be an array')
    }

    if (!Array.isArray(payload.slots) || payload.slots.length === 0) {
      throw new BadRequestException('At least one slot is required')
    }

    const tenantId = payload.tenantId || 'default_tenant'

    const template = await this.prisma.scheduleTemplate.create({
      data: {
        name: payload.name,
        description: payload.description ?? null,
        tenantId,
        departmentId: payload.departmentId ?? null,
        isActive: payload.isActive ?? true,
        recurringType: payload.recurringType,
        recurringDays: payload.recurringDays,
        timeZone: payload.timeZone,
        slots: {
          create: payload.slots.map((slot) => ({
            startTime: slot.startTime,
            endTime: slot.endTime,
            duration: slot.duration ?? 60,
            bufferTime: slot.bufferTime ?? 15,
            isActive: slot.isActive ?? true,
            maxBookings: slot.maxBookings ?? null,
            priority: slot.priority ?? 1,
          })),
        },
      },
      include: {
        slots: {
          orderBy: [{ priority: 'asc' }, { startTime: 'asc' }],
        },
        exceptions: {
          orderBy: { date: 'asc' },
        },
      },
    })

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      tenantId: template.tenantId,
      departmentId: template.departmentId,
      isActive: template.isActive,
      recurringType: template.recurringType,
      recurringDays: template.recurringDays,
      timeZone: template.timeZone,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      slots: (template.scheduleSlots || []).map((slot) => ({
        id: slot.id,
        templateId: slot.templateId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: slot.duration,
        bufferTime: slot.bufferTime,
        isActive: slot.isActive,
        maxBookings: slot.maxBookings,
        priority: slot.priority,
        createdAt: slot.createdAt,
        updatedAt: slot.updatedAt,
      })),
      exceptions: (template.scheduleExceptions || []).map((exception) => ({
        id: exception.id,
        templateId: exception.templateId,
        exceptionType: exception.exceptionType,
        date: exception.date,
        startTime: exception.startTime,
        endTime: exception.endTime,
        newStartTime: exception.newStartTime,
        newEndTime: exception.newEndTime,
        reason: exception.reason,
        createdAt: exception.createdAt,
        updatedAt: exception.updatedAt,
      })),
    }
  }

  async updateScheduleTemplate(
    id: string,
    payload: UpdateScheduleTemplateDto,
  ): Promise<ScheduleTemplateResponse> {
    const existing = await this.prisma.scheduleTemplate.findUnique({
      where: { id },
    })

    if (!existing) {
      throw new NotFoundException(`Schedule template with ID ${id} not found`)
    }

    const updateData: Prisma.ScheduleTemplateUpdateInput = {}

    if (payload.name !== undefined) {
      updateData.name = payload.name
    }
    if (payload.description !== undefined) {
      updateData.description = payload.description
    }
    if (payload.tenantId !== undefined) {
      updateData.tenantId = payload.tenantId
    }
    if (payload.departmentId !== undefined) {
      if (payload.departmentId) {
        updateData.department = { connect: { id: payload.departmentId } }
      } else {
        updateData.department = { disconnect: true }
      }
    }
    if (payload.isActive !== undefined) {
      updateData.isActive = payload.isActive
    }
    if (payload.recurringType !== undefined) {
      updateData.recurringType = payload.recurringType
    }
    if (payload.recurringDays !== undefined) {
      if (!Array.isArray(payload.recurringDays)) {
        throw new BadRequestException('recurringDays must be an array')
      }
      updateData.recurringDays = payload.recurringDays
    }
    if (payload.timeZone !== undefined) {
      updateData.timeZone = payload.timeZone
    }

    // Handle slots update if provided
    if (payload.slots !== undefined) {
      if (!Array.isArray(payload.slots)) {
        throw new BadRequestException('slots must be an array')
      }

      // Delete existing slots and create new ones
      await this.prisma.scheduleSlot.deleteMany({
        where: { templateId: id },
      })

      updateData.slots = {
        create: payload.slots.map((slot) => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
          duration: slot.duration ?? 60,
          bufferTime: slot.bufferTime ?? 15,
          isActive: slot.isActive ?? true,
          maxBookings: slot.maxBookings ?? null,
          priority: slot.priority ?? 1,
        })),
      }
    }

    const template = await this.prisma.scheduleTemplate.update({
      where: { id },
      data: updateData,
      include: {
        slots: {
          orderBy: [{ priority: 'asc' }, { startTime: 'asc' }],
        },
        exceptions: {
          orderBy: { date: 'asc' },
        },
      },
    })

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      tenantId: template.tenantId,
      departmentId: template.departmentId,
      isActive: template.isActive,
      recurringType: template.recurringType,
      recurringDays: template.recurringDays,
      timeZone: template.timeZone,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      slots: (template.scheduleSlots || []).map((slot) => ({
        id: slot.id,
        templateId: slot.templateId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: slot.duration,
        bufferTime: slot.bufferTime,
        isActive: slot.isActive,
        maxBookings: slot.maxBookings,
        priority: slot.priority,
        createdAt: slot.createdAt,
        updatedAt: slot.updatedAt,
      })),
      exceptions: (template.scheduleExceptions || []).map((exception) => ({
        id: exception.id,
        templateId: exception.templateId,
        exceptionType: exception.exceptionType,
        date: exception.date,
        startTime: exception.startTime,
        endTime: exception.endTime,
        newStartTime: exception.newStartTime,
        newEndTime: exception.newEndTime,
        reason: exception.reason,
        createdAt: exception.createdAt,
        updatedAt: exception.updatedAt,
      })),
    }
  }

  async deleteScheduleTemplate(id: string): Promise<void> {
    const existing = await this.prisma.scheduleTemplate.findUnique({
      where: { id },
    })

    if (!existing) {
      throw new NotFoundException(`Schedule template with ID ${id} not found`)
    }

    // Slots and exceptions will be deleted automatically due to cascade delete
    await this.prisma.scheduleTemplate.delete({
      where: { id },
    })
  }
}

