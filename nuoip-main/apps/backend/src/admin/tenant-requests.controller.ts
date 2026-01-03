import { Body, Controller, Get, Param, Put, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard, AdminGuard } from '../common/guards/auth.guard'
import { UpdateTenantRequestDto } from './dto/update-tenant-request.dto'
import { AdminTenantRequestsService, TenantRequestSummary } from './tenant-requests.service'

@Controller('admin/tenant-requests')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminTenantRequestsController {
  constructor(private readonly tenantRequestsService: AdminTenantRequestsService) {}

  @Get()
  async listTenantRequests(@Query('status') status?: string): Promise<TenantRequestSummary[]> {
    return this.tenantRequestsService.listTenantRequests(status)
  }

  @Put(':id')
  async updateTenantRequest(
    @Param('id') requestId: string,
    @Body() payload: UpdateTenantRequestDto,
  ): Promise<TenantRequestSummary> {
    return this.tenantRequestsService.updateTenantRequest(requestId, payload)
  }
}

