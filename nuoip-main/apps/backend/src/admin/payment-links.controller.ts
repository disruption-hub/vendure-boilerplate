import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import { HybridAdminGuard } from '../common/guards/hybrid-auth.guard'
import {
  AdminPaymentLinksService,
  PaymentLinkResponse,
  PaymentLinkPayload,
  PaymentLinkUpdatePayload,
} from './payment-links.service'

@Controller('admin/payments/links')
@UseGuards(HybridAdminGuard)
export class AdminPaymentLinksController {
  constructor(private readonly paymentLinksService: AdminPaymentLinksService) { }

  @Get()
  async getLinks(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ): Promise<{ success: boolean; links: PaymentLinkResponse[] }> {
    const links = await this.paymentLinksService.getLinks({
      tenantId,
      status,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
    })
    return { success: true, links }
  }

  @Get(':id')
  async getLink(@Param('id') id: string): Promise<{ success: boolean; link: PaymentLinkResponse }> {
    const link = await this.paymentLinksService.getLinkById(id)
    return { success: true, link }
  }

  @Post()
  async createLink(@Body() payload: PaymentLinkPayload): Promise<{ success: boolean; link: PaymentLinkResponse }> {
    const link = await this.paymentLinksService.createLink(payload)
    return { success: true, link }
  }

  @Patch(':id')
  async updateLink(
    @Param('id') id: string,
    @Body() payload: PaymentLinkUpdatePayload,
  ): Promise<{ success: boolean; link: PaymentLinkResponse }> {
    if (!payload.status) {
      throw new Error('Status is required for update')
    }
    const link = await this.paymentLinksService.updateLinkStatus(id, payload.status)
    return { success: true, link }
  }

  @Delete(':id')
  async deleteLink(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.paymentLinksService.deleteLink(id)
    return { success: true }
  }
}

