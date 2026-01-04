import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingProfile, Prisma } from '@prisma/booking-client';

@Injectable()
export class BookingProfileService {
    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.BookingProfileCreateInput): Promise<BookingProfile> {
        return this.prisma.bookingProfile.create({
            data,
        });
    }

    async findAll(): Promise<BookingProfile[]> {
        return this.prisma.bookingProfile.findMany();
    }

    async findOne(id: string): Promise<BookingProfile | null> {
        return this.prisma.bookingProfile.findUnique({
            where: { id },
        });
    }

    async update(id: string, data: Prisma.BookingProfileUpdateInput): Promise<BookingProfile> {
        return this.prisma.bookingProfile.update({
            where: { id },
            data,
        });
    }

    async remove(id: string): Promise<BookingProfile> {
        return this.prisma.bookingProfile.delete({
            where: { id },
        });
    }
}
