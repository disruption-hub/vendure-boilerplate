import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateLocationDto {
    @IsNotEmpty()
    @IsString()
    name: string

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
    @IsString()
    type?: 'PHYSICAL' | 'DIGITAL'
}
