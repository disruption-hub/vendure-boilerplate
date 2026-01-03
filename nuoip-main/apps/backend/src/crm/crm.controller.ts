import { Controller, Get, Post, Put, Patch, Body, Param, Query, Headers, UseGuards, BadRequestException } from '@nestjs/common'
import { JwtAuthGuard, AdminGuard, Public } from '../common/guards/auth.guard'
import { CrmService } from './crm.service'
import { ChatOtpService } from '../auth/services/chat-otp.service'
import { AdminSystemSettingsService } from '../admin/system-settings.service'

@Controller('crm')
export class CrmController {
  constructor(
    private readonly crmService: CrmService,
    private readonly chatOtpService: ChatOtpService,
    private readonly systemSettingsService: AdminSystemSettingsService,
  ) { }

  private resolveToken(queryToken?: string, authHeader?: string): string {
    if (queryToken) {
      return queryToken
    }
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7)
    }
    return ''
  }

  private async resolveTenantId(token?: string, authHeader?: string, queryTenantId?: string): Promise<string | null> {
    // If tenantId is provided in query, use it
    if (queryTenantId) {
      return queryTenantId
    }

    // Try to get tenantId from session token
    if (token || authHeader) {
      const resolvedToken = this.resolveToken(token, authHeader)
      if (resolvedToken) {
        try {
          const sessionData = await this.chatOtpService.loadSession(resolvedToken, false)
          return sessionData.user?.tenantId || null
        } catch (error) {
          // Session token invalid, will fall through to require admin auth
        }
      }
    }

    return null
  }

  @Get('system/openrouter')
  async getOpenRouterConfig() {
    const config = await this.systemSettingsService.getOpenRouterSettings()
    return {
      exists: config !== null,
      config: config ? {
        // Only return necessary fields, maybe mask key if needed but for backend-to-backend calls it's fine
        apiKey: config.apiKey,
        baseUrl: config.baseUrl
      } : null
    }
  }

  @Get('tickets')
  @Public()
  async listTickets(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('type') type?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('customerId') customerId?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('token') token?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    // Try to resolve tenantId from session token or use provided one
    const resolvedTenantId = await this.resolveTenantId(token, authHeader, tenantId)

    if (!resolvedTenantId) {
      // If no tenantId and no valid session, require admin auth
      // This will be handled by the guard if JWT is present
      throw new BadRequestException({ error: 'tenantId is required or a valid session token must be provided' })
    }

    const tickets = await this.crmService.listTickets({
      tenantId: resolvedTenantId,
      status: status as any,
      priority: priority as any,
      type: type as any,
      assignedToId,
      customerId,
      search,
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0,
    })

    return { tickets }
  }

  @Get('tickets/:id')
  @Public()
  async getTicket(
    @Param('id') ticketId: string,
    @Query('tenantId') tenantId?: string,
    @Query('token') token?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const resolvedTenantId = await this.resolveTenantId(token, authHeader, tenantId)

    if (!resolvedTenantId) {
      throw new BadRequestException({ error: 'tenantId is required or a valid session token must be provided' })
    }

    const ticket = await this.crmService.getTicket(ticketId, resolvedTenantId)
    return { ticket }
  }

  @Post('tickets')
  @Public()
  async createTicket(
    @Body() body: any,
    @Query('token') token?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const resolvedTenantId = await this.resolveTenantId(token, authHeader, body.tenantId)

    if (!resolvedTenantId) {
      throw new BadRequestException({ error: 'tenantId is required or a valid session token must be provided' })
    }

    const ticket = await this.crmService.createTicket({
      ...body,
      tenantId: resolvedTenantId,
    })

    return { ticket }
  }

  @Put('tickets/:id')
  @Patch('tickets/:id')
  @Public()
  async updateTicket(
    @Param('id') ticketId: string,
    @Body() body: any,
    @Query('token') token?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const resolvedTenantId = await this.resolveTenantId(token, authHeader, body.tenantId)

    if (!resolvedTenantId) {
      throw new BadRequestException({ error: 'tenantId is required or a valid session token must be provided' })
    }

    await this.crmService.updateTicket({
      ...body,
      ticketId,
      tenantId: resolvedTenantId,
    })

    return { success: true }
  }

  @Post('tickets/:id/comments')
  @Public()
  async addTicketComment(
    @Param('id') ticketId: string,
    @Body() body: any,
    @Query('token') token?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const resolvedTenantId = await this.resolveTenantId(token, authHeader, body.tenantId)

    if (!resolvedTenantId) {
      throw new BadRequestException({ error: 'tenantId is required or a valid session token must be provided' })
    }

    await this.crmService.addTicketComment({
      ...body,
      ticketId,
      tenantId: resolvedTenantId,
    })

    return { success: true }
  }

  @Post('customers')
  @Public()
  async listCustomers(
    @Body() body: { tenantId?: string; phone?: string | null; email?: string | null; search?: string | null; limit?: number },
    @Query('token') token?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const resolvedTenantId = await this.resolveTenantId(token, authHeader, body.tenantId)

    if (!resolvedTenantId) {
      throw new BadRequestException({ error: 'tenantId is required or a valid session token must be provided' })
    }

    const customers = await this.crmService.listCustomers({
      tenantId: resolvedTenantId,
      phone: body.phone ?? null,
      email: body.email ?? null,
      search: body.search ?? null,
      limit: body.limit ?? 25,
    })

    return { success: true, customers }
  }

  @Post('customers/create')
  @Public()
  async createCustomer(
    @Body() body: {
      tenantId?: string
      name: string
      email?: string | null
      phone?: string | null
      sessionId?: string | null
    },
    @Query('token') token?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const resolvedTenantId = await this.resolveTenantId(token, authHeader, body.tenantId)

    if (!resolvedTenantId) {
      throw new BadRequestException({ error: 'tenantId is required or a valid session token must be provided' })
    }

    if (!body.name) {
      throw new BadRequestException({ error: 'name is required' })
    }

    const customer = await this.crmService.createCustomer({
      tenantId: resolvedTenantId,
      name: body.name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      sessionId: body.sessionId ?? null,
    })

    return { success: true, customer }
  }

  @Post('select-customer')
  @Public()
  async selectCustomer(
    @Body() body: {
      sessionId: string
      tenantId?: string
      customerId: string
      customerType?: string | null
    },
    @Query('token') token?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const resolvedTenantId = await this.resolveTenantId(token, authHeader, body.tenantId)

    if (!resolvedTenantId) {
      throw new BadRequestException({ error: 'tenantId is required or a valid session token must be provided' })
    }

    if (!body.sessionId || !body.customerId) {
      throw new BadRequestException({ error: 'sessionId and customerId are required' })
    }

    await this.crmService.selectCustomer({
      sessionId: body.sessionId,
      tenantId: resolvedTenantId,
      customerId: body.customerId,
      customerType: body.customerType ?? null,
    })

    return { success: true, message: 'Customer selected successfully' }
  }

  // ============================================================================
  // CRM TASKS
  // ============================================================================

  @Get('tasks')
  @Public()
  async listTasks(
    @Query('tenantId') tenantId?: string,
    @Query('contactId') contactId?: string,
    @Query('completed') completed?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('token') token?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const resolvedTenantId = await this.resolveTenantId(token, authHeader, tenantId)
    if (!resolvedTenantId) {
      throw new BadRequestException({ error: 'tenantId is required or a valid session token must be provided' })
    }

    const tasks = await this.crmService.listTasks({
      tenantId: resolvedTenantId,
      contactId,
      completed: completed !== undefined ? completed === 'true' : undefined,
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0,
    })

    return { tasks }
  }

  @Post('tasks')
  @Public()
  async createTask(
    @Body() body: any,
    @Query('token') token?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const resolvedTenantId = await this.resolveTenantId(token, authHeader, body.tenantId)
    if (!resolvedTenantId) {
      throw new BadRequestException({ error: 'tenantId is required or a valid session token must be provided' })
    }

    if (!body.title || !body.createdById) {
      throw new BadRequestException({ error: 'title and createdById are required' })
    }

    const task = await this.crmService.createTask({
      ...body,
      tenantId: resolvedTenantId,
    })

    return { task }
  }

  @Put('tasks/:id')
  @Public()
  async updateTask(
    @Param('id') taskId: string,
    @Body() body: any,
    @Query('token') token?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const resolvedTenantId = await this.resolveTenantId(token, authHeader, body.tenantId)
    if (!resolvedTenantId) {
      throw new BadRequestException({ error: 'tenantId is required or a valid session token must be provided' })
    }

    await this.crmService.updateTask({
      ...body,
      taskId,
      tenantId: resolvedTenantId,
    })

    return { success: true }
  }

  @Put('tasks/:id/toggle')
  @Public()
  async toggleTask(
    @Param('id') taskId: string,
    @Body() body: { completed: boolean; tenantId?: string },
    @Query('token') token?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const resolvedTenantId = await this.resolveTenantId(token, authHeader, body.tenantId)
    if (!resolvedTenantId) {
      throw new BadRequestException({ error: 'tenantId is required or a valid session token must be provided' })
    }

    await this.crmService.updateTask({
      taskId,
      tenantId: resolvedTenantId,
      completed: body.completed,
    })

    return { success: true }
  }

  // ============================================================================
  // CRM APPOINTMENTS
  // ============================================================================

  @Get('appointments')
  @Public()
  async listAppointments(
    @Query('tenantId') tenantId?: string,
    @Query('contactId') contactId?: string,
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('token') token?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const resolvedTenantId = await this.resolveTenantId(token, authHeader, tenantId)
    if (!resolvedTenantId) {
      throw new BadRequestException({ error: 'tenantId is required or a valid session token must be provided' })
    }

    const appointments = await this.crmService.listAppointments({
      tenantId: resolvedTenantId,
      contactId,
      status,
      fromDate,
      toDate,
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0,
    })

    return { appointments }
  }

  @Post('appointments')
  @Public()
  async createAppointment(
    @Body() body: any,
    @Query('token') token?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const resolvedTenantId = await this.resolveTenantId(token, authHeader, body.tenantId)
    if (!resolvedTenantId) {
      throw new BadRequestException({ error: 'tenantId is required or a valid session token must be provided' })
    }

    if (!body.title || !body.date || !body.time || !body.createdById) {
      throw new BadRequestException({ error: 'title, date, time, and createdById are required' })
    }

    const appointment = await this.crmService.createAppointment({
      ...body,
      tenantId: resolvedTenantId,
    })

    return { appointment }
  }

  @Put('appointments/:id')
  @Public()
  async updateAppointment(
    @Param('id') appointmentId: string,
    @Body() body: any,
    @Query('token') token?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const resolvedTenantId = await this.resolveTenantId(token, authHeader, body.tenantId)
    if (!resolvedTenantId) {
      throw new BadRequestException({ error: 'tenantId is required or a valid session token must be provided' })
    }

    await this.crmService.updateAppointment({
      ...body,
      appointmentId,
      tenantId: resolvedTenantId,
    })

    return { success: true }
  }

  // ============================================================================
  // CRM ACTIVITIES
  // ============================================================================

  @Get('activities')
  @Public()
  async listActivities(
    @Query('tenantId') tenantId?: string,
    @Query('contactId') contactId?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('token') token?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const resolvedTenantId = await this.resolveTenantId(token, authHeader, tenantId)
    if (!resolvedTenantId) {
      throw new BadRequestException({ error: 'tenantId is required or a valid session token must be provided' })
    }

    const activities = await this.crmService.listActivities({
      tenantId: resolvedTenantId,
      contactId,
      type,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    })

    return { activities }
  }

  @Post('activities')
  @Public()
  async createActivity(
    @Body() body: any,
    @Query('token') token?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const resolvedTenantId = await this.resolveTenantId(token, authHeader, body.tenantId)
    if (!resolvedTenantId) {
      throw new BadRequestException({ error: 'tenantId is required or a valid session token must be provided' })
    }

    if (!body.type || !body.text) {
      throw new BadRequestException({ error: 'type and text are required' })
    }

    const activity = await this.crmService.createActivity({
      ...body,
      tenantId: resolvedTenantId,
    })

    return { activity }
  }

  // ============================================================================
  // CRM SESSION SUMMARIES
  // ============================================================================

  @Get('session-summaries')
  @Public()
  async listSessionSummaries(
    @Query('tenantId') tenantId?: string,
    @Query('contactId') contactId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('token') token?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const resolvedTenantId = await this.resolveTenantId(token, authHeader, tenantId)
    if (!resolvedTenantId) {
      throw new BadRequestException({ error: 'tenantId is required or a valid session token must be provided' })
    }

    const summaries = await this.crmService.listSessionSummaries({
      tenantId: resolvedTenantId,
      contactId,
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    })

    return { summaries }
  }

  @Post('session-summaries')
  @Public()
  async createSessionSummary(
    @Body() body: any,
    @Query('token') token?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const resolvedTenantId = await this.resolveTenantId(token, authHeader, body.tenantId)
    if (!resolvedTenantId) {
      throw new BadRequestException({ error: 'tenantId is required or a valid session token must be provided' })
    }

    if (!body.date || !body.summary || !body.createdById) {
      throw new BadRequestException({ error: 'date, summary, and createdById are required' })
    }

    const sessionSummary = await this.crmService.createSessionSummary({
      ...body,
      tenantId: resolvedTenantId,
    })

    return { sessionSummary }
  }
}
