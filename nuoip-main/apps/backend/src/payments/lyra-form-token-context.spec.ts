import {
  computeLyraFormTokenFingerprint,
  extractLyraFormTokenContext,
  isReusableLyraFormToken,
  withUpdatedLyraFormTokenContext,
} from './lyra-form-token-context'

describe('lyra-form-token-context', () => {
  it('extractLyraFormTokenContext returns null for non-object metadata', () => {
    expect(extractLyraFormTokenContext(null)).toBeNull()
    expect(extractLyraFormTokenContext('nope')).toBeNull()
    expect(extractLyraFormTokenContext([])).toBeNull()
  })

  it('computeLyraFormTokenFingerprint is stable for the same inputs', () => {
    const a = computeLyraFormTokenFingerprint({
      mode: 'test',
      apiBaseUrl: 'https://api.example.com/Charge/CreatePayment',
      scriptBaseUrl: 'https://static.example.com/static/js/krypton-client/V4.0',
      publicKey: '123:testpublickey_abc',
      apiUser: '123',
    })
    const b = computeLyraFormTokenFingerprint({
      mode: 'test',
      apiBaseUrl: 'https://api.example.com/Charge/CreatePayment',
      scriptBaseUrl: 'https://static.example.com/static/js/krypton-client/V4.0',
      publicKey: '123:testpublickey_abc',
      apiUser: '123',
    })
    expect(a).toBe(b)
  })

  it('isReusableLyraFormToken requires non-expired token AND matching mode+fingerprint in metadata', () => {
    const fingerprint = computeLyraFormTokenFingerprint({
      mode: 'production',
      apiBaseUrl: 'https://api.example.com/Charge/CreatePayment',
      scriptBaseUrl: 'https://static.example.com/static/js/krypton-client/V4.0',
      publicKey: '999:publickey_live',
      apiUser: '999',
    })

    const metadata = withUpdatedLyraFormTokenContext({}, {
      mode: 'production',
      fingerprint,
      generatedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    })

    const now = new Date('2026-01-01T00:00:00.000Z')

    expect(
      isReusableLyraFormToken({
        formToken: 'token',
        formTokenExpiresAt: new Date('2026-01-01T00:10:00.000Z'),
        now,
        expectedContext: { mode: 'production', fingerprint },
        metadata,
      }),
    ).toBe(true)

    expect(
      isReusableLyraFormToken({
        formToken: 'token',
        formTokenExpiresAt: new Date('2026-01-01T00:10:00.000Z'),
        now,
        expectedContext: { mode: 'test', fingerprint },
        metadata,
      }),
    ).toBe(false)

    expect(
      isReusableLyraFormToken({
        formToken: 'token',
        formTokenExpiresAt: new Date('2026-01-01T00:10:00.000Z'),
        now,
        expectedContext: { mode: 'production', fingerprint: 'different' },
        metadata,
      }),
    ).toBe(false)

    expect(
      isReusableLyraFormToken({
        formToken: 'token',
        formTokenExpiresAt: new Date('2025-12-31T23:59:59.000Z'),
        now,
        expectedContext: { mode: 'production', fingerprint },
        metadata,
      }),
    ).toBe(false)

    expect(
      isReusableLyraFormToken({
        formToken: 'token',
        formTokenExpiresAt: new Date('2026-01-01T00:10:00.000Z'),
        now,
        expectedContext: { mode: 'production', fingerprint },
        metadata: {},
      }),
    ).toBe(false)
  })
})
