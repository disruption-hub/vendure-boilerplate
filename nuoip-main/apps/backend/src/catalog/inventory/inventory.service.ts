import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateLocationDto } from './dto/create-location.dto'
import { UpdateLocationDto } from './dto/update-location.dto'
import { AdjustStockDto } from './dto/adjust-stock.dto'
import { randomUUID } from 'crypto'

@Injectable()
export class InventoryService {
    constructor(private readonly prisma: PrismaService) { }

    // Locations
    async createLocation(tenantId: string, dto: CreateLocationDto) {
        if (dto.isDefault) {
            // Unset other defaults if this one is default
            await this.prisma.stockLocation.updateMany({
                where: { tenantId, isDefault: true },
                data: { isDefault: false },
            })
        }

        return this.prisma.stockLocation.create({
            data: {
                ...dto,
                id: randomUUID(),
                updatedAt: new Date(),
                tenantId,
            },
            include: {
                _count: { select: { stockEntries: true } }
            }
        })
    }

    async findAllLocations(tenantId: string) {
        return this.prisma.stockLocation.findMany({
            where: { tenantId },
            orderBy: { isDefault: 'desc' },
            include: {
                _count: { select: { stockEntries: true } }
            }
        })
    }

    async findOneLocation(tenantId: string, id: string) {
        const location = await this.prisma.stockLocation.findUnique({
            where: { id },
            include: {
                _count: { select: { stockEntries: true } }
            }
        })

        if (!location || location.tenantId !== tenantId) {
            throw new NotFoundException('Stock location not found')
        }

        return location
    }

    async updateLocation(tenantId: string, id: string, dto: UpdateLocationDto) {
        await this.findOneLocation(tenantId, id)

        if (dto.isDefault) {
            await this.prisma.stockLocation.updateMany({
                where: { tenantId, isDefault: true, id: { not: id } },
                data: { isDefault: false },
            })
        }

        return this.prisma.stockLocation.update({
            where: { id },
            data: dto,
        })
    }

    async removeLocation(tenantId: string, id: string) {
        // Check if stocks exist? 
        // Prisma cascade delete is set on StockEntry -> Location, so it will wipe stock entries.
        // For safety, maybe block if stocks > 0? For now, allow cascade.
        await this.findOneLocation(tenantId, id)

        return this.prisma.stockLocation.delete({
            where: { id },
        })
    }

    // Stock
    async adjustStock(tenantId: string, performedById: string, dto: AdjustStockDto) {
        // Verify product and location ownership
        const product = await this.prisma.paymentProduct.findFirst({
            where: { id: dto.productId }
        })

        // Verify location belongs to tenant
        await this.findOneLocation(tenantId, dto.locationId)

        // Get existing stock entry if it exists
        const existing = await this.prisma.stockEntry.findUnique({
            where: {
                productId_locationId: {
                    productId: dto.productId,
                    locationId: dto.locationId,
                },
            },
        })

        // Calculate new values - start with existing values or defaults
        const currentQuantity = existing?.quantity ?? 0
        const currentReserved = existing?.reserved ?? 0

        let newQuantity = currentQuantity
        let newReserved = currentReserved

        // If quantityChange is provided, adjust quantity
        if (dto.quantityChange !== undefined) {
            newQuantity = currentQuantity + dto.quantityChange
        } else if (dto.quantity !== undefined) {
            newQuantity = dto.quantity
        }

        // If reservedChange is provided, adjust reserved
        if (dto.reservedChange !== undefined) {
            newReserved = currentReserved + dto.reservedChange
        }

        // Ensure quantity is not negative
        newQuantity = Math.max(0, newQuantity)

        // Ensure reserved doesn't exceed quantity and is not negative
        newReserved = Math.max(0, Math.min(newReserved, newQuantity))

        // Update or create stock entry
        let result
        if (existing) {
            // Update existing
            result = await this.prisma.stockEntry.update({
                where: { id: existing.id },
                data: {
                    quantity: newQuantity,
                    reserved: newReserved,
                    isUnlimited: dto.isUnlimited ?? existing.isUnlimited,
                    updatedAt: new Date(),
                },
                include: {
                    stockLocation: true,
                },
            })
        } else {
            // Create new
            result = await this.prisma.stockEntry.create({
                data: {
                    id: randomUUID(),
                    tenantId,
                    paymentProduct: { connect: { id: dto.productId } },
                    stockLocation: { connect: { id: dto.locationId } },
                    quantity: newQuantity,
                    reserved: newReserved,
                    isUnlimited: dto.isUnlimited ?? false,
                    updatedAt: new Date(),
                },
                include: {
                    stockLocation: true,
                },
            })
        }

        // Create stock movement record for audit trail
        const quantityChange = dto.quantityChange ?? (newQuantity - currentQuantity)
        const reservedChange = dto.reservedChange ?? (newReserved - currentReserved)

        // Only create movement if there's an actual change
        if (quantityChange !== 0 || reservedChange !== 0) {
            await this.prisma.stockMovement.create({
                data: {
                    id: randomUUID(),
                    tenantId,
                    paymentProduct: { connect: { id: dto.productId } },
                    locationStock: { connect: { id: dto.locationId } },
                    type: 'ADJUSTMENT',
                    quantityChange,
                    reservedChange: reservedChange || 0,
                    quantityBefore: currentQuantity,
                    quantityAfter: newQuantity,
                    reservedBefore: currentReserved,
                    reservedAfter: newReserved,
                    reason: dto.reason,
                    performedById,
                },
            })
        }

        // Log for debugging
        console.log('[InventoryService] Stock adjusted:', {
            productId: dto.productId,
            locationId: dto.locationId,
            quantityChange,
            reservedChange,
            before: { quantity: currentQuantity, reserved: currentReserved },
            after: { quantity: result.quantity, reserved: result.reserved },
        })

        return result
    }

    async getStockLevels(tenantId: string, productId: string) {
        return this.prisma.stockEntry.findMany({
            where: { tenantId, productId },
            include: {
                stockLocation: true,
            },
        })
    }

    async getAllProductsWithStock(tenantId: string) {
        // Now that PaymentProduct has tenantId, we can filter directly
        // Get all products for this tenant, including their stock entries
        const productsWithStock = await this.prisma.paymentProduct.findMany({
            where: {
                tenantId: tenantId,
            },
            include: {
                stockEntries: {
                    where: { tenantId },
                    include: {
                        stockLocation: true,
                    },
                },
                catalogCategory: true,
            },
            orderBy: {
                name: 'asc',
            },
        })

        // Transform stockEntries to stocks for frontend compatibility
        return productsWithStock.map(product => ({
            ...product,
            stocks: product.stockEntries.map(entry => ({
                id: entry.id,
                productId: entry.productId,
                locationId: entry.locationId,
                quantity: entry.quantity,
                reserved: entry.reserved,
                isUnlimited: entry.isUnlimited,
                tenantId: entry.tenantId,
                location: entry.stockLocation,
            })),
        }))
    }

    async getStockMovements(tenantId: string, filters?: { productId?: string; locationId?: string; limit?: number }) {
        const where: any = { tenantId }
        if (filters?.productId) {
            where.productId = filters.productId
        }
        if (filters?.locationId) {
            where.locationId = filters.locationId
        }

        const movements = await this.prisma.stockMovement.findMany({
            where,
            include: {
                paymentProduct: {
                    select: {
                        id: true,
                        name: true,
                        productCode: true,
                    },
                },
                locationStock: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                fromStockLocation: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                toStockLocation: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: filters?.limit || 100,
        })

        return movements.map(m => ({
            ...m,
            product: m.paymentProduct,
            location: m.locationStock,
            fromLocation: m.fromStockLocation,
            toLocation: m.toStockLocation,
        }))
    }
}
