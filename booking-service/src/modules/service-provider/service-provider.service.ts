import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/booking-client';

@Injectable()
export class ServiceProviderService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.ServiceProviderCreateInput) {
    return this.prisma.serviceProvider.create({ data });
  }

  findAll() {
    return this.prisma.serviceProvider.findMany({
      include: { user: true, services: true },
    });
  }

  findOne(id: string) {
    return this.prisma.serviceProvider.findUnique({
      where: { id },
      include: { user: true, services: true },
    });
  }

  update(id: string, data: Prisma.ServiceProviderUpdateInput) {
    return this.prisma.serviceProvider.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.serviceProvider.delete({
      where: { id },
    });
  }
}
