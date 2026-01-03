import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard, AdminGuard } from '../common/guards/auth.guard'
import {
  AdminScheduleService,
  CreateScheduleTemplateDto,
  UpdateScheduleTemplateDto,
} from './schedule.service'

@Controller('admin/schedule')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminScheduleController {
  constructor(private readonly scheduleService: AdminScheduleService) {}

  @Get()
  async getScheduleTemplates(@Query('tenantId') tenantId?: string) {
    const templates = await this.scheduleService.getScheduleTemplates(tenantId)
    return {
      success: true,
      data: templates.map((template) => ({
        ...template,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
        slots: template.slots.map((slot) => ({
          ...slot,
          createdAt: slot.createdAt.toISOString(),
          updatedAt: slot.updatedAt.toISOString(),
        })),
        exceptions: template.exceptions.map((exception) => ({
          ...exception,
          date: exception.date.toISOString(),
          createdAt: exception.createdAt.toISOString(),
          updatedAt: exception.updatedAt.toISOString(),
        })),
      })),
    }
  }

  @Get(':id')
  async getScheduleTemplateById(@Param('id') id: string) {
    const template = await this.scheduleService.getScheduleTemplateById(id)
    return {
      success: true,
      data: {
        ...template,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
        slots: template.slots.map((slot) => ({
          ...slot,
          createdAt: slot.createdAt.toISOString(),
          updatedAt: slot.updatedAt.toISOString(),
        })),
        exceptions: template.exceptions.map((exception) => ({
          ...exception,
          date: exception.date.toISOString(),
          createdAt: exception.createdAt.toISOString(),
          updatedAt: exception.updatedAt.toISOString(),
        })),
      },
    }
  }

  @Post()
  async createScheduleTemplate(@Body() payload: CreateScheduleTemplateDto) {
    const template = await this.scheduleService.createScheduleTemplate(payload)
    return {
      success: true,
      data: {
        ...template,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
        slots: template.slots.map((slot) => ({
          ...slot,
          createdAt: slot.createdAt.toISOString(),
          updatedAt: slot.updatedAt.toISOString(),
        })),
        exceptions: template.exceptions.map((exception) => ({
          ...exception,
          date: exception.date.toISOString(),
          createdAt: exception.createdAt.toISOString(),
          updatedAt: exception.updatedAt.toISOString(),
        })),
      },
    }
  }

  @Put(':id')
  async updateScheduleTemplate(
    @Param('id') id: string,
    @Body() payload: UpdateScheduleTemplateDto,
  ) {
    const template = await this.scheduleService.updateScheduleTemplate(id, payload)
    return {
      success: true,
      data: {
        ...template,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
        slots: template.slots.map((slot) => ({
          ...slot,
          createdAt: slot.createdAt.toISOString(),
          updatedAt: slot.updatedAt.toISOString(),
        })),
        exceptions: template.exceptions.map((exception) => ({
          ...exception,
          date: exception.date.toISOString(),
          createdAt: exception.createdAt.toISOString(),
          updatedAt: exception.updatedAt.toISOString(),
        })),
      },
    }
  }

  @Delete(':id')
  async deleteScheduleTemplate(@Param('id') id: string) {
    await this.scheduleService.deleteScheduleTemplate(id)
    return {
      success: true,
    }
  }
}

