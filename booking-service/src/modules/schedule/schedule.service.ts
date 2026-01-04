import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/booking-client';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  createSession(data: Prisma.SessionCreateInput) {
    // Logic to validate buffers/conflicts could go here
    return this.prisma.session.create({ data });
  }

  findAllSessions(start?: string, end?: string) {
    const where: Prisma.SessionWhereInput = {};
    if (start && end) {
      where.startTime = {
        gte: new Date(start),
      };
      where.endTime = {
        lte: new Date(end),
      };
    }
    return this.prisma.session.findMany({
      where,
      include: {
        service: true,
        space: true,
        providers: { include: { provider: true } },
      },
    });
  }

  findOneSession(id: string) {
    return this.prisma.session.findUnique({
      where: { id },
      include: {
        service: true,
        space: true,
        providers: { include: { provider: true } },
      },
    });
  }

  updateSession(id: string, data: Prisma.SessionUpdateInput) {
    return this.prisma.session.update({
      where: { id },
      data,
    });
  }

  removeSession(id: string) {
    return this.prisma.session.delete({
      where: { id },
    });
  }
}
