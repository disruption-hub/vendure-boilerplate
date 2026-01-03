import { IsEmail, IsOptional, IsString, IsArray } from 'class-validator'

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  password?: string

  @IsOptional()
  @IsString()
  role?: string

  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @IsString()
  preferredLanguage?: string

  @IsOptional()
  @IsString()
  tenantId?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsString()
  phoneCountryCode?: string

  @IsOptional()
  @IsString()
  profilePictureUrl?: string

  @IsOptional()
  @IsString()
  approvalStatus?: string

  @IsOptional()
  @IsString()
  approvalMessage?: string

  @IsOptional()
  @IsString()
  approvedById?: string

  @IsOptional()
  @IsString()
  invitedById?: string

  @IsOptional()
  @IsString()
  chatbotAccessStatus?: string

  @IsOptional()
  @IsString()
  timezone?: string

  @IsOptional()
  @IsString()
  departmentId?: string

  @IsOptional()
  metadata?: any

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contactIds?: string[]
}

