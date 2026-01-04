import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async create(userZkeyId: string, sessionId: string) {
    // 1. Find user in Booking DB (synced from ZKey)
    const user = await this.prisma.user.findUnique({
      where: { zkeyId: userZkeyId },
    });

    if (!user) {
      throw new NotFoundException(
        'User not found. Ensure registration sync is working.',
      );
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

  async cancelBooking(userZkeyId: string, bookingId: string) {
    // 1. Find Booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // 2. Validate Ownership (or Admin - for now just Owner)
    if (booking.user.zkeyId !== userZkeyId) {
      // TODO: Allow Admins too
      throw new BadRequestException('Not authorized to cancel this booking');
    }

    // 3. Update Status
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancellationReason: 'User requested cancellation',
      },
    });
  }

  async findMyTeachingSessions(userZkeyId: string) {
    // 1. Find Provider linked to this user
    const provider = await this.prisma.serviceProvider.findUnique({
      where: {
        userId: (
          await this.prisma.user.findUnique({ where: { zkeyId: userZkeyId } })
        )?.id,
      },
    });

    if (!provider) {
      return []; // Not a provider
    }

    // 2. Find Sessions where this provider is listed
    return this.prisma.session.findMany({
      where: {
        providers: {
          some: { providerId: provider.id },
        },
      },
      include: {
        bookings: {
          include: { user: true }, // See who booked
        },
        space: true,
        service: true,
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findAllBookings() {
    return this.prisma.booking.findMany({
      include: {
        user: true,
        session: {
          include: {
            service: true,
            space: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
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
