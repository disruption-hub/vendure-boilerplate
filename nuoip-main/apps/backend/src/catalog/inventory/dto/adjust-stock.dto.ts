import { IsInt, IsNotEmpty, IsString, Min, IsBoolean, IsOptional } from 'class-validator'

export class AdjustStockDto {
    @IsNotEmpty()
    @IsString()
    productId: string

    @IsNotEmpty()
    @IsString()
    locationId: string

    @IsOptional()
    @IsInt()
    quantityChange?: number

    @IsOptional()
    @IsInt()
    reservedChange?: number

    @IsOptional()
    @IsInt()
    @Min(0)
    quantity?: number

    @IsOptional()
    @IsBoolean()
    isUnlimited?: boolean

    @IsOptional()
    @IsString()
    reason?: string
}
