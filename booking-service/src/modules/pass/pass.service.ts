import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/booking-client';

@Injectable()
export class PassService {
  constructor(private prisma: PrismaService) {}

  // Templates
  createTemplate(data: Prisma.PassTemplateCreateInput) {
    return this.prisma.passTemplate.create({ data });
  }

  findAllTemplates() {
    return this.prisma.passTemplate.findMany({
      include: { validForCategories: true },
    });
  }

  // User Passes
  createPass(data: Prisma.PassCreateInput) {
    return this.prisma.pass.create({ data });
  }

  findUserPasses(userId: string) {
    return this.prisma.pass.findMany({
      where: { userId },
      include: { template: true },
    });
  }

  findOne(id: string) {
    return this.prisma.pass.findUnique({
      where: { id },
      include: { template: true, user: true },
    });
  }
}
