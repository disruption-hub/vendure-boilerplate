import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { UnauthorizedException, BadRequestException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import { AuthService } from './auth.service'
import { PrismaService } from '../prisma/prisma.service'
import { ChatOtpService } from './services/chat-otp.service'
import { ChatAuthError } from '@ipnuo/shared-chat-auth'

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}))

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}))

const prismaMock = {
  user: {
    findFirst: jest.fn(),
  },
}

const chatOtpServiceMock = {
  requestOtp: jest.fn(),
  verifyOtp: jest.fn(),
}

const mockBcryptCompare = bcrypt.compare as jest.Mock
const mockJwtSign = jwt.sign as jest.Mock

describe('AuthService', () => {
  let service: AuthService
  let config: ConfigService

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: ChatOtpService,
          useValue: chatOtpServiceMock,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'NEST_AUTH_SECRET') {
                return 'test-secret'
              }
              if (key === 'AUTH_TOKEN_EXPIRES_IN') {
                return '1h'
              }
              return undefined
            }),
          },
        },
      ],
    }).compile()

    service = module.get(AuthService)
    config = module.get(ConfigService)
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('authenticates admin users and returns JWT token', async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'admin@example.com',
      password: 'hashed',
      tenantId: 'tenant-1',
      role: 'admin',
    })
    mockBcryptCompare.mockResolvedValue(true)
    mockJwtSign.mockReturnValue('signed-token')

    const result = await service.adminLogin({ email: 'admin@example.com', password: 'secret' })

    expect(prismaMock.user.findFirst).toHaveBeenCalled()
    expect(mockJwtSign).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 'user-1', email: 'admin@example.com' }),
      'test-secret',
      { expiresIn: '1h' },
    )
    expect(result).toEqual({
      token: 'signed-token',
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        role: 'admin',
        tenantId: 'tenant-1',
      },
    })
  })

  it('throws unauthorized when credentials invalid', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null)

    await expect(
      service.adminLogin({ email: 'missing@example.com', password: 'secret' }),
    ).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('requests chat OTP via existing service', async () => {
    chatOtpServiceMock.requestOtp.mockResolvedValue({
      success: true,
      verificationId: 'verif-1',
      expiresAt: '2025-01-01T00:00:00.000Z',
      normalizedPhone: '+11234567890',
      countryCode: '+1',
    })

    const result = await service.chatRequestOtp({ phone: '+1 123 456 7890' })

    expect(chatOtpServiceMock.requestOtp).toHaveBeenCalled()
    expect(result).toEqual({
      success: true,
      verificationId: 'verif-1',
      expiresAt: '2025-01-01T00:00:00.000Z',
      normalizedPhone: '+11234567890',
      countryCode: '+1',
    })
  })

  it('translates ChatAuthError to BadRequest', async () => {
    chatOtpServiceMock.requestOtp.mockRejectedValue(new ChatAuthError('Invalid phone', 'INVALID_PHONE'))

    await expect(service.chatRequestOtp({ phone: 'bad' })).rejects.toBeInstanceOf(BadRequestException)
  })

  it('verifies OTP and returns session payload', async () => {
    chatOtpServiceMock.verifyOtp.mockResolvedValue({
      success: true,
      session: {
        token: 'session-token',
        sessionId: 'session-id',
        expiresAt: '2025-01-01T01:00:00.000Z',
      },
      user: {
        id: 'chat-user-1',
        tenantId: 'tenant-1',
        displayName: 'Test User',
        email: 'user@example.com',
        profileComplete: true,
        linkedUserId: 'app-user-1',
      },
    })

    const result = await service.chatVerifyOtp({ verificationId: 'verif-1', code: '123456' })

    expect(chatOtpServiceMock.verifyOtp).toHaveBeenCalled()
    expect(result.user.id).toBe('chat-user-1')
    expect(result.session.token).toBe('session-token')
  })
})
