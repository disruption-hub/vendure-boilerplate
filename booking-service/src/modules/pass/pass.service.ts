import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/booking-client';

@Injectable()
export class PassService {
  constructor(private prisma: PrismaService) { }

  // Templates
  createTemplate(data: Prisma.PassTemplateCreateInput) {
    return this.prisma.passTemplate.create({ data });
  }

  findAllTemplates() {
    return this.prisma.passTemplate.findMany({
      include: { validForCategories: true },
    });
  }

  findOneTemplate(id: string) {
    return this.prisma.passTemplate.findUnique({
      where: { id },
      include: { validForCategories: true },
    });
  }

  updateTemplate(id: string, data: Prisma.PassTemplateUpdateInput) {
    return this.prisma.passTemplate.update({
      where: { id },
      data,
    });
  }

  removeTemplate(id: string) {
    return this.prisma.passTemplate.delete({
      where: { id },
    });
  }

  // User Passes
  createPass(data: Prisma.PassCreateInput) {
    return this.prisma.pass.create({ data });
  }

  findUserPasses(zkeyId: string) {
    return this.prisma.pass.findMany({
      where: { user: { zkeyId } },
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
