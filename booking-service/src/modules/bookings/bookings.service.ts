import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) { }

  async create(
    userZkeyId: string,
    sessionId: string,
    options: {
      bookingType?: 'GENERAL' | 'SLOT_SPECIFIC' | 'ENTIRE_SPACE';
      bookableSlotId?: string;
      quantity?: number;
      accessMethod?: 'IN_PERSON' | 'VIRTUAL';
      virtualAccessInfo?: any;
    } = {},
  ) {
    const {
      bookingType = 'GENERAL',
      bookableSlotId,
      quantity = 1,
      accessMethod = 'IN_PERSON',
      virtualAccessInfo,
    } = options;

    return this.prisma.$transaction(async (tx) => {
      // 1. Find user
      const user = await tx.user.findUnique({
        where: { zkeyId: userZkeyId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // 2. Find Session
      const session = await tx.session.findUnique({
        where: { id: sessionId },
        include: {
          space: true,
          bookings: {
            where: { status: 'CONFIRMED' },
          },
        },
      });

      if (!session) {
        throw new NotFoundException('Session not found');
      }

      // 3. Mode Validation & Capacity Check
      let priceCharged = session.basePrice || 0;

      if (session.bookingMode === 'CAPACITY' || (session.bookingMode === 'HYBRID' && bookingType === 'GENERAL')) {
        if (session.availableCapacity !== null && session.availableCapacity < quantity) {
          throw new BadRequestException('Not enough capacity remaining');
        }
        // Update capacity
        await tx.session.update({
          where: { id: sessionId },
          data: { availableCapacity: { decrement: quantity } },
        });
      } else if (session.bookingMode === 'SLOT' || (session.bookingMode === 'HYBRID' && bookingType === 'SLOT_SPECIFIC')) {
        if (!bookableSlotId) {
          throw new BadRequestException('Slot selection required for this mode');
        }

        // Check if slot is already taken for THIS session
        const existingSlotBooking = await tx.booking.findFirst({
          where: {
            sessionId: sessionId,
            bookableSlotId: bookableSlotId,
            status: 'CONFIRMED',
          },
        });

        if (existingSlotBooking) {
          throw new BadRequestException('Slot is already reserved');
        }

        // Get Slot Details for pricing
        const slot = await tx.spaceSlot.findUnique({
          where: { id: bookableSlotId },
        });

        if (!slot || slot.spaceId !== session.spaceId) {
          throw new BadRequestException('Invalid slot for this space');
        }

        // Calculate price with modifier
        const baseSlotPrice = Number(session.slotPrice || 0);
        priceCharged = baseSlotPrice * Number(slot.pricingModifier);

        // Update slots count
        await tx.session.update({
          where: { id: sessionId },
          data: { availableSlots: { decrement: 1 } },
        });
      } else if (session.bookingMode === 'ENTIRE' || (session.bookingMode === 'HYBRID' && bookingType === 'ENTIRE_SPACE')) {
        if (session.entireSpaceBooked) {
          throw new BadRequestException('Space is already booked exclusively');
        }
        if (session.bookings.length > 0) {
          throw new BadRequestException('Space cannot be booked exclusively as there are existing bookings');
        }

        priceCharged = session.entireSpacePrice || 0;

        // Mark as booked
        await tx.session.update({
          where: { id: sessionId },
          data: { entireSpaceBooked: true },
        });
      }

      // 4. Create Booking
      return tx.booking.create({
        data: {
          userId: user.id,
          sessionId: session.id,
          bookingType,
          bookableSlotId,
          quantity,
          priceCharged,
          accessMethod,
          virtualAccessInfo,
          status: 'CONFIRMED',
        },
        include: {
          session: {
            include: {
              service: true,
              space: true,
            },
          },
          slot: true,
        },
      });
    });
  }

  async cancelBooking(userZkeyId: string, bookingId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Find Booking
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { user: true, session: true },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      // 2. Validate Ownership
      if (booking.user.zkeyId !== userZkeyId) {
        throw new BadRequestException('Not authorized to cancel this booking');
      }

      if (booking.status === 'CANCELLED') {
        return booking;
      }

      // 3. Restore Capacity/Slots
      if (booking.bookingType === 'GENERAL') {
        await tx.session.update({
          where: { id: booking.sessionId },
          data: { availableCapacity: { increment: booking.quantity } },
        });
      } else if (booking.bookingType === 'SLOT_SPECIFIC') {
        await tx.session.update({
          where: { id: booking.sessionId },
          data: { availableSlots: { increment: 1 } },
        });
      } else if (booking.bookingType === 'ENTIRE_SPACE') {
        await tx.session.update({
          where: { id: booking.sessionId },
          data: { entireSpaceBooked: false },
        });
      }

      // 4. Update Status
      return tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          cancellationReason: 'User requested cancellation',
        },
      });
    });
  }

  async findMyTeachingSessions(userZkeyId: string) {
    // 1. Find User
    const user = await this.prisma.user.findUnique({
      where: { zkeyId: userZkeyId },
    });

    if (!user) {
      return []; // User not synchronized in booking-service yet
    }

    // 2. Find Provider linked to this user
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { userId: user.id },
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
