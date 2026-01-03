import { IsBoolean, IsOptional, IsString } from 'class-validator'

export class UpdateLocationDto {
    @IsOptional()
    @IsString()
    name?: string

    @IsOptional()
    @IsString()
    description?: string

    @IsOptional()
    @IsString()
    address?: string

    @IsOptional()
    @IsBoolean()
    isDefault?: boolean

    @IsOptional()
    @IsBoolean()
    isActive?: boolean

    @IsOptional()
    @IsString()
    type?: 'PHYSICAL' | 'DIGITAL'
}
