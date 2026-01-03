import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string

  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  password?: string

  @IsOptional()
  @IsString()
  role?: string

  @IsNotEmpty()
  @IsString()
  tenantId!: string

  @IsOptional()
  @IsString()
  preferredLanguage?: string

  @IsOptional()
  @IsString()
  status?: string
}

