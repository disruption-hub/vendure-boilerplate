import { Resolver, Query, Mutation, Args, Int, Context, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BookingsService } from '../modules/bookings/bookings.service';
import { Booking, Session, User } from './types';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { PrismaService } from '../modules/prisma/prisma.service';
import { ScheduleService } from '../modules/schedule/schedule.service';
import GraphQLJSON from 'graphql-type-json';
import { BookingMode, BookingType, AccessMethod } from './types';
import { GqlUser } from './decorators';

@Resolver(() => Booking)
export class BookingsResolver {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly prisma: PrismaService,
    private readonly scheduleService: ScheduleService,
  ) { }

  @Query(() => [Booking])
  @UseGuards(JwtAuthGuard)
  async myBookings(@Context() context: any) {
    const req = context.req || context;
    return this.bookingsService.findMyBookings(req.user.zkeyId);
  }

  @Mutation(() => Booking)
  @UseGuards(JwtAuthGuard)
  async createBooking(
    @Args('sessionId') sessionId: string,
    @Args('bookingType', { type: () => BookingType, nullable: true }) bookingType?: BookingType,
    @Args('bookableSlotId', { nullable: true }) bookableSlotId?: string,
    @Args('quantity', { type: () => Int, nullable: true }) quantity?: number,
    @Args('accessMethod', { type: () => AccessMethod, nullable: true }) accessMethod?: AccessMethod,
    @Args('virtualAccessInfo', { type: () => GraphQLJSON, nullable: true }) virtualAccessInfo?: any,
    @Context() context?: any,
  ) {
    const req = context.req || context;
    return this.bookingsService.create(req.user.zkeyId, sessionId, {
      bookingType,
      bookableSlotId,
      quantity,
      accessMethod,
      virtualAccessInfo,
    });
  }

  @Mutation(() => Booking)
  @UseGuards(JwtAuthGuard)
  async cancelBooking(
    @Args('id') id: string,
    @Context() context: any,
  ) {
    const req = context.req || context;
    return this.bookingsService.cancelBooking(req.user.zkeyId, id);
  }

  @Query(() => [Session])
  @UseGuards(JwtAuthGuard)
  async myTeachingSessions(@Context() context: any) {
    const req = context.req || context;
    return this.bookingsService.findMyTeachingSessions(req.user.zkeyId);
  }

  @Query(() => [Booking])
  async allBookings() {
    return this.bookingsService.findAllBookings();
  }

  @Query(() => [Session])
  async allSessions() {
    return this.scheduleService.findAllSessions();
  }

  @Query(() => Session, { nullable: true })
  async session(@Args('id') id: string) {
    return this.scheduleService.findOneSession(id);
  }

  @Mutation(() => Session)
  @UseGuards(JwtAuthGuard)
  async createSession(
    @GqlUser() user: any,
    @Args('serviceId') serviceId: string,
    @Args('startTime') startTime: Date,
    @Args('endTime') endTime: Date,
    @Args('maxCapacity', { type: () => Int }) maxCapacity: number,
    @Args('spaceId', { nullable: true }) spaceId?: string,
    @Args('bookingMode', { type: () => BookingMode, nullable: true }) bookingMode?: BookingMode,
    @Args('availableCapacity', { type: () => Int, nullable: true }) availableCapacity?: number,
    @Args('totalSlots', { type: () => Int, nullable: true }) totalSlots?: number,
    @Args('availableSlots', { type: () => Int, nullable: true }) availableSlots?: number,
    @Args('basePrice', { nullable: true }) basePrice?: number,
    @Args('slotPrice', { nullable: true }) slotPrice?: number,
    @Args('allowEntireSpaceBooking', { nullable: true }) allowEntireSpaceBooking?: boolean,
    @Args('entireSpacePrice', { nullable: true }) entireSpacePrice?: number,
    @Args('virtualPlatform', { nullable: true }) virtualPlatform?: string,
    @Args('virtualAccessDetails', { type: () => GraphQLJSON, nullable: true }) virtualAccessDetails?: any,
  ) {
    if (!user.roles.some((r: string) => ['system-admin', 'booking-admin', 'admin'].includes(r))) {
      throw new Error('Forbidden: Admin access required');
    }
    return this.scheduleService.createSession({
      service: { connect: { id: serviceId } },
      space: spaceId ? { connect: { id: spaceId } } : undefined,
      startTime,
      endTime,
      maxCapacity,
      bookingMode,
      availableCapacity: availableCapacity ?? maxCapacity,
      totalSlots: totalSlots ?? 0,
      availableSlots: availableSlots ?? (totalSlots ?? 0),
      basePrice,
      slotPrice,
      allowEntireSpaceBooking: allowEntireSpaceBooking ?? false,
      entireSpacePrice,
      virtualPlatform,
      virtualAccessDetails,
    });
  }

  @Mutation(() => Session)
  @UseGuards(JwtAuthGuard)
  async updateSession(
    @GqlUser() user: any,
    @Args('id') id: string,
    @Args('serviceId', { nullable: true }) serviceId?: string,
    @Args('startTime', { nullable: true }) startTime?: Date,
    @Args('endTime', { nullable: true }) endTime?: Date,
    @Args('maxCapacity', { type: () => Int, nullable: true }) maxCapacity?: number,
    @Args('spaceId', { nullable: true }) spaceId?: string,
    @Args('bookingMode', { type: () => BookingMode, nullable: true }) bookingMode?: BookingMode,
    @Args('availableCapacity', { type: () => Int, nullable: true }) availableCapacity?: number,
    @Args('totalSlots', { type: () => Int, nullable: true }) totalSlots?: number,
    @Args('availableSlots', { type: () => Int, nullable: true }) availableSlots?: number,
    @Args('basePrice', { nullable: true }) basePrice?: number,
    @Args('slotPrice', { nullable: true }) slotPrice?: number,
    @Args('allowEntireSpaceBooking', { nullable: true }) allowEntireSpaceBooking?: boolean,
    @Args('entireSpaceBooked', { nullable: true }) entireSpaceBooked?: boolean,
    @Args('entireSpacePrice', { nullable: true }) entireSpacePrice?: number,
    @Args('virtualPlatform', { nullable: true }) virtualPlatform?: string,
    @Args('virtualAccessDetails', { type: () => GraphQLJSON, nullable: true }) virtualAccessDetails?: any,
  ) {
    if (!user.roles.some((r: string) => ['system-admin', 'booking-admin', 'admin'].includes(r))) {
      throw new Error('Forbidden: Admin access required');
    }
    return this.scheduleService.updateSession(id, {
      service: serviceId ? { connect: { id: serviceId } } : undefined,
      space: spaceId ? { connect: { id: spaceId } } : undefined,
      startTime,
      endTime,
      maxCapacity,
      bookingMode,
      availableCapacity,
      totalSlots,
      availableSlots,
      basePrice,
      slotPrice,
      allowEntireSpaceBooking,
      entireSpaceBooked,
      entireSpacePrice,
      virtualPlatform,
      virtualAccessDetails,
    });
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteSession(
    @GqlUser() user: any,
    @Args('id') id: string
  ) {
    if (!user.roles.some((r: string) => ['system-admin', 'booking-admin', 'admin'].includes(r))) {
      throw new Error('Forbidden: Admin access required');
    }
    await this.scheduleService.removeSession(id);
    return true;
  }

  @ResolveField(() => User, { nullable: true })
  async user(@Parent() booking: any) {
    if (!booking.userId) return null;
    return this.prisma.user.findUnique({
      where: { id: booking.userId },
    });
  }
}
