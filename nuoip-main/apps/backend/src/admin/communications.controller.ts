import { Controller, Get, UseGuards } from '@nestjs/common'
import { JwtAuthGuard, AdminGuard } from '../common/guards/auth.guard'
import { AdminCommunicationsService } from './communications.service'

interface CommunicationConfig {
  id: number
  tenantId: string | null
  name: string
  provider: string
  channel: string
  config: any
  isActive: boolean
  createdAt: string
  updatedAt: string
}

@Controller('admin/communications')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminCommunicationsController {
  constructor(private readonly communicationsService: AdminCommunicationsService) {}

  @Get()
  async getCommunications(): Promise<CommunicationConfig[]> {
    return this.communicationsService.getCommunications()
  }
}
