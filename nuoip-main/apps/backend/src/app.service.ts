import { Injectable } from '@nestjs/common'
import type { HealthPayload } from '@ipnuo/domain'

@Injectable()
export class AppService {
  getHealth(): HealthPayload {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    }
  }
}
