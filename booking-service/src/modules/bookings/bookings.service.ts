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
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                bookings: true,
                space: true,
            },
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        // 3. Check Capacity
        // Use session maxCapacity or fallback to space capacity if set, else default 20
        const capacity = session.maxCapacity;

        if (session.bookings.length >= capacity) {
            throw new BadRequestException('Session is full');
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
                        service: true,
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
                        service: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
}
