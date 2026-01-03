import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'

import { nanoid } from 'nanoid'

@Injectable()
export class CatalogCategoriesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(tenantId: string, dto: CreateCategoryDto) {
        if (dto.parentId) {
            const parent = await this.prisma.catalogCategory.findUnique({
                where: { id: dto.parentId },
            })
            if (!parent || parent.tenantId !== tenantId) {
                throw new NotFoundException('Parent category not found')
            }
        }

        return this.prisma.catalogCategory.create({
            data: {
                ...dto,
                id: nanoid(),
                tenantId,
                updatedAt: new Date(),
            },
        })
    }

    async findAll(tenantId: string) {
        // Fetch flat list, frontend can rebuild hierarchy or we can build it here
        // For now, return all sorted by name
        return this.prisma.catalogCategory.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { paymentProducts: true, children: true },
                },
            },
        })
    }

    async findOne(tenantId: string, id: string) {
        const category = await this.prisma.catalogCategory.findUnique({
            where: { id },
            include: {
                children: true,
                parent: true,
            },
        })

        if (!category || category.tenantId !== tenantId) {
            throw new NotFoundException('Category not found')
        }

        return category
    }

    async update(tenantId: string, id: string, dto: UpdateCategoryDto) {
        // Verify existence
        await this.findOne(tenantId, id)

        if (dto.parentId) {
            // Prevent circular dependency (basic check: parent cannot be self)
            if (dto.parentId === id) {
                throw new Error('Category cannot be its own parent')
            }
            const parent = await this.prisma.catalogCategory.findUnique({
                where: { id: dto.parentId },
            })
            if (!parent || parent.tenantId !== tenantId) {
                throw new NotFoundException('Parent category not found')
            }
        }

        return this.prisma.catalogCategory.update({
            where: { id },
            data: {
                ...dto,
                updatedAt: new Date(),
            },
        })
    }

    async remove(tenantId: string, id: string) {
        // Verify existence
        await this.findOne(tenantId, id)

        // Check for blocking conditions? (e.g. products, children)
        // Prisma `onDelete: SetNull` for parent handles children.
        // For products, we manually check or let relation handle it if we added one (we didn't set cascade).
        // Let's safe check products.
        const productCount = await this.prisma.paymentProduct.count({
            where: { categoryId: id },
        })

        if (productCount > 0) {
            // Option: Detach or Error? Let's Error for safety in MVP
            throw new Error('Cannot delete category with associated products')
        }

        return this.prisma.catalogCategory.delete({
            where: { id },
        })
    }
}
