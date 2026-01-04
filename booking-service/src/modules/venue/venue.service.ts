import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/booking-client';

@Injectable()
export class VenueService {
  constructor(private prisma: PrismaService) { }

  create(data: Prisma.VenueCreateInput) {
    return this.prisma.venue.create({ data });
  }

  findAll() {
    return this.prisma.venue.findMany({
      include: {
        spaces: true,
        networks: true,
        parent: true,
        children: true,
        profile: true
      },
    });
  }

  findOne(id: string) {
    return this.prisma.venue.findUnique({
      where: { id },
      include: {
        spaces: true,
        networks: true,
        parent: true,
        children: true,
        profile: true
      },
    });
  }

  update(id: string, data: Prisma.VenueUpdateInput) {
    return this.prisma.venue.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.venue.delete({
      where: { id },
    });
  }

  // Space Logic
  createSpace(venueId: string, data: Omit<Prisma.SpaceCreateInput, 'venue'>) {
    return this.prisma.space.create({
      data: {
        ...data,
        venue: { connect: { id: venueId } },
      },
    });
  }

  findSpaces(venueId: string) {
    return this.prisma.space.findMany({
      where: { venueId },
    });
  }

  updateSpace(id: string, data: Prisma.SpaceUpdateInput) {
    return this.prisma.space.update({
      where: { id },
      data,
    });
  }

  removeSpace(id: string) {
    return this.prisma.space.delete({
      where: { id },
    });
  }

  // Space Preset Logic
  createSpacePreset(data: Prisma.SpacePresetCreateInput) {
    return this.prisma.spacePreset.create({ data });
  }

  findAllSpacePresets() {
    return this.prisma.spacePreset.findMany();
  }

  removeSpacePreset(id: string) {
    return this.prisma.spacePreset.delete({
      where: { id },
    });
  }
}
