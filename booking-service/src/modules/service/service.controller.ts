import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ServiceService } from './service.service';
import { Prisma } from '@prisma/booking-client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('services')
@UseGuards(JwtAuthGuard)
export class ServiceController {
    constructor(private readonly serviceService: ServiceService) { }

    // Categories
    @Post('categories')
    createCategory(@Body() createCategoryDto: Prisma.ServiceCategoryCreateInput) {
        return this.serviceService.createCategory(createCategoryDto);
    }

    @Get('categories')
    findAllCategories() {
        return this.serviceService.findAllCategories();
    }

    // Services
    @Post()
    create(@Body() createServiceDto: Prisma.ServiceCreateInput) {
        return this.serviceService.create(createServiceDto);
    }

    @Get()
    findAll() {
        return this.serviceService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.serviceService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateServiceDto: Prisma.ServiceUpdateInput) {
        return this.serviceService.update(id, updateServiceDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.serviceService.remove(id);
    }
}
