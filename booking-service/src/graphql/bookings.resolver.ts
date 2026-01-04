import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BookingsService } from '../modules/bookings/bookings.service';
import { Booking, Session } from './types';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { PrismaService } from '../modules/prisma/prisma.service';
import { ScheduleService } from '../modules/schedule/schedule.service';

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
    @Context() context: any,
  ) {
    const req = context.req || context;
    return this.bookingsService.create(req.user.zkeyId, sessionId);
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
    @Args('serviceId') serviceId: string,
    @Args('startTime') startTime: Date,
    @Args('endTime') endTime: Date,
    @Args('maxCapacity', { type: () => Int }) maxCapacity: number,
    @Args('spaceId', { nullable: true }) spaceId?: string,
  ) {
    return this.scheduleService.createSession({
      service: { connect: { id: serviceId } },
      space: spaceId ? { connect: { id: spaceId } } : undefined,
      startTime,
      endTime,
      maxCapacity,
    });
  }

  @Mutation(() => Session)
  @UseGuards(JwtAuthGuard)
  async updateSession(
    @Args('id') id: string,
    @Args('serviceId', { nullable: true }) serviceId?: string,
    @Args('startTime', { nullable: true }) startTime?: Date,
    @Args('endTime', { nullable: true }) endTime?: Date,
    @Args('maxCapacity', { type: () => Int, nullable: true }) maxCapacity?: number,
    @Args('spaceId', { nullable: true }) spaceId?: string,
  ) {
    return this.scheduleService.updateSession(id, {
      service: serviceId ? { connect: { id: serviceId } } : undefined,
      space: spaceId ? { connect: { id: spaceId } } : undefined,
      startTime,
      endTime,
      maxCapacity,
    });
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteSession(@Args('id') id: string) {
    await this.scheduleService.removeSession(id);
    return true;
  }
}
