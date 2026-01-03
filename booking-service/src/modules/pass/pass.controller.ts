import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PassService } from './pass.service';
import { Prisma } from '@prisma/booking-client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('passes')
@UseGuards(JwtAuthGuard)
export class PassController {
    constructor(private readonly passService: PassService) { }

    // Pass Templates
    @Post('templates')
    createTemplate(@Body() createTemplateDto: Prisma.PassTemplateCreateInput) {
        return this.passService.createTemplate(createTemplateDto);
    }

    @Get('templates')
    findAllTemplates() {
        return this.passService.findAllTemplates();
    }

    // User Passes
    @Post()
    createPass(@Body() createPassDto: Prisma.PassCreateInput) {
        return this.passService.createPass(createPassDto);
    }

    @Get('user/:userId')
    findUserPasses(@Param('userId') userId: string) {
        return this.passService.findUserPasses(userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.passService.findOne(id);
    }
}
