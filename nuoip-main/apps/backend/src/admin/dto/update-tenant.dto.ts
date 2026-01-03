import { IsOptional, IsString, ValidateNested, IsEmail } from 'class-validator'
import { Type } from 'class-transformer'
import { TenantSettingsDto } from './create-tenant.dto'

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  domain?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => TenantSettingsDto)
  settings?: TenantSettingsDto

  @IsOptional()
  isActive?: boolean

  @IsOptional()
  paymentReturnHomeUrl?: string | null

  @IsOptional()
  displayName?: string | null

  @IsOptional()
  legalName?: string | null

  @IsOptional()
  tagline?: string | null

  @IsOptional()
  @IsEmail()
  contactEmail?: string | null

  @IsOptional()
  contactPhone?: string | null

  @IsOptional()
  websiteUrl?: string | null

  @IsOptional()
  industry?: string | null

  @IsOptional()
  addressLine1?: string | null

  @IsOptional()
  addressLine2?: string | null

  @IsOptional()
  city?: string | null

  @IsOptional()
  state?: string | null

  @IsOptional()
  postalCode?: string | null

  @IsOptional()
  country?: string | null

  @IsOptional()
  subdomain?: string | null
}

