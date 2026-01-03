import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard, AdminGuard } from '../common/guards/auth.guard'
import {
  AdminPaymentReportsService,
  PaymentReportSummary,
} from './payment-reports.service'

@Controller('admin/payments/reports')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminPaymentReportsController {
  constructor(private readonly paymentReportsService: AdminPaymentReportsService) {}

  @Get()
  async getReports(
    @Query('tenantId') tenantId?: string,
    @Query('limit') limit?: string,
    @Query('days') days?: string,
  ): Promise<{ success: boolean; summary: PaymentReportSummary }> {
    const summary = await this.paymentReportsService.getReports({
      tenantId,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
      days: days ? Number.parseInt(days, 10) : undefined,
    })
    return { success: true, summary }
  }
}

