import { Controller, Get, UseGuards } from '@nestjs/common'
import { JwtAuthGuard, AdminGuard } from '../common/guards/auth.guard'
import { AdminMemoryService, MemoryDetailsResponse } from './memory.service'

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminMemoryController {
  constructor(private readonly memoryService: AdminMemoryService) {}

  @Get('memory')
  async getMemoryDetails(): Promise<MemoryDetailsResponse> {
    return this.memoryService.getMemoryDetails()
  }
}

