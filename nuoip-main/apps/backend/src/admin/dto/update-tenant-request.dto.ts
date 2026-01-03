import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class UpdateTenantRequestDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['approve', 'reject'])
  action!: 'approve' | 'reject'

  @IsOptional()
  @IsString()
  reason?: string
}

