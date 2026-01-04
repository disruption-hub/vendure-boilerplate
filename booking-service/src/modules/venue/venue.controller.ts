import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { VenueService } from './venue.service';
import { Prisma } from '@prisma/booking-client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('venues')
@UseGuards(JwtAuthGuard)
export class VenueController {
  constructor(private readonly venueService: VenueService) {}

  @Post()
  create(@Body() createVenueDto: Prisma.VenueCreateInput) {
    return this.venueService.create(createVenueDto);
  }

  @Get()
  findAll() {
    return this.venueService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.venueService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateVenueDto: Prisma.VenueUpdateInput,
  ) {
    return this.venueService.update(id, updateVenueDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.venueService.remove(id);
  }

  // Spaces
  @Post(':id/spaces')
  createSpace(
    @Param('id') venueId: string,
    @Body() createSpaceDto: Omit<Prisma.SpaceCreateInput, 'venue'>,
  ) {
    return this.venueService.createSpace(venueId, createSpaceDto);
  }

  @Get(':id/spaces')
  findSpaces(@Param('id') venueId: string) {
    return this.venueService.findSpaces(venueId);
  }
}
