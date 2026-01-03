import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export interface DeliveryMethod {
    id: string
    name: string
    description?: string
    priceCents: number
    currency: string
    isActive: boolean
    rules?: DeliveryPriceRule[]
}

export interface DeliveryPriceRule {
    id: string
    condition: string // 'MIN_TOTAL'
    value: number // cents
    priceCents: number // cents (override price)
}

export interface CreateDeliveryMethodPayload {
    tenantId: string
    name: string
    description?: string
    priceCents: number
    currency?: string
    isActive?: boolean
    rules?: {
        condition: string
        value: number
        priceCents: number
    }[]
}

@Injectable()
export class AdminDeliveryService {
    constructor(private readonly prisma: PrismaService) { }

    async getDeliveryMethods(tenantId: string) {
        return this.prisma.deliveryMethod.findMany({
            where: {
                tenantId
            },
            include: {
                deliveryPriceRules: true
            },
            orderBy: {
                createdAt: "desc"
            }
        })
    }

    async createDeliveryMethod(data: CreateDeliveryMethodPayload) {
        const { rules, ...methodData } = data
        return this.prisma.deliveryMethod.create({
            data: {
                ...methodData,
                currency: methodData.currency || 'USD',
                rules: {
                    create: rules,
                },
            },
            include: { deliveryPriceRules: true },
        })
    }

    async updateDeliveryMethod(id: string, data: Partial<CreateDeliveryMethodPayload>) {
        const { rules, ...methodData } = data

        // Update parent
        await this.prisma.deliveryMethod.update({
            where: { id },
            data: methodData,
        })

        // Basic rule replace strategy for simplicity (delete all, recreate all)
        if (rules) {
            await this.prisma.deliveryPriceRule.deleteMany({
                where: { deliveryMethodId: id },
            })
            if (rules.length > 0) {
                await this.prisma.deliveryPriceRule.createMany({
                    data: rules.map(r => ({ ...r, deliveryMethodId: id })),
                })
            }
        }

        return this.prisma.deliveryMethod.findUnique({
            where: { id },
            include: { deliveryPriceRules: true },
        })
    }

    async deleteDeliveryMethod(id: string) {
        return this.prisma.deliveryMethod.delete({
            where: { id },
        })
    }

    // Logic to find applicable delivery cost
    calculateDeliveryCost(method: DeliveryMethod, cartTotalCents: number): number {
        if (!method.isActive) return 0 // Should not happen if filtered correctly

        let cost = method.priceCents

        if (method.rules && method.rules.length > 0) {
            // Find matching rules. For now assume MIN_TOTAL is the only one.
            // We sort rules by value desc to find the "best" match (highest threshold met)
            const applicableRules = method.rules
                .filter(r => r.condition === 'MIN_TOTAL' && cartTotalCents >= r.value)
                .sort((a, b) => b.value - a.value)

            if (applicableRules.length > 0) {
                cost = applicableRules[0].priceCents
            }
        }

        return cost
    }
}
