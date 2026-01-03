import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { Request } from 'express'

export interface CurrentUserPayload {
  id: string
  email: string
  tenantId?: string
  role?: string
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: CurrentUserPayload }>()
    return request.user as CurrentUserPayload
  },
)

export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: CurrentUserPayload }>()
    return request.user?.id || ''
  },
)

