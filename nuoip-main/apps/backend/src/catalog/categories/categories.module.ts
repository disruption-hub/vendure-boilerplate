import { Module } from '@nestjs/common'
import { CatalogCategoriesService } from './categories.service'
import { AdminCatalogCategoriesController } from './categories.controller'
import { PrismaService } from '../../prisma/prisma.service'

@Module({
    controllers: [AdminCatalogCategoriesController],
    providers: [CatalogCategoriesService, PrismaService],
    exports: [CatalogCategoriesService],
})
export class CatalogCategoriesModule { }
