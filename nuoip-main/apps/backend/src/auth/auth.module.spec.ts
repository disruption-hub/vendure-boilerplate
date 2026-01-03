import { Test, TestingModule } from '@nestjs/testing'
import { AuthModule } from './auth.module'
import { AuthService } from './auth.service'
import { PrismaService } from '../prisma/prisma.service'
import { ChatOtpService } from './services/chat-otp.service'
import { ConfigService } from '@nestjs/config'
import { PrismaModule } from '../prisma/prisma.module'

describe('AuthModule', () => {
  let moduleRef: TestingModule

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AuthModule, PrismaModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findFirst: jest.fn(),
        },
      })
      .overrideProvider(ChatOtpService)
      .useValue({
        requestOtp: jest.fn(),
        verifyOtp: jest.fn(),
      })
      .overrideProvider(ConfigService)
      .useValue({ get: jest.fn().mockReturnValue(undefined) })
      .compile()
  })

  afterAll(async () => {
    await moduleRef.close()
  })

  it('should provide AuthService', () => {
    const service = moduleRef.get(AuthService)
    expect(service).toBeInstanceOf(AuthService)
  })
})
