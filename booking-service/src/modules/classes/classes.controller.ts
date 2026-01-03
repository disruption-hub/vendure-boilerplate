import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ClassesService } from './classes.service';

@Controller('classes')
export class ClassesController {
    constructor(private readonly classesService: ClassesService) { }

    @Get()
    findAll() {
        return this.classesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.classesService.findOne(id);
    }
}
