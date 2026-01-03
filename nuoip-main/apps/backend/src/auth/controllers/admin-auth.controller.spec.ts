import { Test, TestingModule } from '@nestjs/testing'
import { AdminAuthController } from './admin-auth.controller'
import { AuthService } from '../auth.service'

describe('AdminAuthController', () => {
  let controller: AdminAuthController
  const adminLogin = jest.fn()

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminAuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            adminLogin,
          },
        },
      ],
    }).compile()

    controller = module.get(AdminAuthController)
  })

  it('should delegate to AuthService adminLogin', async () => {
    adminLogin.mockResolvedValue({
      token: 'token',
      user: {
        id: 'user-1',
        email: 'admin@example.com',
      },
    })

    const result = await controller.login({ email: 'admin@example.com', password: 'secret' })
    expect(adminLogin).toHaveBeenCalledWith({ email: 'admin@example.com', password: 'secret' })
    expect(result.user.email).toEqual('admin@example.com')
  })
})
