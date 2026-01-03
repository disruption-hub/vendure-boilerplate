import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ServiceProviderService } from './service-provider.service';
import { Prisma } from '@prisma/booking-client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('service-providers')
@UseGuards(JwtAuthGuard)
export class ServiceProviderController {
    constructor(private readonly serviceProviderService: ServiceProviderService) { }

    @Post()
    create(@Body() createProviderDto: Prisma.ServiceProviderCreateInput) {
        return this.serviceProviderService.create(createProviderDto);
    }

    @Get()
    findAll() {
        return this.serviceProviderService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.serviceProviderService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateProviderDto: Prisma.ServiceProviderUpdateInput) {
        return this.serviceProviderService.update(id, updateProviderDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.serviceProviderService.remove(id);
    }
}
