import { Test, TestingModule } from '@nestjs/testing'
import { ChatAuthController } from './chat-auth.controller'
import { AuthService } from '../auth.service'
import { ChatOtpService } from '../services/chat-otp.service'
import { ChatAuthError } from '@ipnuo/shared-chat-auth'

describe('ChatAuthController', () => {
  let controller: ChatAuthController
  const requestOtp = jest.fn()
  const verifyOtp = jest.fn()
  const syncSession = jest.fn()
  const loadSession = jest.fn()
  const revokeSession = jest.fn()
  const fetchProfile = jest.fn()
  const updateProfile = jest.fn()

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatAuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            chatRequestOtp: requestOtp,
            chatVerifyOtp: verifyOtp,
          },
        },
        {
          provide: ChatOtpService,
          useValue: {
            syncSession,
            loadSession,
            revokeSession,
            fetchProfile,
            updateProfile,
          },
        },
      ],
    }).compile()

    controller = module.get(ChatAuthController)
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should delegate request OTP', async () => {
    requestOtp.mockResolvedValue({
      success: true,
      verificationId: 'verif-1',
      expiresAt: '2025-01-01T00:00:00.000Z',
      normalizedPhone: '+11234567890',
      countryCode: '+1',
    })

    const result = await controller.requestOtp({ phone: '+11234567890', language: 'es' })
    expect(requestOtp).toHaveBeenCalledWith({ phone: '+11234567890', language: 'es' })
    expect(result.verificationId).toBe('verif-1')
  })

  it('should delegate verify OTP', async () => {
    verifyOtp.mockResolvedValue({
      success: true,
      session: {
        token: 'session-token',
        sessionId: 'session-id',
        expiresAt: '2025-01-01T01:00:00.000Z',
      },
      user: {
        id: 'chat-user-1',
        tenantId: null,
        displayName: null,
        email: null,
        profileComplete: false,
      },
    })

    const result = await controller.verify({ code: '123456', verificationId: 'test' })
    expect(verifyOtp).toHaveBeenCalledWith({ code: '123456', verificationId: 'test' })
    expect(result.session.token).toBe('session-token')
  })

  it('syncs session via chat OTP service', async () => {
    syncSession.mockResolvedValue({ success: true })
    const result = await controller.syncSession({ phone: '+1', language: 'es' })
    expect(syncSession).toHaveBeenCalled()
    expect(result).toEqual({ success: true })
  })

  it('revokes session token', async () => {
    revokeSession.mockResolvedValue(undefined)
    const result = await controller.revokeSession({ token: 'abc' })
    expect(revokeSession).toHaveBeenCalledWith('abc')
    expect(result).toEqual({ success: true })
  })

  it('throws mapped error when revoke fails', async () => {
    revokeSession.mockRejectedValueOnce(new ChatAuthError('invalid', 'SESSION_INVALID'))
    await expect(controller.revokeSession({ token: 'bad' })).rejects.toMatchObject({
      response: { error: 'invalid', code: 'SESSION_INVALID' },
      status: 401,
    })
  })
})
