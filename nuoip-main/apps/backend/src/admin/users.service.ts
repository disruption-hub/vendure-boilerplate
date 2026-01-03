import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserRole, UserStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

export interface AdminUserSummary {
  id: string
  email: string
  name: string | null
  role: string
  tenantId: string
  status: string
  phone?: string | null
  phoneCountryCode?: string | null
  profilePictureUrl?: string | null
  preferredLanguage?: string | null
  timezone?: string | null
  departmentId?: string | null
  approvalStatus?: string | null
  approvalMessage?: string | null
  approvedById?: string | null
  invitedById?: string | null
  chatbotAccessStatus?: string | null
  chatbotContactIds?: string[]
  metadata?: any
  createdAt: string
  updatedAt: string
}

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) { }

  private isPrismaError(error: unknown, code: string): boolean {
    return Boolean(
      error &&
      typeof error === 'object' &&
      'code' in (error as Record<string, unknown>) &&
      (error as Record<string, unknown>).code === code,
    )
  }

  async listUsers(): Promise<AdminUserSummary[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        status: true,
        phone: true,
        phoneCountryCode: true,
        profilePictureUrl: true,
        preferredLanguage: true,
        timezone: true,
        departmentId: true,
        approvalStatus: true,
        approvalMessage: true,
        approvedById: true,
        invitedById: true,
        chatbotAccessStatus: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Get contact assignments for all users efficiently
    const userIds = users.map(u => u.id)
    const phoneUserIds = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, chatbotPhoneUserId: true },
    })

    const phoneUserIdMap = new Map(phoneUserIds.map(u => [u.id, u.chatbotPhoneUserId]))
    const validPhoneUserIds = Array.from(phoneUserIdMap.values()).filter(Boolean) as string[]

    // Fetch all contact accesses in one query
    const allContactAccesses = validPhoneUserIds.length > 0
      ? await this.prisma.chatbotContactAccess.findMany({
        where: { phoneUserId: { in: validPhoneUserIds } },
        select: { phoneUserId: true, contactId: true },
      })
      : []

    // Group contacts by phoneUserId, then map to userId
    const contactsByPhoneUserId = new Map<string, string[]>()
    for (const access of allContactAccesses) {
      const existing = contactsByPhoneUserId.get(access.phoneUserId) || []
      existing.push(access.contactId)
      contactsByPhoneUserId.set(access.phoneUserId, existing)
    }

    const contactAccessMap = new Map<string, string[]>()
    for (const user of users) {
      const phoneUserId = phoneUserIdMap.get(user.id)
      contactAccessMap.set(user.id, phoneUserId ? (contactsByPhoneUserId.get(phoneUserId) || []) : [])
    }

    return users.map((user) => ({
      ...this.toSummary(user),
      phone: user.phone,
      phoneCountryCode: user.phoneCountryCode,
      profilePictureUrl: user.profilePictureUrl,
      preferredLanguage: user.preferredLanguage,
      timezone: user.timezone,
      departmentId: user.departmentId,
      approvalStatus: user.approvalStatus,
      approvalMessage: user.approvalMessage,
      approvedById: user.approvedById,
      invitedById: user.invitedById,
      chatbotAccessStatus: user.chatbotAccessStatus,
      chatbotContactIds: contactAccessMap.get(user.id) || [],
      metadata: user.metadata,
    }))
  }

  async createUser(dto: CreateUserDto): Promise<AdminUserSummary> {
    try {
      // Hash password if provided
      let hashedPassword: string | undefined
      if (dto.password) {
        hashedPassword = await bcrypt.hash(dto.password, 10)
      }

      const user = await this.prisma.user.create({
        data: {
          email: dto.email.trim().toLowerCase(),
          name: dto.name?.trim() || null,
          password: hashedPassword || '',
          role: (dto.role || 'user') as UserRole,
          tenantId: dto.tenantId,
          preferredLanguage: dto.preferredLanguage || 'en',
          status: (dto.status || 'active') as UserStatus,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          tenantId: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      return this.toSummary(user)
    } catch (error) {
      if (this.isPrismaError(error, 'P2002')) {
        throw new ConflictException('Email already in use')
      }
      throw error
    }
  }

  async updateUser(userId: string, dto: UpdateUserDto): Promise<AdminUserSummary> {
    try {
      console.log('[AdminUsersService] updateUser called with:', {
        userId,
        dto: {
          ...dto,
          password: dto.password ? '[REDACTED]' : undefined,
          contactIds: dto.contactIds?.length || 0,
        },
      })

      // First, get the current user to check if they have a linked phone user
      const currentUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          chatbotPhoneUserId: true,
          tenantId: true,
        },
      })

      if (!currentUser) {
        throw new NotFoundException('User not found')
      }

      const updateData: any = {}

      if (dto.email !== undefined) {
        updateData.email = dto.email.trim().toLowerCase()
      }
      if (dto.name !== undefined) {
        updateData.name = dto.name?.trim() || null
      }
      if (dto.password) {
        updateData.password = await bcrypt.hash(dto.password, 10)
      }
      if (dto.role !== undefined) {
        updateData.role = dto.role
      }
      if (dto.status !== undefined) {
        updateData.status = dto.status
      }
      if (dto.preferredLanguage !== undefined) {
        updateData.preferredLanguage = dto.preferredLanguage
      }
      if (dto.tenantId !== undefined) {
        // Validate tenant exists if tenantId is provided
        if (dto.tenantId) {
          const tenant = await this.prisma.tenant.findUnique({
            where: { id: dto.tenantId },
            select: { id: true },
          })
          if (!tenant) {
            throw new NotFoundException(`Tenant with ID ${dto.tenantId} not found`)
          }
        }
        updateData.tenantId = dto.tenantId || null
      }
      if (dto.phone !== undefined) {
        updateData.phone = dto.phone?.trim() || null
      }
      if (dto.phoneCountryCode !== undefined) {
        updateData.phoneCountryCode = dto.phoneCountryCode?.trim() || null
      }
      if (dto.profilePictureUrl !== undefined) {
        updateData.profilePictureUrl = dto.profilePictureUrl?.trim() || null
      }
      if (dto.approvalStatus !== undefined) {
        updateData.approvalStatus = dto.approvalStatus
        if (dto.approvalStatus === 'approved' || dto.approvalStatus === 'rejected') {
          updateData.approvalUpdatedAt = new Date()
        }
      }
      if (dto.approvalMessage !== undefined) {
        updateData.approvalMessage = dto.approvalMessage?.trim() || null
      }
      if (dto.approvedById !== undefined) {
        updateData.approvedById = dto.approvedById || null
      }
      if (dto.invitedById !== undefined) {
        updateData.invitedById = dto.invitedById || null
      }
      if (dto.chatbotAccessStatus !== undefined) {
        updateData.chatbotAccessStatus = dto.chatbotAccessStatus
        if (dto.chatbotAccessStatus === 'approved') {
          updateData.chatbotApprovedAt = new Date()
        } else if (dto.chatbotAccessStatus === 'revoked') {
          updateData.chatbotRevokedAt = new Date()
        }
      }
      if (dto.timezone !== undefined) {
        updateData.timezone = dto.timezone?.trim() || null
      }
      if (dto.departmentId !== undefined) {
        updateData.departmentId = dto.departmentId || null
      }
      if (dto.metadata !== undefined) {
        updateData.metadata = dto.metadata
      }

      console.log('[AdminUsersService] Prepared updateData:', {
        ...updateData,
        password: updateData.password ? '[REDACTED]' : undefined,
      })

      // Update user
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          tenantId: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      // Handle contactIds if provided - this updates ChatbotContactAccess
      if (dto.contactIds !== undefined && currentUser.chatbotPhoneUserId) {
        const phoneUserId = currentUser.chatbotPhoneUserId
        const tenantId = updateData.tenantId || currentUser.tenantId

        // Get current contact access entries
        const currentAccess = await this.prisma.chatbotContactAccess.findMany({
          where: {
            phoneUserId,
            tenantId,
          },
          select: { contactId: true },
        })

        const currentContactIds = new Set(currentAccess.map(a => a.contactId))
        const newContactIds = new Set(dto.contactIds.filter(Boolean))

        // Find contacts to add
        const toAdd = Array.from(newContactIds).filter(id => !currentContactIds.has(id))
        // Find contacts to remove
        const toRemove = Array.from(currentContactIds).filter(id => !newContactIds.has(id))

        // Add new contact access
        if (toAdd.length > 0) {
          await this.prisma.chatbotContactAccess.createMany({
            data: toAdd.map(contactId => ({
              tenantId,
              contactId,
              phoneUserId,
            })),
            skipDuplicates: true,
          })
        }

        // Remove contact access
        if (toRemove.length > 0) {
          await this.prisma.chatbotContactAccess.deleteMany({
            where: {
              phoneUserId,
              tenantId,
              contactId: { in: toRemove },
            },
          })
        }
      }

      return this.toSummary(user)
    } catch (error) {
      if (this.isPrismaError(error, 'P2025')) {
        throw new NotFoundException('User not found')
      }
      if (this.isPrismaError(error, 'P2002')) {
        throw new ConflictException('Email already in use')
      }
      throw error
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id: userId },
      })
    } catch (error) {
      if (this.isPrismaError(error, 'P2025')) {
        throw new NotFoundException('User not found')
      }
      throw error
    }
  }

  private toSummary(user: {
    id: string
    email: string
    name: string | null
    role: string
    tenantId: string
    status: string
    createdAt: Date
    updatedAt: Date
  }): AdminUserSummary {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }
  }
}

