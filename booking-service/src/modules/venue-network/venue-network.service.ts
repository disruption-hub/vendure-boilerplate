import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VenueNetwork, Prisma } from '@prisma/booking-client';

@Injectable()
export class VenueNetworkService {
    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.VenueNetworkCreateInput): Promise<VenueNetwork> {
        return this.prisma.venueNetwork.create({
            data,
        });
    }

    async findAll(): Promise<VenueNetwork[]> {
        return this.prisma.venueNetwork.findMany({
            include: { venues: true },
        });
    }

    async findOne(id: string): Promise<VenueNetwork | null> {
        return this.prisma.venueNetwork.findUnique({
            where: { id },
            include: { venues: true },
        });
    }

    async update(id: string, data: Prisma.VenueNetworkUpdateInput): Promise<VenueNetwork> {
        return this.prisma.venueNetwork.update({
            where: { id },
            data,
        });
    }

    async delete(id: string): Promise<VenueNetwork> {
        return this.prisma.venueNetwork.delete({
            where: { id },
        });
    }
}
