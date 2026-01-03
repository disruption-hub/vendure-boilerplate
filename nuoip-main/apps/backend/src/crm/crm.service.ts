import { Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { PrismaService } from '../prisma/prisma.service'
import { Prisma } from '@prisma/client'

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) { }

  async listCustomers(query: {
    tenantId: string
    phone?: string | null
    email?: string | null
    search?: string | null
    limit?: number
  }) {
    const customers: Array<{
      id: string
      tenantId: string
      name: string
      email: string | null
      phone: string | null
      type: 'lead' | 'contact'
      status: string | null
    }> = []

    try {
      // Search ApplicationRequest (leads) by email or phone
      if (query.email || query.phone) {
        const where: Prisma.application_requestsWhereInput = {}

        if (query.email && query.phone) {
          where.OR = [
            { email: query.email.toLowerCase() },
            { phone: query.phone },
          ]
        } else if (query.email) {
          where.email = query.email.toLowerCase()
        } else if (query.phone) {
          where.phone = query.phone
        }

        const leads = await this.prisma.application_requests.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: query.limit || 25,
        })

        customers.push(
          ...leads.map(lead => ({
            id: lead.id,
            tenantId: query.tenantId, // ApplicationRequest doesn't have tenantId, use from query
            name: lead.name,
            email: lead.email,
            phone: lead.phone !== 'not_provided' ? lead.phone : null,
            type: 'lead' as const,
            status: lead.status,
          }))
        )
      }

      // Search ChatbotContact by phone or tenantId
      if (query.tenantId) {
        const contactWhere: Prisma.chatbotContactWhereInput = {
          tenantId: query.tenantId,
          type: 'CONTACT',
        }

        if (query.phone) {
          contactWhere.phone = query.phone
        }

        if (query.search) {
          contactWhere.OR = [
            { displayName: { contains: query.search, mode: 'insensitive' } },
            { phone: { contains: query.search, mode: 'insensitive' } },
          ]
        }

        const contacts = await this.prisma.chatbotContact.findMany({
          where: contactWhere,
          include: {
            chatbot_contact_members: {
              include: {
                chatbotPhoneUser: {
                  select: {
                    email: true,
                    phone: true,
                    displayName: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: query.limit || 25,
        })

        contacts.forEach(contact => {
          const memberEmails = contact.chatbot_contact_members
            .map(m => m.chatbotPhoneUser?.email)
            .filter(Boolean) as string[]

          customers.push({
            id: contact.id,
            tenantId: contact.tenantId,
            name: contact.displayName,
            email: memberEmails[0] || null,
            phone: contact.phone,
            type: 'contact' as const,
            status: null,
          })
        })
      }

      // Search ChatbotPhoneUser by phone or email (if tenantId provided)
      if ((query.phone || query.email) && query.tenantId) {
        const userWhere: Prisma.chatbotPhoneUserWhereInput = {
          tenantId: query.tenantId,
        }

        if (query.phone && query.email) {
          userWhere.OR = [
            { phone: query.phone },
            { normalizedPhone: query.phone },
            { email: query.email.toLowerCase() },
          ]
        } else if (query.phone) {
          userWhere.OR = [
            { phone: query.phone },
            { normalizedPhone: query.phone },
          ]
        } else if (query.email) {
          userWhere.email = query.email.toLowerCase()
        }

        const phoneUsers = await this.prisma.chatbotPhoneUser.findMany({
          where: userWhere,
          orderBy: { lastActiveAt: 'desc' },
          take: query.limit || 25,
        })

        phoneUsers.forEach(user => {
          // Only add if not already in customers list
          const exists = customers.some(
            c => (c.email && user.email && c.email === user.email) ||
              (c.phone && user.phone && c.phone === user.phone)
          )

          if (!exists) {
            customers.push({
              id: user.id,
              tenantId: user.tenantId,
              name: user.displayName || 'Cliente sin nombre',
              email: user.email || null,
              phone: user.phone,
              type: 'contact' as const,
              status: null,
            })
          }
        })
      }

      // Remove duplicates by email/phone combination
      const uniqueCustomers = Array.from(
        new Map(
          customers.map(c => [
            `${c.email || ''}_${c.phone || ''}`,
            c,
          ])
        ).values()
      )

      return uniqueCustomers.slice(0, query.limit || 25)
    } catch (error) {
      console.error('[CrmService] Error listing customers:', error)
      return []
    }
  }

  async createCustomer(data: {
    tenantId: string
    name: string
    email?: string | null
    phone?: string | null
    sessionId?: string | null
  }) {
    // If phone is provided, try to find existing customer first or create new one
    if (data.phone) {
      const contact = await this.prisma.chatbotContact.upsert({
        where: {
          tenantId_phone: {
            tenantId: data.tenantId,
            phone: data.phone,
          },
        },
        update: {
          // Update name only if the existing one is just the phone number
          displayName: data.name,
          metadata: data.email ? { email: data.email } : {},
        },
        create: {
          id: randomUUID(),
          tenantId: data.tenantId,
          displayName: data.name,
          phone: data.phone,
          type: 'CONTACT',
          metadata: data.email ? { email: data.email } : {},
          updatedAt: new Date(),
        },
      })

      return {
        id: contact.id,
        tenantId: contact.tenantId,
        name: contact.displayName,
        email: data.email || null,
        phone: contact.phone,
        type: 'contact' as const,
        status: null,
      }
    }

    // No phone provided, create new contact
    const contact = await this.prisma.chatbotContact.create({
      data: {
        id: randomUUID(),
        tenantId: data.tenantId,
        displayName: data.name,
        phone: null,
        type: 'CONTACT',
        metadata: data.email ? { email: data.email } : {},
        updatedAt: new Date(),
      },
    })

    return {
      id: contact.id,
      tenantId: contact.tenantId,
      name: contact.displayName,
      email: data.email || null,
      phone: contact.phone,
      type: 'contact' as const,
      status: null,
    }
  }

  async listTickets(query: {
    tenantId: string
    status?: string
    priority?: string
    type?: string
    assignedToId?: string
    customerId?: string
    search?: string
    limit?: number
    offset?: number
  }) {
    const where: any = {
      tenantId: query.tenantId,
    }

    if (query.status) {
      where.status = query.status
    }

    if (query.priority) {
      where.priority = query.priority
    }

    if (query.type) {
      where.type = query.type
    }

    if (query.assignedToId) {
      where.assignedToId = query.assignedToId
    }

    if (query.customerId) {
      where.customerId = query.customerId
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    const tickets = await this.prisma.tickets.findMany({
      where,
      include: {
        users_tickets_createdByIdTousers: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        users_tickets_assignedToIdTousers: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            ticket_comments: true,
            ticket_attachments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit || 100,
      skip: query.offset || 0,
    })

    return tickets.map(ticket => ({
      id: ticket.id,
      tenantId: ticket.tenantId,
      type: ticket.type,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      customerId: ticket.customerId,
      customerName: ticket.customerName,
      customerEmail: ticket.customerEmail,
      customerPhone: ticket.customerPhone,
      createdById: ticket.createdById,
      assignedToId: ticket.assignedToId,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      createdBy: ticket.users_tickets_createdByIdTousers,
      assignedTo: ticket.users_tickets_assignedToIdTousers,
      customer: ticket.customerId ? {
        id: ticket.customerId,
        name: ticket.customerName || null,
        email: ticket.customerEmail || null,
        phone: ticket.customerPhone || null,
      } : null,
      commentCount: ticket._count.ticket_comments,
      attachmentCount: ticket._count.ticket_attachments,
    }))
  }

  async getTicket(ticketId: string, tenantId: string) {
    const ticket = await this.prisma.tickets.findFirst({
      where: {
        id: ticketId,
        tenantId,
      },
      include: {
        users_tickets_createdByIdTousers: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        users_tickets_assignedToIdTousers: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        ticket_comments: {
          include: {
            users: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        ticket_attachments: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found for tenant ${tenantId}`)
    }

    return {
      id: ticket.id,
      tenantId: ticket.tenantId,
      type: ticket.type,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      customerId: ticket.customerId,
      customerName: ticket.customerName,
      customerEmail: ticket.customerEmail,
      customerPhone: ticket.customerPhone,
      createdById: ticket.createdById,
      assignedToId: ticket.assignedToId,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      createdBy: ticket.users_tickets_createdByIdTousers,
      assignedTo: ticket.users_tickets_assignedToIdTousers,
      customer: ticket.customerId ? {
        id: ticket.customerId,
        name: ticket.customerName || null,
        email: ticket.customerEmail || null,
        phone: ticket.customerPhone || null,
      } : null,
      comments: ticket.ticket_comments.map(comment => ({
        id: comment.id,
        ticketId: comment.ticketId,
        content: comment.content,
        authorId: comment.authorId,
        createdAt: comment.createdAt.toISOString(),
        author: comment.users,
      })),
      attachments: ticket.ticket_attachments.map(attachment => ({
        id: attachment.id,
        ticketId: attachment.ticketId,
        fileName: attachment.filename,
        fileUrl: attachment.url,
        fileSize: attachment.size,
        mimeType: attachment.mimeType,
        createdAt: attachment.createdAt.toISOString(),
      })),
    }
  }

  async createTicket(data: {
    tenantId: string
    type: string
    title: string
    description?: string
    priority?: string
    customerId?: string
    createdById?: string
    assignedToId?: string
  }) {
    // Fetch customer name if customerId is provided
    let customerName: string | null = null
    let customerEmail: string | null = null
    let customerPhone: string | null = null

    if (data.customerId) {
      const customer = await this.prisma.chatbotContact.findUnique({
        where: { id: data.customerId },
        select: { displayName: true, phone: true, metadata: true },
      })
      if (customer) {
        customerName = customer.displayName || 'Unknown'
        customerPhone = customer.phone || null
        // Try to get email from metadata
        const metadata = customer.metadata as Record<string, unknown> | null
        customerEmail = (metadata?.email as string) || null
      }
    }

    const ticket = await this.prisma.tickets.create({
      data: {
        id: randomUUID(),
        tenantId: data.tenantId,
        type: data.type as any,
        title: data.title,
        description: data.description || '',
        priority: (data.priority as any) || 'medium',
        status: 'open',
        customerId: data.customerId || '',
        customerName: customerName || 'Unknown Customer',
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        createdById: data.createdById || '',
        assignedToId: data.assignedToId || null,
        updatedAt: new Date(),
      },
      include: {
        users_tickets_createdByIdTousers: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        users_tickets_assignedToIdTousers: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    return {
      id: ticket.id,
      tenantId: ticket.tenantId,
      type: ticket.type,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      customerId: ticket.customerId,
      customerName: ticket.customerName,
      customerEmail: ticket.customerEmail,
      customerPhone: ticket.customerPhone,
      createdById: ticket.createdById,
      assignedToId: ticket.assignedToId,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      createdBy: ticket.users_tickets_createdByIdTousers,
      assignedTo: ticket.users_tickets_assignedToIdTousers,
      customer: ticket.customerId ? {
        id: ticket.customerId,
        name: ticket.customerName || null,
        email: ticket.customerEmail || null,
        phone: ticket.customerPhone || null,
      } : null,
      // Include empty arrays for newly created tickets
      comments: [],
      attachments: [],
    }
  }

  async updateTicket(data: {
    ticketId: string
    tenantId: string
    title?: string
    description?: string
    status?: string
    priority?: string
    assignedToId?: string
  }) {
    const ticket = await this.prisma.tickets.findFirst({
      where: {
        id: data.ticketId,
        tenantId: data.tenantId,
      },
    })

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${data.ticketId} not found for tenant ${data.tenantId}`)
    }

    await this.prisma.tickets.update({
      where: { id: data.ticketId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status && { status: data.status as any }),
        ...(data.priority && { priority: data.priority as any }),
        ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId || null }),
        updatedAt: new Date(),
      },
    })
  }

  async addTicketComment(data: {
    ticketId: string
    tenantId: string
    content: string
    createdById?: string
  }) {
    const ticket = await this.prisma.tickets.findFirst({
      where: {
        id: data.ticketId,
        tenantId: data.tenantId,
      },
    })

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${data.ticketId} not found for tenant ${data.tenantId}`)
    }

    await this.prisma.ticket_comments.create({
      data: {
        id: randomUUID(),
        tickets: { connect: { id: data.ticketId } },
        content: data.content,
        users: { connect: { id: data.createdById || '' } },
        updatedAt: new Date(),
      },
    })
  }

  async selectCustomer(data: {
    sessionId: string
    tenantId: string
    customerId: string
    customerType?: string | null
  }) {
    // Store selected customer in conversation state
    // This is a simple in-memory store for now
    // In a real implementation, you might want to persist this in the database
    console.log('[CrmService] Customer selected:', {
      sessionId: data.sessionId,
      tenantId: data.tenantId,
      customerId: data.customerId,
      customerType: data.customerType,
    })

    // For now, just return success
    // The actual state management happens in the Next.js layer
    return { success: true }
  }

  // ============================================================================
  // CRM TASKS
  // ============================================================================

  async listTasks(query: {
    tenantId: string
    contactId?: string
    completed?: boolean
    limit?: number
    offset?: number
  }) {
    const where: any = { tenantId: query.tenantId }
    if (query.contactId) where.contactId = query.contactId
    if (query.completed !== undefined) where.completed = query.completed

    const tasks = await this.prisma.crmTask.findMany({
      where,
      orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
      take: query.limit || 100,
      skip: query.offset || 0,
    })

    return tasks.map(t => ({
      id: t.id,
      tenantId: t.tenantId,
      contactId: t.contactId,
      title: t.title,
      description: t.description,
      dueDate: t.dueDate?.toISOString() || null,
      dueTime: t.dueTime,
      priority: t.priority,
      completed: t.completed,
      completedAt: t.completedAt?.toISOString() || null,
      reminder: t.reminder,
      type: t.type,
      clientName: t.clientName,
      note: t.note,
      createdById: t.createdById,
      assignedToId: t.assignedToId,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }))
  }

  async createTask(data: {
    tenantId: string
    contactId?: string
    title: string
    description?: string
    dueDate?: string
    dueTime?: string
    priority?: string
    reminder?: string
    type?: string
    clientName?: string
    note?: string
    createdById: string
    assignedToId?: string
  }) {
    const task = await this.prisma.crmTask.create({
      data: {
        id: randomUUID(),
        tenantId: data.tenantId,
        contactId: data.contactId || null,
        title: data.title,
        description: data.description || '',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        dueTime: data.dueTime || '',
        priority: (data.priority as any) || 'medium',
        reminder: data.reminder || '',
        type: (data.type as any) || 'general',
        clientName: data.clientName || '',
        note: data.note || '',
        createdById: data.createdById,
        assignedToId: data.assignedToId || null,
        updatedAt: new Date(),
      },
    })

    return {
      id: task.id,
      tenantId: task.tenantId,
      contactId: task.contactId,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate?.toISOString() || null,
      dueTime: task.dueTime,
      priority: task.priority,
      completed: task.completed,
      reminder: task.reminder,
      type: task.type,
      clientName: task.clientName,
      note: task.note,
      createdById: task.createdById,
      assignedToId: task.assignedToId,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }
  }

  async updateTask(data: {
    taskId: string
    tenantId: string
    title?: string
    description?: string
    dueDate?: string
    dueTime?: string
    priority?: string
    completed?: boolean
    reminder?: string
    assignedToId?: string
  }) {
    const task = await this.prisma.crmTask.findFirst({
      where: { id: data.taskId, tenantId: data.tenantId },
    })

    if (!task) {
      throw new NotFoundException(`Task with ID ${data.taskId} not found`)
    }

    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
    if (data.dueTime !== undefined) updateData.dueTime = data.dueTime
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.reminder !== undefined) updateData.reminder = data.reminder
    if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId || null
    if (data.completed !== undefined) {
      updateData.completed = data.completed
      updateData.completedAt = data.completed ? new Date() : null
    }

    await this.prisma.crmTask.update({
      where: { id: data.taskId },
      data: updateData,
    })

    return { success: true }
  }

  async deleteTask(taskId: string, tenantId: string) {
    const task = await this.prisma.crmTask.findFirst({
      where: { id: taskId, tenantId },
    })

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`)
    }

    await this.prisma.crmTask.delete({ where: { id: taskId } })
    return { success: true }
  }

  // ============================================================================
  // CRM APPOINTMENTS
  // ============================================================================

  async listAppointments(query: {
    tenantId: string
    contactId?: string
    status?: string
    fromDate?: string
    toDate?: string
    limit?: number
    offset?: number
  }) {
    const where: any = { tenantId: query.tenantId }
    if (query.contactId) where.contactId = query.contactId
    if (query.status) where.status = query.status
    if (query.fromDate || query.toDate) {
      where.date = {}
      if (query.fromDate) where.date.gte = new Date(query.fromDate)
      if (query.toDate) where.date.lte = new Date(query.toDate)
    }

    const appointments = await this.prisma.crmAppointment.findMany({
      where,
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      take: query.limit || 100,
      skip: query.offset || 0,
    })

    return appointments.map(a => ({
      id: a.id,
      tenantId: a.tenantId,
      contactId: a.contactId,
      title: a.title,
      clientName: a.clientName,
      date: a.date.toISOString(),
      time: a.time,
      duration: a.duration,
      type: a.type,
      status: a.status,
      notes: a.notes,
      createdById: a.createdById,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }))
  }

  async createAppointment(data: {
    tenantId: string
    contactId?: string
    title: string
    clientName?: string
    date: string
    time: string
    duration?: number
    type?: string
    status?: string
    notes?: string
    createdById: string
  }) {
    const appointment = await this.prisma.crmAppointment.create({
      data: {
        id: randomUUID(),
        tenantId: data.tenantId,
        contactId: data.contactId || null,
        title: data.title,
        clientName: data.clientName || null,
        date: new Date(data.date),
        time: data.time || '',
        duration: data.duration || 30,
        type: (data.type as any) || 'consultation',
        status: (data.status as any) || 'pending',
        notes: data.notes || '',
        createdById: data.createdById,
        updatedAt: new Date(),
      },
    })

    return {
      id: appointment.id,
      tenantId: appointment.tenantId,
      contactId: appointment.contactId,
      title: appointment.title,
      clientName: appointment.clientName,
      date: appointment.date.toISOString(),
      time: appointment.time,
      duration: appointment.duration,
      type: appointment.type,
      status: appointment.status,
      notes: appointment.notes,
      createdById: appointment.createdById,
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString(),
    }
  }

  async updateAppointment(data: {
    appointmentId: string
    tenantId: string
    title?: string
    clientName?: string
    date?: string
    time?: string
    duration?: number
    type?: string
    status?: string
    notes?: string
  }) {
    const appointment = await this.prisma.crmAppointment.findFirst({
      where: { id: data.appointmentId, tenantId: data.tenantId },
    })

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${data.appointmentId} not found`)
    }

    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.clientName !== undefined) updateData.clientName = data.clientName
    if (data.date !== undefined) updateData.date = new Date(data.date)
    if (data.time !== undefined) updateData.time = data.time
    if (data.duration !== undefined) updateData.duration = data.duration
    if (data.type !== undefined) updateData.type = data.type
    if (data.status !== undefined) updateData.status = data.status
    if (data.notes !== undefined) updateData.notes = data.notes

    await this.prisma.crmAppointment.update({
      where: { id: data.appointmentId },
      data: updateData,
    })

    return { success: true }
  }

  async deleteAppointment(appointmentId: string, tenantId: string) {
    const appointment = await this.prisma.crmAppointment.findFirst({
      where: { id: appointmentId, tenantId },
    })

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${appointmentId} not found`)
    }

    await this.prisma.crmAppointment.delete({ where: { id: appointmentId } })
    return { success: true }
  }

  // ============================================================================
  // CRM ACTIVITIES
  // ============================================================================

  async listActivities(query: {
    tenantId: string
    contactId?: string
    type?: string
    limit?: number
    offset?: number
  }) {
    const where: any = { tenantId: query.tenantId }
    if (query.contactId) where.contactId = query.contactId
    if (query.type) where.type = query.type

    const activities = await this.prisma.crmActivity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit || 50,
      skip: query.offset || 0,
    })

    return activities.map(a => ({
      id: a.id,
      tenantId: a.tenantId,
      contactId: a.contactId,
      type: a.type,
      text: a.text,
      detail: a.detail,
      metadata: a.metadata,
      createdById: a.createdById,
      createdAt: a.createdAt.toISOString(),
    }))
  }

  async createActivity(data: {
    tenantId: string
    contactId?: string
    type: string
    text: string
    detail?: string
    metadata?: any
    createdById?: string
  }) {
    const activity = await this.prisma.crmActivity.create({
      data: {
        id: randomUUID(),
        tenantId: data.tenantId,
        contactId: data.contactId || null,
        type: data.type as any,
        text: data.text || '',
        detail: data.detail || '',
        metadata: data.metadata || {},
        createdById: data.createdById || null,
      },
    })

    return {
      id: activity.id,
      tenantId: activity.tenantId,
      contactId: activity.contactId,
      type: activity.type,
      text: activity.text,
      detail: activity.detail,
      metadata: activity.metadata,
      createdById: activity.createdById,
      createdAt: activity.createdAt.toISOString(),
    }
  }

  // ============================================================================
  // CRM SESSION SUMMARIES
  // ============================================================================

  async listSessionSummaries(query: {
    tenantId: string
    contactId?: string
    limit?: number
    offset?: number
  }) {
    const where: any = { tenantId: query.tenantId }
    if (query.contactId) where.contactId = query.contactId

    const summaries = await this.prisma.crmSessionSummary.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit || 20,
      skip: query.offset || 0,
    })

    return summaries.map(s => ({
      id: s.id,
      tenantId: s.tenantId,
      contactId: s.contactId,
      clientName: s.clientName,
      date: s.date.toISOString(),
      duration: s.duration,
      summary: s.summary,
      topics: s.topics,
      sentiment: s.sentiment,
      nextActions: s.nextActions,
      aiInsights: s.aiInsights,
      followUpDate: s.followUpDate?.toISOString() || null,
      followUpTime: s.followUpTime,
      followUpNote: s.followUpNote,
      createdById: s.createdById,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }))
  }

  async createSessionSummary(data: {
    tenantId: string
    contactId?: string
    clientName?: string
    date: string
    duration?: string
    summary: string
    topics?: string[]
    sentiment?: string
    nextActions?: string[]
    aiInsights?: string
    followUpDate?: string
    followUpTime?: string
    followUpNote?: string
    createdById: string
  }) {
    const sessionSummary = await this.prisma.crmSessionSummary.create({
      data: {
        id: randomUUID(),
        tenantId: data.tenantId,
        contactId: data.contactId || null,
        clientName: data.clientName || null,
        date: new Date(data.date),
        duration: data.duration || '',
        summary: data.summary || '',
        topics: data.topics || [],
        sentiment: data.sentiment || 'neutral',
        nextActions: data.nextActions || [],
        aiInsights: data.aiInsights || '',
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        followUpTime: data.followUpTime || null,
        followUpNote: data.followUpNote || null,
        createdById: data.createdById,
        updatedAt: new Date(),
      },
    })

    return {
      id: sessionSummary.id,
      tenantId: sessionSummary.tenantId,
      contactId: sessionSummary.contactId,
      clientName: sessionSummary.clientName,
      date: sessionSummary.date.toISOString(),
      duration: sessionSummary.duration,
      summary: sessionSummary.summary,
      topics: sessionSummary.topics,
      sentiment: sessionSummary.sentiment,
      nextActions: sessionSummary.nextActions,
      aiInsights: sessionSummary.aiInsights,
      followUpDate: sessionSummary.followUpDate?.toISOString() || null,
      followUpTime: sessionSummary.followUpTime,
      followUpNote: sessionSummary.followUpNote,
      createdById: sessionSummary.createdById,
      createdAt: sessionSummary.createdAt.toISOString(),
      updatedAt: sessionSummary.updatedAt.toISOString(),
    }
  }
}
