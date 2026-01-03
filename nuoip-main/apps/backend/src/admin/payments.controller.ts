import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common'
import { JwtAuthGuard, AdminGuard } from '../common/guards/auth.guard'
import { HybridAdminGuard } from '../common/guards/hybrid-auth.guard'
import {
  AdminPaymentsService,
  PaymentProductResponse,
  PaymentTaxResponse,
  PaymentProductPayload,
  PaymentTaxPayload,
} from './payments.service'

@Controller('admin/payments')
// @UseGuards(JwtAuthGuard, AdminGuard) <- REMOVED class-level guard to allow HybridAdminGuard on specific routes
export class AdminPaymentsController {
  constructor(private readonly paymentsService: AdminPaymentsService) { }

  // Payment Products
  @Get('products')
  @UseGuards(HybridAdminGuard)  // Allow both JWT and chat session tokens
  async getProducts(@Request() req: any): Promise<{ success: boolean; products: PaymentProductResponse[] }> {
    const tenantId = req.user.tenantId
    console.log(`[AdminPaymentsController] getProducts - User: ${req.user.email}, Role: ${req.user.role}, Tenant: ${tenantId}`)

    if (!tenantId) {
      console.warn(`[AdminPaymentsController] ⚠️ TenantID is missing for user ${req.user.email}`)
    }

    const products = await this.paymentsService.getProducts(tenantId)
    console.log(`[AdminPaymentsController] Found ${products.length} products for tenant ${tenantId}`)

    return { success: true, products }
  }

  @Get('products/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getProduct(@Param('id') id: string): Promise<{ success: boolean; product: PaymentProductResponse }> {
    const product = await this.paymentsService.getProductById(id)
    return { success: true, product }
  }

  @Post('products')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createProduct(
    @Body() payload: PaymentProductPayload,
    @Request() req: any
  ): Promise<{ success: boolean; product: PaymentProductResponse }> {
    const tenantId = req.user.tenantId
    const product = await this.paymentsService.createProduct(tenantId, payload)
    return { success: true, product }
  }

  @Put('products/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateProduct(
    @Param('id') id: string,
    @Body() payload: Partial<PaymentProductPayload>
  ): Promise<{ success: boolean; product: PaymentProductResponse }> {
    const product = await this.paymentsService.updateProduct(id, payload)
    return { success: true, product }
  }

  @Delete('products/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async deleteProduct(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.paymentsService.deleteProduct(id)
    return { success: true }
  }

  // AI Description Generation
  @Post('products/generate-description')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async generateDescription(
    @Body() body: { productName: string }
  ): Promise<{ success: boolean; description: string | null }> {
    const description = await this.paymentsService.generateProductDescription(body.productName)
    return { success: true, description }
  }

  // Payment Taxes
  @Get('taxes')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getTaxes(): Promise<{ success: boolean; taxes: PaymentTaxResponse[] }> {
    const taxes = await this.paymentsService.getTaxes()
    return { success: true, taxes }
  }

  @Get('taxes/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getTax(@Param('id') id: string): Promise<{ success: boolean; tax: PaymentTaxResponse }> {
    const tax = await this.paymentsService.getTaxById(id)
    return { success: true, tax }
  }

  @Post('taxes')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createTax(@Body() payload: PaymentTaxPayload): Promise<{ success: boolean; tax: PaymentTaxResponse }> {
    const tax = await this.paymentsService.createTax(payload)
    return { success: true, tax }
  }

  @Put('taxes/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateTax(
    @Param('id') id: string,
    @Body() payload: Partial<PaymentTaxPayload>
  ): Promise<{ success: boolean; tax: PaymentTaxResponse }> {
    const tax = await this.paymentsService.updateTax(id, payload)
    return { success: true, tax }
  }

  @Delete('taxes/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async deleteTax(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.paymentsService.deleteTax(id)
    return { success: true }
  }
}

