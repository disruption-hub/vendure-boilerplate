import type { LyraCredentialSet, LyraPaymentConfig } from '@/lib/services/admin/types'

export const LYRA_DEFAULT_PAYMENT_METHODS = Object.freeze(['CARDS'] as string[])

export const LYRA_TEST_CREDENTIALS = Object.freeze({
  apiUser: '69876357',
  apiPassword: 'testpassword_DEMOPRIVATEKEY23G4475zXZQ2UA5x7M',
  publicKey: '69876357:testpublickey_DEMOPUBLICKEY95me92597fd28tGD4r5',
  hmacKey: '38453613e7f44dc58732bad3dca2bca3',
  apiBaseUrl: 'https://api.lyra.com/api-payment/V4/Charge/CreatePayment',
  scriptBaseUrl: 'https://static.lyra.com/static/js/krypton-client/V4.0',
}) satisfies LyraCredentialSet

export function createLyraTestCredentials(): LyraCredentialSet {
  return {
    ...LYRA_TEST_CREDENTIALS,
  }
}

export function createDefaultLyraPaymentConfig(): LyraPaymentConfig {
  return {
    testMode: {
      enabled: true,
      credentials: {
        ...LYRA_TEST_CREDENTIALS,
      },
    },
    productionMode: {
      enabled: false,
      credentials: null,
    },
    activeMode: 'test',
    language: 'en-EN',
    successRedirectUrl: '/payments/lyra/browser-success',
    failureRedirectUrl: '/payments/lyra/browser-failure',
    theme: 'neon',
    paymentMethods: [...LYRA_DEFAULT_PAYMENT_METHODS],
  }
}
