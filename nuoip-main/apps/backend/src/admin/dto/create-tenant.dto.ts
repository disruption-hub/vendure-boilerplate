import { Type } from 'class-transformer'
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
  IsObject,
} from 'class-validator'

// Custom validator for logoUrl that accepts both regular URLs and data URLs
@ValidatorConstraint({ name: 'isUrlOrDataUrl', async: false })
export class IsUrlOrDataUrlConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments): boolean {
    if (value === null || value === undefined || value === '') {
      return true // Optional field, null/undefined/empty is valid
    }
    if (typeof value !== 'string') {
      return false
    }
    // Check if it's a data URL
    if (value.startsWith('data:')) {
      return true
    }
    // Check if it's a regular URL (http/https)
    if (value.startsWith('http://') || value.startsWith('https://')) {
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    }
    return false
  }

  defaultMessage(args: ValidationArguments): string {
    return 'logoUrl must be a valid URL (http/https) or a data URL (data:...)'
  }
}

export class TenantLimitsDto {
  @IsNumber()
  @Min(0)
  maxUsers!: number

  @IsNumber()
  @Min(0)
  maxTrademarks!: number
}

export class TenantBrandingDto {
  @IsString()
  @IsNotEmpty()
  primaryColor!: string

  @IsOptional()
  @Validate(IsUrlOrDataUrlConstraint)
  logoUrl?: string | null
}

export class TenantSettingsDto {
  @IsArray()
  @IsString({ each: true })
  features!: string[]

  @ValidateNested()
  @Type(() => TenantLimitsDto)
  limits!: TenantLimitsDto

  @ValidateNested()
  @Type(() => TenantBrandingDto)
  branding!: TenantBrandingDto

  // Allow additional fields like lyraConfig, customization, personalization
  // These are stored as JSON in the database and validated by the service layer
  // Using @IsOptional() without @IsObject() to allow any nested structure
  @IsOptional()
  lyraConfig?: any

  @IsOptional()
  customization?: any

  @IsOptional()
  personalization?: any

  // paymentReturnHomeUrl is stored in settings JSON as a workaround for Prisma client cache issues
  @IsOptional()
  @IsString()
  paymentReturnHomeUrl?: string | null
}

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsOptional()
  @IsString()
  domain?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => TenantSettingsDto)
  settings?: TenantSettingsDto
}
