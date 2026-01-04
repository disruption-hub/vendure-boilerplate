import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { Prisma } from '@prisma/booking-client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('schedules')
@UseGuards(JwtAuthGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post('sessions')
  createSession(@Body() createSessionDto: Prisma.SessionCreateInput) {
    return this.scheduleService.createSession(createSessionDto);
  }

  @Get('sessions')
  findAllSessions(@Query('start') start?: string, @Query('end') end?: string) {
    return this.scheduleService.findAllSessions(start, end);
  }

  @Get('sessions/:id')
  findOneSession(@Param('id') id: string) {
    return this.scheduleService.findOneSession(id);
  }

  @Patch('sessions/:id')
  updateSession(
    @Param('id') id: string,
    @Body() updateSessionDto: Prisma.SessionUpdateInput,
  ) {
    return this.scheduleService.updateSession(id, updateSessionDto);
  }

  @Delete('sessions/:id')
  removeSession(@Param('id') id: string) {
    return this.scheduleService.removeSession(id);
  }
}
