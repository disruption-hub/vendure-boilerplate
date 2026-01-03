import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { CatalogItemType } from '@prisma/client'

export class CreateCategoryDto {
    @IsNotEmpty()
    @IsString()
    name: string

    @IsOptional()
    @IsString()
    description?: string

    @IsEnum(CatalogItemType)
    @IsOptional()
    type?: CatalogItemType = CatalogItemType.PRODUCT

    @IsOptional()
    @IsString()
    parentId?: string

    @IsOptional()
    metadata?: any
}
