import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/booking-client';

@Injectable()
export class ServiceService {
    constructor(private prisma: PrismaService) { }

    create(data: Prisma.ServiceCreateInput) {
        return this.prisma.service.create({ data });
    }

    findAll() {
        return this.prisma.service.findMany({
            include: { category: true, provider: true },
        });
    }

    findOne(id: string) {
        return this.prisma.service.findUnique({
            where: { id },
            include: { category: true, provider: true },
        });
    }

    update(id: string, data: Prisma.ServiceUpdateInput) {
        return this.prisma.service.update({
            where: { id },
            data,
        });
    }

    remove(id: string) {
        return this.prisma.service.delete({
            where: { id },
        });
    }

    // Category Logic
    createCategory(data: Prisma.ServiceCategoryCreateInput) {
        return this.prisma.serviceCategory.create({ data });
    }

    findAllCategories() {
        return this.prisma.serviceCategory.findMany({
            include: { services: true },
        });
    }
}
