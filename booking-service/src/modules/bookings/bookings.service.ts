import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingsService {
    constructor(private prisma: PrismaService) { }

    async create(userZkeyId: string, sessionId: string) {
        // 1. Find user in Booking DB (synced from ZKey)
        const user = await this.prisma.user.findUnique({
            where: { zkeyId: userZkeyId },
        });

        if (!user) {
            throw new NotFoundException('User not found. Ensure registration sync is working.');
        }

        // 2. Find Session
        const session = await this.prisma.classSession.findUnique({
            where: { id: sessionId },
            include: {
                bookings: true,
            },
        });

        if (!session) {
            throw new NotFoundException('Class session not found');
        }

        // 3. Check Capacity
        if (session.bookings.length >= session.capacity) {
            throw new BadRequestException('Class is full');
        }

        // 4. Create Booking
        return this.prisma.booking.create({
            data: {
                userId: user.id, // Use internal ID
                sessionId: session.id,
                status: 'CONFIRMED',
            },
            include: {
                session: {
                    include: {
                        classType: true,
                    },
                },
            },
        });
    }

    async findMyBookings(userZkeyId: string) {
        const user = await this.prisma.user.findUnique({
            where: { zkeyId: userZkeyId },
        });

        if (!user) return [];

        return this.prisma.booking.findMany({
            where: { userId: user.id },
            include: {
                session: {
                    include: {
                        classType: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
}
