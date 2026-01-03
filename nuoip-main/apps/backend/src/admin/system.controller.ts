import { Controller, Get, UseGuards } from '@nestjs/common'
import { JwtAuthGuard, AdminGuard } from '../common/guards/auth.guard'
import { AdminSystemService, SystemHealthResponse, SystemStatsResponse } from './system.service'

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminSystemController {
  constructor(private readonly systemService: AdminSystemService) {}

  @Get('system-stats')
  async systemStats(): Promise<SystemStatsResponse> {
    return this.systemService.getSystemStats()
  }

  @Get('system-health')
  async systemHealth(): Promise<SystemHealthResponse> {
    return this.systemService.getSystemHealth()
  }
}
