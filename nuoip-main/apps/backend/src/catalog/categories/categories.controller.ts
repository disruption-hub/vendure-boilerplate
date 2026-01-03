import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common'
import { CatalogCategoriesService } from './categories.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
import { JwtAuthGuard, AdminGuard } from '../../common/guards/auth.guard'
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator'

@Controller('admin/catalog/categories')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminCatalogCategoriesController {
    constructor(private readonly service: CatalogCategoriesService) { }

    @Post()
    create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateCategoryDto) {
        return this.service.create(user.tenantId!, dto)
    }

    @Get()
    findAll(@CurrentUser() user: CurrentUserPayload) {
        return this.service.findAll(user.tenantId!)
    }

    @Get(':id')
    findOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
        return this.service.findOne(user.tenantId!, id)
    }

    @Put(':id')
    update(
        @CurrentUser() user: CurrentUserPayload,
        @Param('id') id: string,
        @Body() dto: UpdateCategoryDto,
    ) {
        return this.service.update(user.tenantId!, id, dto)
    }

    @Delete(':id')
    remove(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
        return this.service.remove(user.tenantId!, id)
    }
}
