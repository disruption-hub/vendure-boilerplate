import { Body, Controller, Delete, Get, Post, Put, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard, AdminGuard } from '../common/guards/auth.guard'
import { AdminDepartmentsService } from './departments.service'

@Controller('admin/departments')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminDepartmentsController {
  constructor(private readonly departmentsService: AdminDepartmentsService) {}

  @Get()
  async getDepartments(@Query('tenantId') tenantId?: string): Promise<{ success: boolean; departments: any[] }> {
    if (!tenantId) {
      return { success: true, departments: [] }
    }
    return this.departmentsService.getTenantDepartments(tenantId)
  }

  @Post()
  async createDepartment(@Body() payload: { tenantId: string; name: string; description?: string; isDefault?: boolean }): Promise<{ success: boolean; department: any }> {
    return this.departmentsService.createDepartment(payload)
  }

  @Put()
  async updateDepartment(@Body() payload: { id: string; tenantId: string; name?: string; description?: string; isDefault?: boolean }): Promise<{ success: boolean; department: any }> {
    return this.departmentsService.updateDepartment(payload)
  }

  @Delete()
  async deleteDepartment(@Body() payload: { id: string; tenantId: string }): Promise<{ success: boolean }> {
    return this.departmentsService.deleteDepartment(payload)
  }
}

