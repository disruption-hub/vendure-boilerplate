import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common'
import { InventoryService } from './inventory.service'
import { CreateLocationDto } from './dto/create-location.dto'
import { UpdateLocationDto } from './dto/update-location.dto'
import { AdjustStockDto } from './dto/adjust-stock.dto'
import { JwtAuthGuard } from '../../common/guards/auth.guard'
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator'

@Controller('catalog/inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
    constructor(private readonly service: InventoryService) { }

    // Locations
    @Post('locations')
    createLocation(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateLocationDto) {
        return this.service.createLocation(user.tenantId!, dto)
    }

    @Get('locations')
    findAllLocations(@CurrentUser() user: CurrentUserPayload) {
        return this.service.findAllLocations(user.tenantId!)
    }

    @Get('locations/:id')
    findOneLocation(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
        return this.service.findOneLocation(user.tenantId!, id)
    }

    @Put('locations/:id')
    updateLocation(
        @CurrentUser() user: CurrentUserPayload,
        @Param('id') id: string,
        @Body() dto: UpdateLocationDto,
    ) {
        return this.service.updateLocation(user.tenantId!, id, dto)
    }

    @Delete('locations/:id')
    removeLocation(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
        return this.service.removeLocation(user.tenantId!, id)
    }

    // Stock
    @Post('stock/adjust')
    adjustStock(@CurrentUser() user: CurrentUserPayload, @Body() dto: AdjustStockDto) {
        return this.service.adjustStock(user.tenantId!, user.userId!, dto)
    }

    @Get('stock/:productId')
    getStockLevels(@CurrentUser() user: CurrentUserPayload, @Param('productId') productId: string) {
        return this.service.getStockLevels(user.tenantId!, productId)
    }

    @Get('products')
    getAllProductsWithStock(@CurrentUser() user: CurrentUserPayload) {
        return this.service.getAllProductsWithStock(user.tenantId!)
    }

    @Get('movements')
    getStockMovements(
        @CurrentUser() user: CurrentUserPayload,
        @Query('productId') productId?: string,
        @Query('locationId') locationId?: string,
        @Query('limit') limit?: string,
    ) {
        return this.service.getStockMovements(user.tenantId!, {
            productId,
            locationId,
            limit: limit ? parseInt(limit, 10) : undefined,
        })
    }
}
