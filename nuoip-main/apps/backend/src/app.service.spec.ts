import { AppService } from './app.service'

describe('AppService', () => {
  it('should return ok health status', () => {
    const service = new AppService()
    const result = service.getHealth()
    expect(result.status).toBe('ok')
    expect(result.timestamp).toBeDefined()
  })
})
