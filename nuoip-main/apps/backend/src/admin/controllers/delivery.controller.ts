import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common'
import { AuthenticatedRequest, HybridAdminGuard } from '../../common/guards/hybrid-auth.guard'
import { AdminDeliveryService } from '../delivery.service'

@Controller('admin/delivery')
@UseGuards(HybridAdminGuard)
export class DeliveryController {
  constructor(private readonly deliveryService: AdminDeliveryService) {}

  @Get('methods')
  async getMethods(@Req() req: AuthenticatedRequest) {
    const tenantId = req.user.tenantId
    return this.deliveryService.getDeliveryMethods(tenantId)
  }

  @Post('methods')
  async createMethod(@Req() req: AuthenticatedRequest, @Body() body: any) {
    const tenantId = req.user.tenantId
    return this.deliveryService.createDeliveryMethod({ ...body, tenantId })
  }

  @Patch('methods/:id')
  async updateMethod(@Param('id') id: string, @Body() body: any) {
    return this.deliveryService.updateDeliveryMethod(id, body)
  }

  @Delete('methods/:id')
  async deleteMethod(@Param('id') id: string) {
    return this.deliveryService.deleteDeliveryMethod(id)
  }
}
