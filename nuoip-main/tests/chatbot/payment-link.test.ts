import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '@/lib/prisma'
import { runConversation, logPathCoverage } from '../utils/conversation-harness'

const TEST_TENANT = 'test-payment-flow'

describe('Chatbot payment link flow', () => {
  const createdProductIds: string[] = []

  beforeAll(async () => {
    const product = await prisma.paymentProduct.create({
      data: {
        productCode: `CHATBOT_TEST_${Date.now()}`,
        name: 'AutoTest Plan',
        description: 'Automated test product for chatbot payment link flow',
        amountCents: 15000,
        baseAmountCents: 15000,
        taxAmountCents: 0,
        currency: 'PEN',
        isActive: true,
        metadata: {
          keywords: ['autotest'],
        },
      },
    })
    createdProductIds.push(product.id)

    const menuProduct = await prisma.paymentProduct.create({
      data: {
        productCode: `CHATBOT_MENU_${Date.now()}`,
        name: 'Menu Plan',
        description: 'Second product to validate numbered selection',
        amountCents: 45000,
        baseAmountCents: 45000,
        taxAmountCents: 0,
        currency: 'PEN',
        isActive: true,
        metadata: {
          keywords: ['menu'],
        },
      },
    })
    createdProductIds.push(menuProduct.id)
  })

  afterEach(async () => {
    await prisma.paymentLink.deleteMany({
      where: { tenantId: TEST_TENANT },
    })
  })

  afterAll(async () => {
    if (createdProductIds.length) {
      await prisma.paymentLink.deleteMany({
        where: { productId: { in: createdProductIds } },
      })
      await prisma.paymentProduct.deleteMany({
        where: { id: { in: createdProductIds } },
      })
    }
  })

  it('collects user details and returns a payment link', async () => {
    const sessionId = `payment-session-${Date.now()}`

    const results = await runConversation({
      sessionId,
      tenantId: TEST_TENANT,
      steps: [
        {
          userMessage: 'Hola',
          expectedResponseIncludes: 'Hola',
          assert: ({ stateAfter }) => {
            expect(stateAfter.paymentContext.stage).toBe('idle')
          },
        },
        {
          userMessage: 'Necesito un link de pago para AutoTest',
          expectedStateAfter: 'AWAITING_INTENT',
          expectedResponseIncludes: 'Opción',
          assert: ({ stateAfter }) => {
            expect(stateAfter.paymentContext.stage).toBe('awaiting_product')
            expect(stateAfter.paymentContext.productName).toBeNull()
          },
        },
        {
          userMessage: 'AutoTest Plan',
          expectedStateAfter: 'AWAITING_INTENT',
          expectedResponseIncludes: 'nombre',
          assert: ({ stateAfter }) => {
            expect(stateAfter.paymentContext.stage).toBe('awaiting_name')
            expect(stateAfter.paymentContext.productName).toBe('AutoTest Plan')
          },
        },
        {
          userMessage: 'Soy Juan Perez',
          expectedStateAfter: 'AWAITING_INTENT',
          expectedResponseIncludes: 'correo',
          assert: ({ stateAfter }) => {
            expect(stateAfter.paymentContext.stage).toBe('awaiting_email')
            expect(stateAfter.paymentContext.customerName).toBe('Juan Perez')
          },
        },
        {
          userMessage: 'juan.perez@test.com',
          expectedStateAfter: 'AWAITING_INTENT',
          expectedResponseIncludes: '¿Todo se ve correcto?',
          assert: ({ stateAfter }) => {
            expect(stateAfter.paymentContext.stage).toBe('awaiting_confirmation')
            expect(stateAfter.paymentContext.customerEmail).toBe('juan.perez@test.com')
          },
        },
        {
          userMessage: 'confirmar',
          expectedStateAfter: 'AWAITING_INTENT',
          expectedResponseIncludes: ['[Abrir enlace de pago]', 'https://flowcast.chat/pay/'],
          assert: async ({ stateAfter, response }) => {
            expect(stateAfter.pendingAction).toBeNull()
            expect(stateAfter.paymentContext.stage).toBe('completed')
            expect(stateAfter.paymentContext.linkToken).toBeTruthy()
            expect(response).toContain('AutoTest')
            expect(response).toContain('[Abrir enlace de pago]')
            expect(response).toContain('https://flowcast.chat/pay/')

            const linkRecord = await prisma.paymentLink.findFirst({
              where: {
                sessionId,
                customerEmail: 'juan.perez@test.com',
              },
            })

            expect(linkRecord).not.toBeNull()
            if (linkRecord) {
              expect(linkRecord.currency).toBe('PEN')
              expect(linkRecord.amountCents).toBe(15000)
              expect(stateAfter.paymentContext.linkUrl).toBe(`https://flowcast.chat/pay/${linkRecord.token}`)
            }
          },
        },
      ],
    })

    logPathCoverage('payments', 'payment-link-collection')

    const finalState = results.at(-1)?.stateAfter
    expect(finalState?.userData.email).toBe('juan.perez@test.com')
    expect(finalState?.userData.name).toBe('Juan Perez')
  })

  it('lists numbered products and ignores custom amount overrides', async () => {
    const sessionId = `payment-session-menu-${Date.now()}`
    let menuSelection = '1'
    const transcript = [] as Awaited<ReturnType<typeof runConversation>>

    const warmupStep = await runConversation({
      sessionId,
      tenantId: TEST_TENANT,
      steps: [
        {
          userMessage: 'Hola',
          expectedStateAfter: 'AWAITING_INTENT',
          assert: ({ stateAfter }) => {
            expect(stateAfter.paymentContext.stage).toBe('idle')
          },
        },
      ],
    })
    transcript.push(...warmupStep)

    const productPromptStep = await runConversation({
      sessionId,
      tenantId: TEST_TENANT,
      steps: [
        {
          userMessage: 'Necesito un link de pago',
          assert: ({ response, stateAfter }) => {
            expect(response).toMatch(/(Option|Opción) 1:/)
            expect(response).toMatch(/(Option|Opción) 2:/)

            const match = response.match(/O(?:pción|ption)\s+(\d+):\s*Menu Plan/i)
            if (match) {
              menuSelection = match[1]
            }
            expect(stateAfter.paymentContext.stage).toBe('awaiting_product')
          },
        },
      ],
    })
    transcript.push(...productPromptStep)

    const selectionStep = await runConversation({
      sessionId,
      tenantId: TEST_TENANT,
      steps: [
        {
          userMessage: menuSelection,
          expectedStateAfter: 'AWAITING_INTENT',
          assert: ({ response, stateAfter }) => {
            expect(response).toContain('Menu Plan')
            expect(/nombre|name/i.test(response)).toBe(true)
            expect(stateAfter.paymentContext.stage).toBe('awaiting_name')
            expect(stateAfter.paymentContext.productName).toBe('Menu Plan')
          },
        },
      ],
    })
    transcript.push(...selectionStep)

    const amountAttemptStep = await runConversation({
      sessionId,
      tenantId: TEST_TENANT,
      steps: [
        {
          userMessage: 'Quiero pagar 999',
          expectedStateAfter: 'AWAITING_INTENT',
          assert: ({ response, stateAfter }) => {
            expect(/nombre|name/i.test(response)).toBe(true)
            expect(stateAfter.paymentContext.stage).toBe('awaiting_name')
          },
        },
      ],
    })
    transcript.push(...amountAttemptStep)

    const nameStep = await runConversation({
      sessionId,
      tenantId: TEST_TENANT,
      steps: [
        {
          userMessage: 'Maria Tester',
          expectedStateAfter: 'AWAITING_INTENT',
          assert: ({ response, stateAfter }) => {
            expect(/correo|email/i.test(response)).toBe(true)
            expect(stateAfter.paymentContext.stage).toBe('awaiting_email')
            expect(stateAfter.paymentContext.customerName).toBe('Maria Tester')
          },
        },
      ],
    })
    transcript.push(...nameStep)

    const emailStep = await runConversation({
      sessionId,
      tenantId: TEST_TENANT,
      steps: [
        {
          userMessage: 'maria.tester@test.com',
          expectedStateAfter: 'AWAITING_INTENT',
          expectedResponseIncludes: '¿Todo se ve correcto?',
          assert: ({ stateAfter }) => {
            expect(stateAfter.paymentContext.stage).toBe('awaiting_confirmation')
            expect(stateAfter.paymentContext.customerEmail).toBe('maria.tester@test.com')
          },
        },
      ],
    })
    transcript.push(...emailStep)

    const confirmationStep = await runConversation({
      sessionId,
      tenantId: TEST_TENANT,
      steps: [
        {
          userMessage: 'sí',
          expectedStateAfter: 'AWAITING_INTENT',
          expectedResponseIncludes: 'https://flowcast.chat/pay/',
          assert: async ({ stateAfter, response }) => {
            expect(stateAfter.paymentContext.productName).toBe('Menu Plan')
            expect(stateAfter.paymentContext.amountCents).toBe(45000)
            expect(stateAfter.paymentContext.stage).toBe('completed')
            expect(/\[(?:Abrir enlace de pago|Open payment link)\]/i.test(response)).toBe(true)

            const linkRecord = await prisma.paymentLink.findFirst({
              where: {
                sessionId,
                customerEmail: 'maria.tester@test.com',
              },
              include: {
                product: true,
              },
            })

            expect(linkRecord).not.toBeNull()
            if (linkRecord) {
              expect(linkRecord.product?.name).toBe('Menu Plan')
              expect(linkRecord.amountCents).toBe(45000)
            }
          },
        },
      ],
    })
    transcript.push(...confirmationStep)

    logPathCoverage('payments', 'payment-link-numbered-selection')

    const flatResults = transcript.flat()
    const finalState = flatResults.at(-1)?.stateAfter
    expect(finalState?.paymentContext.stage).toBe('completed')
    expect(finalState?.paymentContext.productName).toBe('Menu Plan')
    expect(finalState?.paymentContext.amountCents).toBe(45000)
  })
})
