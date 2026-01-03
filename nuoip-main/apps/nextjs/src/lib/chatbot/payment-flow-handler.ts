/**
 * @deprecated This file is deprecated. All payment flow logic has been moved to the backend.
 * The backend chatbot stream endpoint (/api/v1/chatbot/stream) now handles all payment intents
 * and interactions. The frontend should only call the backend endpoint and display responses.
 * 
 * This file is kept for reference but should not be imported or used.
 */

import { getConversationState, updateConversationState } from './conversation-state'
import { createPaymentsFacade } from '@/domains/payments/facade'
import { createChatbotPaymentGateway } from '@/domains/payments'
import { DEFAULT_FLOW_CONFIG } from './flow-config/default-config'
import type { PaymentContext } from './types'

// Helper to create initial payment context (matching conversation-state.ts)
function createEmptyPaymentContext(): PaymentContext {
  return {
    stage: 'idle',
    productId: null,
    productName: null,
    amountCents: null,
    currency: null,
    linkToken: null,
    linkUrl: null,
    linkRoute: null,
    lastGeneratedAt: null,
    customerName: null,
    customerEmail: null,
    nameConfirmed: false,
    emailConfirmed: false,
    confirmed: false,
    selectedCustomerId: null,
    selectedCustomerType: null,
    historyOffset: 0,
    historyPageSize: 5,
    lastViewedAt: null,
  }
}

interface PaymentFlowHandlerOptions {
  sessionId: string
  tenantId: string | null
  message: string
  conversationContext?: Record<string, any>
}

interface PaymentFlowResponse {
  response: string
  updatedPaymentContext: PaymentContext
  shouldUseAI: boolean
}

// Payment keywords regex - improved to catch all variations including "dame un link de pago"
const PAYMENT_INTENT_REGEX = /(dame\s+(un\s+)?(link|enlace)\s+de\s+pago|necesito\s+(un\s+)?(link|enlace)\s+de\s+pago|quiero\s+(un\s+)?(link|enlace)\s+de\s+pago|genera\s+(un\s+)?(link|enlace)\s+de\s+pago|crea\s+(un\s+)?(link|enlace)\s+de\s+pago|link\s+de\s+pago|enlace\s+de\s+pago|payment\s+link|\bpay\b|\bpayment\b|\bpaying\b|\bbuy\b|\bpurchase\b|\bcheckout\b|\bpagar\b|\bpago\b|\bcomprar\b|\bcobrar\b)/i

// Payment keywords in Spanish and English (for simple matching)
const PAYMENT_KEYWORDS = [
  'link de pago',
  'enlace de pago',
  'payment link',
  'pagar',
  'pago',
  'dame un link de pago',
  'dame link de pago',
  'necesito pagar',
  'quiero pagar',
  'generar pago',
  'crear pago',
  'necesito un link de pago',
  'quiero un link de pago',
  'genera un link de pago',
  'necesito link de pago',
  'quiero link de pago',
]

// Email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Check if message contains payment keywords (improved to catch all variations)
function isPaymentIntent(message: string): boolean {
  const normalized = message.toLowerCase().trim()

  // First check the regex
  if (PAYMENT_INTENT_REGEX.test(normalized)) {
    return true
  }

  // Also check for exact keyword matches (more flexible)
  return PAYMENT_KEYWORDS.some(keyword => normalized.includes(keyword.toLowerCase()))
}

// Extract product name or number from message
function extractProductSelection(message: string, products: Array<{ id: string; name: string; productCode: string }>): { productId: string; productName: string } | null {
  const trimmed = message.trim()

  // Check for numeric selection (e.g., "1", "2")
  const numberMatch = trimmed.match(/^(\d+)$/)
  if (numberMatch) {
    const index = parseInt(numberMatch[1], 10) - 1
    if (index >= 0 && index < products.length) {
      return {
        productId: products[index].id,
        productName: products[index].name,
      }
    }
  }

  // Check for product name match
  const lowerMessage = trimmed.toLowerCase()
  for (const product of products) {
    if (
      lowerMessage.includes(product.name.toLowerCase()) ||
      lowerMessage.includes(product.productCode.toLowerCase())
    ) {
      return {
        productId: product.id,
        productName: product.name,
      }
    }
  }

  return null
}

// Validate name (not empty, not a number/amount)
function isValidName(name: string): boolean {
  const trimmed = name.trim()
  if (!trimmed || trimmed.length < 2) {
    return false
  }
  // Reject if it looks like an amount (e.g., "100", "50.00")
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return false
  }
  return true
}

// Validate email
function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim())
}

// Format amount for display
function formatAmount(amountCents: number, currency: string): string {
  const amount = amountCents / 100
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount)
}

export async function handlePaymentFlow({
  sessionId,
  tenantId,
  message,
  conversationContext,
}: PaymentFlowHandlerOptions): Promise<PaymentFlowResponse | null> {
  console.log('[PaymentFlowHandler] Called with:', {
    sessionId,
    tenantId,
    message: message.substring(0, 50),
    hasContext: !!conversationContext,
  })

  // Get conversation state first to check if we're in an active payment flow
  let state
  try {
    state = await getConversationState(sessionId, tenantId || '')
  } catch (error) {
    console.error('[PaymentFlowHandler] Failed to load conversation state:', error)
    // Create a minimal state if loading fails (for serverless environments)
    state = {
      sessionId,
      currentStep: 'AWAITING_INTENT' as any,
      language: 'es' as any,
      userData: {} as any,
      appointmentData: {} as any,
      conversationHistory: [],
      attemptCount: {} as any,
      shownWeeks: [],
      phoneDeclined: false,
      questionsAsked: new Set(),
      topicsDiscussed: new Set(),
      shownSlotIds: [],
      lastActivity: new Date(),
      pendingAction: null,
      userTimezone: null,
      showingAllDays: false,
      paymentContext: {
        stage: 'idle',
        productId: null,
        productName: null,
        amountCents: null,
        currency: null,
        linkToken: null,
        linkUrl: null,
        linkRoute: null,
        lastGeneratedAt: null,
        customerName: null,
        customerEmail: null,
        nameConfirmed: false,
        emailConfirmed: false,
        confirmed: false,
        selectedCustomerId: null,
        selectedCustomerType: null,
        historyOffset: 0,
        historyPageSize: 5,
        lastViewedAt: null,
      },
      transitionLog: [],
    }
  }

  const paymentContext = state.paymentContext || {
    stage: 'idle',
    productId: null,
    productName: null,
    amountCents: null,
    currency: null,
    linkToken: null,
    linkUrl: null,
    linkRoute: null,
    lastGeneratedAt: null,
    customerName: null,
    customerEmail: null,
    nameConfirmed: false,
    emailConfirmed: false,
    confirmed: false,
    selectedCustomerId: null,
    selectedCustomerType: null,
    historyOffset: 0,
    historyPageSize: 5,
    lastViewedAt: null,
  }

  console.log('[PaymentFlowHandler] Payment context:', {
    stage: paymentContext.stage,
    productId: paymentContext.productId,
    productName: paymentContext.productName,
  })

  // Check if we should continue processing this message
  // Continue if:
  // 1. Message contains payment intent keywords, OR
  // 2. User is already in an active payment flow (not idle)
  const hasPaymentIntent = isPaymentIntent(message)
  const inActiveFlow = paymentContext.stage !== 'idle' && paymentContext.stage !== 'completed'

  console.log('[PaymentFlowHandler] Flow check:', {
    hasPaymentIntent,
    inActiveFlow,
    stage: paymentContext.stage,
  })

  if (!hasPaymentIntent && !inActiveFlow) {
    console.log('[PaymentFlowHandler] No payment intent and not in active flow, returning null')
    return null
  }

  const config = DEFAULT_FLOW_CONFIG
  const locale = state.language || 'es'
  const t = (key: keyof typeof config.messages): string => {
    const msg = config.messages[key]
    if (typeof msg === 'string') {
      return msg
    }
    if (typeof msg === 'object' && msg !== null) {
      const localeMsg = (msg as Record<string, string>)[locale]
      if (typeof localeMsg === 'string') {
        return localeMsg
      }
      const enMsg = (msg as Record<string, string>).en
      if (typeof enMsg === 'string') {
        return enMsg
      }
    }
    return ''
  }

  // Initialize payments facade
  const gateway = createChatbotPaymentGateway()
  const paymentsFacade = createPaymentsFacade({ gateway })

  // Check if user is in completed stage and requesting a new payment link
  // Only check if we have a valid payment context with a completed stage
  if (paymentContext.stage === 'completed' && paymentContext.linkUrl && isPaymentIntent(message)) {
    // User has existing link, ask if they want a new one
    const amount = formatAmount(paymentContext.amountCents!, paymentContext.currency!)
    const response = t('paymentNewLinkConfirmation')
      .replace('{product}', paymentContext.productName!)
      .replace('{amount}', amount)
      .replace('{link}', paymentContext.linkUrl!)

    // Move to awaiting_new_link_confirmation stage
    const updatedContext: PaymentContext = {
      ...paymentContext,
      stage: 'awaiting_new_link_confirmation' as any, // Temporary any cast
    }

    try {
      await updateConversationState(sessionId, tenantId || '', {
        paymentContext: updatedContext,
      })
    } catch (error) {
      console.error('[PaymentFlowHandler] Failed to update conversation state:', error)
      // Continue anyway - state update failure shouldn't block the response
    }

    return {
      response,
      updatedPaymentContext: updatedContext,
      shouldUseAI: false,
    }
  }

  // Handle confirmation for new link
  if ((paymentContext.stage as any) === 'awaiting_new_link_confirmation') {
    const messageLower = message.toLowerCase().trim()
    const isPositive = /^(s[ií]|yes|y|afirmativo|ok|confirmar|nuevo)$/i.test(messageLower)
    const isNegative = /^(no|n|negativo|mantener|conservar|keep)$/i.test(messageLower)

    if (isPositive) {
      // User wants new link, reset to idle
      const resetContext: PaymentContext = createEmptyPaymentContext()

      await updateConversationState(sessionId, tenantId || '', {
        paymentContext: resetContext,
      })

      // Start new payment flow
      const products = await paymentsFacade.listActiveProducts()

      if (products.length === 0) {
        return {
          response: t('paymentNoProducts'),
          updatedPaymentContext: resetContext,
          shouldUseAI: false,
        }
      }

      const productsList = products
        .map((product, index) => {
          const amount = formatAmount(product.amountCents, product.currency)
          return `${index + 1}. ${product.name} - ${amount}`
        })
        .join('\n\n')

      const response = t('paymentAskProduct').replace('{options}', productsList)

      const updatedContext: PaymentContext = {
        ...resetContext,
        stage: 'awaiting_product',
      }

      await updateConversationState(sessionId, tenantId || '', {
        paymentContext: updatedContext,
      })

      return {
        response,
        updatedPaymentContext: updatedContext,
        shouldUseAI: false,
      }
    } else if (isNegative) {
      // User wants to keep existing link, show it again
      const amount = formatAmount(paymentContext.amountCents!, paymentContext.currency!)
      const response = t('paymentLinkExisting')
        .replace('{product}', paymentContext.productName!)
        .replace('{amount}', amount)
        .replace('{link}', paymentContext.linkUrl!)

      // Keep in completed stage
      const updatedContext: PaymentContext = {
        ...paymentContext,
        stage: 'completed',
      }

      await updateConversationState(sessionId, tenantId || '', {
        paymentContext: updatedContext,
      })

      return {
        response,
        updatedPaymentContext: updatedContext,
        shouldUseAI: false,
      }
    } else {
      // Invalid response, ask again
      const amount = formatAmount(paymentContext.amountCents!, paymentContext.currency!)
      const response = t('paymentNewLinkConfirmation')
        .replace('{product}', paymentContext.productName!)
        .replace('{amount}', amount)
        .replace('{link}', paymentContext.linkUrl!)

      return {
        response,
        updatedPaymentContext: paymentContext,
        shouldUseAI: false,
      }
    }
  }

  // Stage: idle -> Check if payment intent detected
  if (paymentContext.stage === 'idle') {
    const intentDetected = isPaymentIntent(message)
    console.log('[PaymentFlowHandler] Payment intent check:', {
      intentDetected,
      message: message.substring(0, 50),
      normalized: message.toLowerCase().trim(),
    })

    if (intentDetected) {
      console.log('[PaymentFlowHandler] Payment intent detected, fetching products')
      // Move to awaiting_product stage
      const products = await paymentsFacade.listActiveProducts()

      console.log('[PaymentFlowHandler] Products fetched:', {
        count: products.length,
        products: products.map(p => ({ id: p.id, name: p.name })),
      })

      if (products.length === 0) {
        console.warn('[PaymentFlowHandler] No products available')
        return {
          response: t('paymentNoProducts'),
          updatedPaymentContext: paymentContext,
          shouldUseAI: false,
        }
      }

      // Format products list
      const productsList = products
        .map((product, index) => {
          const amount = formatAmount(product.amountCents, product.currency)
          return `${index + 1}. ${product.name} - ${amount}`
        })
        .join('\n\n')

      const response = t('paymentAskProduct').replace('{options}', productsList)

      const updatedContext: PaymentContext = {
        ...paymentContext,
        stage: 'awaiting_product',
      }

      await updateConversationState(sessionId, tenantId || '', {
        paymentContext: updatedContext,
      })

      console.log('[PaymentFlowHandler] Returning product selection prompt')
      return {
        response,
        updatedPaymentContext: updatedContext,
        shouldUseAI: false,
      }
    }

    // Not a payment intent, let AI handle it
    console.log('[PaymentFlowHandler] Not a payment intent, returning null')
    return null
  }

  // Stage: awaiting_product -> User selects product
  if (paymentContext.stage === 'awaiting_product') {
    const products = await paymentsFacade.listActiveProducts()
    const selection = extractProductSelection(message, products)

    if (!selection) {
      // Product not found, ask again
      const productsList = products
        .map((product, index) => {
          const amount = formatAmount(product.amountCents, product.currency)
          return `${index + 1}. ${product.name} - ${amount}`
        })
        .join('\n\n')

      const response = t('paymentAskProduct').replace('{options}', productsList)

      return {
        response,
        updatedPaymentContext: paymentContext,
        shouldUseAI: false,
      }
    }

    const selectedProduct = products.find(p => p.id === selection.productId)
    if (!selectedProduct) {
      return null
    }

    // Move to awaiting_name stage
    const updatedContext: PaymentContext = {
      ...paymentContext,
      stage: 'awaiting_name',
      productId: selection.productId,
      productName: selection.productName,
      amountCents: selectedProduct.amountCents,
      currency: selectedProduct.currency,
    }

    try {
      await updateConversationState(sessionId, tenantId || '', {
        paymentContext: updatedContext,
      })
    } catch (error) {
      console.error('[PaymentFlowHandler] Failed to update conversation state:', error)
      // Continue anyway - state update failure shouldn't block the response
    }

    const response = t('paymentAskName').replace('{product}', selection.productName)

    return {
      response,
      updatedPaymentContext: updatedContext,
      shouldUseAI: false,
    }
  }

  // Stage: awaiting_name -> User provides name
  if (paymentContext.stage === 'awaiting_name') {
    if (!isValidName(message)) {
      const response = t('paymentAskNameRetry')
      return {
        response,
        updatedPaymentContext: paymentContext,
        shouldUseAI: false,
      }
    }

    const customerName = message.trim()

    // Move to awaiting_email stage
    const updatedContext: PaymentContext = {
      ...paymentContext,
      stage: 'awaiting_email',
      customerName,
      nameConfirmed: true,
    }

    try {
      await updateConversationState(sessionId, tenantId || '', {
        paymentContext: updatedContext,
      })
    } catch (error) {
      console.error('[PaymentFlowHandler] Failed to update conversation state:', error)
      // Continue anyway - state update failure shouldn't block the response
    }

    const response = t('paymentAskEmail').replace('{name}', customerName)

    return {
      response,
      updatedPaymentContext: updatedContext,
      shouldUseAI: false,
    }
  }

  // Stage: awaiting_email -> User provides email
  if (paymentContext.stage === 'awaiting_email') {
    if (!isValidEmail(message)) {
      const response = t('paymentAskEmailRetry')
      return {
        response,
        updatedPaymentContext: paymentContext,
        shouldUseAI: false,
      }
    }

    const customerEmail = message.trim().toLowerCase()

    // Move to awaiting_confirmation stage (show summary before generating link)
    const updatedContext: PaymentContext = {
      ...paymentContext,
      stage: 'awaiting_confirmation',
      customerEmail,
      emailConfirmed: true,
    }

    try {
      await updateConversationState(sessionId, tenantId || '', {
        paymentContext: updatedContext,
      })
    } catch (error) {
      console.error('[PaymentFlowHandler] Failed to update conversation state:', error)
      // Continue anyway - state update failure shouldn't block the response
    }

    const amount = formatAmount(paymentContext.amountCents!, paymentContext.currency!)

    // Show confirmation prompt
    const response = t('paymentConfirmDetails')
      .replace('{product}', paymentContext.productName!)
      .replace('{amount}', amount)
      .replace('{name}', paymentContext.customerName!)
      .replace('{email}', customerEmail)

    return {
      response,
      updatedPaymentContext: updatedContext,
      shouldUseAI: false,
    }
  }

  // Stage: awaiting_confirmation -> User confirms payment details
  if (paymentContext.stage === 'awaiting_confirmation') {
    const messageLower = message.toLowerCase().trim()

    // Check for confirmation patterns
    const isPositive = /^(sí|si|confirmar|confirmo|correcto|está bien|está correcto|ok|vale|perfecto|yes|y|confirm|sure|correct|that's right|that's correct|perfect)$/i.test(messageLower)
    const isNegative = /^(no|n|incorrecto|corregir|cambiar|modificar|editar|otra vez|wrong|incorrect|change|modify|edit|again)$/i.test(messageLower)

    if (isNegative) {
      // User wants to make changes - reset to product selection
      const resetContext: PaymentContext = {
        ...createEmptyPaymentContext(),
        productId: paymentContext.productId,
        productName: paymentContext.productName,
      }

      await updateConversationState(sessionId, tenantId || '', {
        paymentContext: resetContext,
      })

      return {
        response: t('paymentFlowReset'),
        updatedPaymentContext: resetContext,
        shouldUseAI: false,
      }
    }

    if (!isPositive) {
      // Invalid confirmation response - ask again
      const amount = formatAmount(paymentContext.amountCents!, paymentContext.currency!)
      const response = t('paymentConfirmDetails')
        .replace('{product}', paymentContext.productName!)
        .replace('{amount}', amount)
        .replace('{name}', paymentContext.customerName!)
        .replace('{email}', paymentContext.customerEmail!)

      return {
        response,
        updatedPaymentContext: paymentContext,
        shouldUseAI: false,
      }
    }

    // Confirmation received - generate payment link
    try {
      const baseUrl = await paymentsFacade.resolveTenantBaseUrl(tenantId)
      const linkResult = await paymentsFacade.ensurePaymentLink({
        productId: paymentContext.productId!,
        sessionId,
        tenantId,
        customerName: paymentContext.customerName,
        customerEmail: paymentContext.customerEmail!,
        amountCents: paymentContext.amountCents!,
        currency: paymentContext.currency!,
        selectedCustomerId: paymentContext.selectedCustomerId,
        selectedCustomerType: paymentContext.selectedCustomerType,
        metadata: {
          source: 'chatbot',
          sessionId,
        },
      })

      const linkUrl = `${baseUrl}/pay/${linkResult.token}`
      const amount = formatAmount(paymentContext.amountCents!, paymentContext.currency!)

      // Move to completed stage
      const updatedContext: PaymentContext = {
        ...paymentContext,
        stage: 'completed',
        confirmed: true,
        linkToken: linkResult.token,
        linkUrl,
        linkRoute: `/pay/${linkResult.token}`,
        lastGeneratedAt: new Date().toISOString(),
      }

      await updateConversationState(sessionId, tenantId || '', {
        paymentContext: updatedContext,
      })

      // Use existing link message if link already existed
      const responseTemplate = linkResult.existing
        ? t('paymentLinkExisting')
        : t('paymentLinkReady')

      const response = responseTemplate
        .replace('{product}', paymentContext.productName!)
        .replace('{amount}', amount)
        .replace('{link}', linkUrl)

      return {
        response,
        updatedPaymentContext: updatedContext,
        shouldUseAI: false,
      }
    } catch (error) {
      console.error('[PaymentFlowHandler] Error generating payment link:', error)
      const response = t('paymentLinkError')
      return {
        response,
        updatedPaymentContext: paymentContext,
        shouldUseAI: false,
      }
    }
  }

  // Other stages or unknown state - let AI handle
  return null
}

