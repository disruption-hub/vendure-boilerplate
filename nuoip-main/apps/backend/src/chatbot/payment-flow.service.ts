import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Payment keywords regex - matches "dame un link de pago" and variations
const PAYMENT_INTENT_REGEX = /(dame\s+(un\s+)?(link|enlace)\s+de\s+pago|necesito\s+(un\s+)?(link|enlace)\s+de\s+pago|quiero\s+(un\s+)?(link|enlace)\s+de\s+pago|genera\s+(un\s+)?(link|enlace)\s+de\s+pago|crea\s+(un\s+)?(link|enlace)\s+de\s+pago|link\s+de\s+pago|enlace\s+de\s+pago|payment\s+link|\bpay\b|\bpayment\b|\bpaying\b|\bbuy\b|\bpurchase\b|\bcheckout\b|\bpagar\b|\bpago\b|\bcomprar\b|\bcobrar\b)/i;

// Payment keywords in Spanish and English
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
];

// Email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface PaymentContext {
  stage: 'idle' | 'awaiting_product' | 'awaiting_name' | 'awaiting_email' | 'awaiting_confirmation' | 'awaiting_new_link_confirmation' | 'completed';
  productId: string | null;
  productName: string | null;
  amountCents: number | null;
  currency: string | null;
  linkToken: string | null;
  linkUrl: string | null;
  linkRoute: string | null;
  lastGeneratedAt: string | null;
  customerName: string | null;
  customerEmail: string | null;
  nameConfirmed: boolean;
  emailConfirmed: boolean;
  confirmed: boolean;
  selectedCustomerId: string | null;
  selectedCustomerType: string | null;
  historyOffset: number;
  historyPageSize: number;
  lastViewedAt: string | null;
}

interface PaymentFlowResult {
  handled: boolean;
  response?: string;
  shouldUseAI: boolean;
  updatedPaymentContext?: PaymentContext;
}

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
  };
}

function generateToken(length = 24): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateId(): string {
  // Generate a unique ID similar to cuid format (c + timestamp + random)
  const timestamp = Date.now().toString(36);
  const random = generateToken(12);
  return `c${timestamp}${random}`;
}

// Message templates matching frontend DEFAULT_FLOW_CONFIG
const messages = {
  paymentNoProducts: {
    en: 'I checked our catalog but there are no active products available for payment right now. Please contact support so we can get this resolved.',
    es: 'Revisé nuestro catálogo pero no hay productos activos disponibles para pago en este momento. Por favor contacta a soporte para resolverlo.',
  },
  paymentAskProduct: {
    en: '💳 **AVAILABLE PRODUCTS**\n\n{options}\n\n📋 To select, type the number (e.g., 1) or product name.',
    es: '💳 **PRODUCTOS DISPONIBLES**\n\n{options}\n\n📋 Para seleccionar, escribe el número (ej: 1) o el nombre del producto.',
  },
  paymentAskName: {
    en: 'Before I generate the link for {product}, could you share the payer\'s full name?',
    es: 'Antes de generar el enlace para {product}, ¿podrías compartir el nombre completo del pagador?',
  },
  paymentAskNameRetry: {
    en: 'I just need the full name for the payment link. Could you type it for me?',
    es: 'Necesito el nombre completo para el enlace de pago. ¿Podrías escribirlo?',
  },
  paymentAskEmail: {
    en: 'Thanks {name}! What email should we use to send the receipt?',
    es: '¡Gracias {name}! ¿Qué correo debemos usar para enviar el comprobante?',
  },
  paymentAskEmailRetry: {
    en: 'I\'m not sure that was an email address. Could you share it again?',
    es: 'No estoy seguro de que eso haya sido un correo electrónico. ¿Podrías compartirlo nuevamente?',
  },
  paymentFlowReset: {
    en: 'Let\'s restart that payment request to make sure everything is accurate. Just tell me what you\'d like to pay for again.',
    es: 'Reiniciemos la solicitud de pago para asegurarnos de que todo esté correcto. Solo dime nuevamente qué deseas pagar.',
  },
  paymentConfirmDetails: {
    en: '✅ **CONFIRM YOUR DETAILS**\n━━━━━━━━━━━━━━━━━━━\n📦 Product: {product}\n💰 Amount: {amount}\n👤 Name: {name}\n📧 Email: {email}\n━━━━━━━━━━━━━━━━━━━\n\nType **"confirm"** to generate the payment link.',
    es: '✅ **CONFIRMA TUS DATOS**\n━━━━━━━━━━━━━━━━━━━\n📦 Producto: {product}\n💰 Monto: {amount}\n👤 Nombre: {name}\n📧 Email: {email}\n━━━━━━━━━━━━━━━━━━━\n\nEscribe **"confirmar"** para generar el enlace de pago.',
  },
  paymentLinkReady: {
    en: '✅ **PAYMENT LINK GENERATED**\n━━━━━━━━━━━━━━━━━━━\n📦 {product}\n💰 {amount}\n━━━━━━━━━━━━━━━━━━━\n\n🔗 [Click here to open payment link]({link})\n\nℹ️ The link updates in real-time when payment is completed.',
    es: '✅ **ENLACE DE PAGO GENERADO**\n━━━━━━━━━━━━━━━━━━━\n📦 {product}\n💰 {amount}\n━━━━━━━━━━━━━━━━━━━\n\n🔗 [Haz clic aquí para abrir el enlace de pago]({link})\n\nℹ️ El enlace se actualiza en tiempo real al completar el pago.',
  },
  paymentLinkGeneratedHidden: {
    en: '✅ **PAYMENT LINK GENERATED**\n━━━━━━━━━━━━━━━━━━━\n📦 {product}\n💰 {amount}\n━━━━━━━━━━━━━━━━━━━\n\nThe link has been generated successfully and will be shared by an agent.',
    es: '✅ **ENLACE DE PAGO GENERADO**\n━━━━━━━━━━━━━━━━━━━\n📦 {product}\n💰 {amount}\n━━━━━━━━━━━━━━━━━━━\n\nEl enlace ha sido generado correctamente y será compartido por un asesor.',
  },
  paymentLinkExisting: {
    en: '🔄 **EXISTING PAYMENT LINK**\n━━━━━━━━━━━━━━━━━━━\n📦 {product}\n💰 {amount}\n━━━━━━━━━━━━━━━━━━━\n\n🔗 [Click here to open payment link]({link})\n\nℹ️ This link remains valid until payment is processed.',
    es: '🔄 **ENLACE DE PAGO EXISTENTE**\n━━━━━━━━━━━━━━━━━━━\n📦 {product}\n💰 {amount}\n━━━━━━━━━━━━━━━━━━━\n\n🔗 [Haz clic aquí para abrir el enlace de pago]({link})\n\nℹ️ El enlace seguirá válido hasta que se procese el pago.',
  },
  paymentLinkError: {
    en: 'Sorry, something went wrong while generating the payment link. Could you try again in a moment or let a team member know?',
    es: 'Lo siento, ocurrió un problema al generar el enlace de pago. ¿Podrías intentarlo de nuevo en un momento o avisar a alguien del equipo?',
  },
  paymentNewLinkConfirmation: {
    en: 'You already have an active payment link for {product} ({amount}).\n\n🔗 [Click here to open your existing link]({link})\n\nWould you like to create a **new payment link** instead? Reply "yes" to start over or "no" to keep the current one.',
    es: 'Ya tienes un enlace de pago activo para {product} ({amount}).\n\n🔗 [Haz clic aquí para abrir tu enlace existente]({link})\n\n¿Deseas crear un **nuevo enlace de pago**? Responde "sí" para empezar de nuevo o "no" para mantener el actual.',
  },
};

function t(key: keyof typeof messages, locale: string = 'es'): string {
  const msg = messages[key];
  if (typeof msg === 'object' && msg !== null) {
    return (msg as Record<string, string>)[locale] || (msg as Record<string, string>).es || '';
  }
  return '';
}

@Injectable()
export class PaymentFlowService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Check if message contains payment intent
   */
  private isPaymentIntent(message: string): boolean {
    const normalized = message.toLowerCase().trim();

    // First check the regex
    if (PAYMENT_INTENT_REGEX.test(normalized)) {
      return true;
    }

    // Also check for exact keyword matches
    return PAYMENT_KEYWORDS.some(keyword => normalized.includes(keyword.toLowerCase()));
  }

  /**
   * Format amount for display
   */
  private formatAmount(amountCents: number, currency: string): string {
    const amount = amountCents / 100;
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  }

  /**
   * Extract product selection from message (e.g., "1", "2", or product name)
   */
  private extractProductSelection(
    message: string,
    products: Array<{ id: string; name: string; productCode: string }>,
  ): { productId: string; productName: string } | null {
    const trimmed = message.trim();

    // Check for numeric selection (e.g., "1", "2")
    const numberMatch = trimmed.match(/^(\d+)$/);
    if (numberMatch) {
      const index = parseInt(numberMatch[1], 10) - 1;
      if (index >= 0 && index < products.length) {
        return {
          productId: products[index].id,
          productName: products[index].name,
        };
      }
    }

    // Check for product name match
    const lowerMessage = trimmed.toLowerCase();
    for (const product of products) {
      if (
        lowerMessage.includes(product.name.toLowerCase()) ||
        lowerMessage.includes(product.productCode.toLowerCase())
      ) {
        return {
          productId: product.id,
          productName: product.name,
        };
      }
    }

    return null;
  }

  /**
   * Validate name (not empty, not a number/amount)
   */
  private isValidName(name: string): boolean {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) {
      return false;
    }
    // Reject if it looks like an amount (e.g., "100", "50.00")
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      return false;
    }
    return true;
  }

  /**
   * Validate email
   */
  private isValidEmail(email: string): boolean {
    return EMAIL_REGEX.test(email.trim());
  }

  /**
   * Resolve tenant base URL for payment links
   * Priority: 1. tenant.domain, 2. tenant.subdomain + rootDomain, 3. settings.rootDomain, 4. env ROOT_DOMAIN
   */
  private async resolveTenantBaseUrl(tenantId: string | null): Promise<string> {
    const rootDomain = process.env.ROOT_DOMAIN || process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'flowcast.chat';

    // Try to get from tenant
    if (tenantId) {
      try {
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { domain: true, subdomain: true, settings: true },
        });

        if (tenant) {
          // Priority 1: Custom domain (e.g., pay.matmax.com)
          if (tenant.domain) {
            const finalUrl = `https://${tenant.domain}`;
            console.log('[PaymentFlowService] 🔗 Using tenant custom domain:', {
              tenantId,
              domain: tenant.domain,
              finalUrl,
            });
            return finalUrl;
          }

          // Priority 2: Subdomain (e.g., matmax.flowcast.chat)
          if (tenant.subdomain) {
            const finalUrl = `https://${tenant.subdomain}.${rootDomain}`;
            console.log('[PaymentFlowService] 🔗 Using tenant subdomain:', {
              tenantId,
              subdomain: tenant.subdomain,
              rootDomain,
              finalUrl,
            });
            return finalUrl;
          }

          // Priority 3: Settings rootDomain
          if (tenant.settings && typeof tenant.settings === 'object') {
            const settings = tenant.settings as any;
            if (settings.rootDomain) {
              const finalUrl = `https://${settings.rootDomain}`;
              console.log('[PaymentFlowService] 🔗 Using tenant settings rootDomain:', {
                tenantId,
                settingsRootDomain: settings.rootDomain,
                finalUrl,
              });
              return finalUrl;
            }
          }
        }
      } catch (error) {
        console.warn('[PaymentFlowService] Error getting tenant domain:', error);
      }
    }

    // Fallback to environment variable or default
    const finalUrl = `https://${rootDomain}`;
    console.log('[PaymentFlowService] 🔗 Using fallback root domain:', {
      tenantId,
      rootDomain,
      finalUrl,
    });
    return finalUrl;
  }

  /**
   * Find or create payment link. tenantId is REQUIRED - each tenant has their own payment config.
   */
  private async ensurePaymentLink(params: {
    productId: string;
    sessionId?: string;
    tenantId: string; // Required - no null allowed
    customerName?: string | null;
    customerEmail?: string | null;
    amountCents: number;
    currency: string;
  }): Promise<{ token: string; existing: boolean }> {
    // Validate tenantId is provided
    if (!params.tenantId) {
      throw new Error('tenantId is required for creating payment links. Each tenant must have their own payment configuration.');
    }

    // Try to find existing link with same parameters
    const existingLink = await this.prisma.paymentLink.findFirst({
      where: {
        productId: params.productId,
        sessionId: params.sessionId || null,
        tenantId: params.tenantId,
        customerEmail: params.customerEmail || null,
        status: { in: ['pending', 'processing'] },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (existingLink) {
      console.log('[PaymentFlowService] ✅ Found existing payment link:', {
        token: existingLink.token,
        productId: params.productId,
        tenantId: params.tenantId,
      });
      return { token: existingLink.token, existing: true };
    }

    console.log('[PaymentFlowService] 🆕 Creating new payment link:', {
      productId: params.productId,
      amountCents: params.amountCents,
      customerEmail: params.customerEmail,
      tenantId: params.tenantId,
    });

    // Create new link
    const product = await this.prisma.paymentProduct.findUnique({
      where: { id: params.productId },
      include: {
        paymentTax: true,
      },
    });

    if (!product) {
      throw new Error(`Product not found: ${params.productId}`);
    }

    const token = generateToken();
    const id = generateId();
    await this.prisma.paymentLink.create({
      data: {
        id,
        token,
        productId: params.productId,
        sessionId: params.sessionId,
        tenantId: params.tenantId,
        amountCents: params.amountCents,
        baseAmountCents: product.baseAmountCents,
        taxAmountCents: product.taxAmountCents,
        taxId: product.taxId,
        taxRateBps: product.paymentTax?.rateBps ?? null,
        currency: params.currency,
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        status: 'pending',
        channel: 'chatbot',
        updatedAt: new Date(),
      },
    });

    return { token, existing: false };
  }

  /**
   * Handle payment flow - checks for payment intents and handles them
   * Returns null if message should go to AI, or a response if payment flow handled it
   * This matches the frontend payment-flow-handler.ts behavior exactly
   */
  async handlePaymentFlow(
    message: string,
    sessionId?: string,
    tenantId?: string | null,
    conversationContext?: Record<string, any>,
  ): Promise<PaymentFlowResult> {
    try {
      console.log('[PaymentFlowService] ========== PAYMENT FLOW HANDLER CALLED ==========');
      console.log('[PaymentFlowService] Input:', {
        message: message.substring(0, 100),
        messageLength: message.length,
        sessionId,
        tenantId,
        hasConversationContext: !!conversationContext,
        conversationContextKeys: conversationContext ? Object.keys(conversationContext) : [],
      });

      // Get payment context from conversation context
      const paymentContext: PaymentContext = conversationContext?.paymentContext || createEmptyPaymentContext();
      const locale = conversationContext?.language || 'es';

      console.log('[PaymentFlowService] Payment context loaded:', {
        stage: paymentContext.stage,
        productId: paymentContext.productId,
        productName: paymentContext.productName,
        hasContext: !!conversationContext?.paymentContext,
        fullContext: paymentContext,
      });

      // Check if we should continue processing this message
      const normalized = message.toLowerCase().trim();
      const hasPaymentIntent = this.isPaymentIntent(message);
      const inActiveFlow = paymentContext.stage !== 'idle' && paymentContext.stage !== 'completed';

      console.log('[PaymentFlowService] Intent detection:', {
        normalizedMessage: normalized,
        hasPaymentIntent,
        inActiveFlow,
        currentStage: paymentContext.stage,
        willProcessMessage: hasPaymentIntent || inActiveFlow,
      });

      if (!hasPaymentIntent && !inActiveFlow) {
        console.log('[PaymentFlowService] ❌ No payment intent and not in active flow, delegating to AI');
        return { handled: false, shouldUseAI: true };
      }

      if (!tenantId) {
        console.warn('[PaymentFlowService] ⚠️ payment intent detected but tenantId is missing. Skipping product fetch.');
        // If we can't identify the tenant, we shouldn't show any products (prevent cross-tenant leak)
        // But we might still want to let AI handle it or say "Configuration error"
        // For now, let's treat it as "no products"
      }

      // Get active products for this tenant
      const products = tenantId ? await this.prisma.paymentProduct.findMany({
        where: {
          isActive: true,
          tenantId
        },
        select: {
          id: true,
          name: true,
          productCode: true,
          amountCents: true,
          currency: true,
          baseAmountCents: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }) : [];

      console.log('[PaymentFlowService] Products fetched:', {
        count: products.length,
        productNames: products.map(p => p.name),
      });

      // Handle completed stage with new payment intent
      if (paymentContext.stage === 'completed' && paymentContext.linkUrl && hasPaymentIntent) {
        const amount = this.formatAmount(paymentContext.amountCents!, paymentContext.currency!);
        const response = t('paymentNewLinkConfirmation', locale)
          .replace('{product}', paymentContext.productName!)
          .replace('{amount}', amount)
          .replace('{link}', paymentContext.linkUrl!);

        const updatedContext: PaymentContext = {
          ...paymentContext,
          stage: 'awaiting_new_link_confirmation',
        };

        return {
          handled: true,
          response,
          updatedPaymentContext: updatedContext,
          shouldUseAI: false,
        };
      }

      // Handle new link confirmation
      if (paymentContext.stage === 'awaiting_new_link_confirmation') {
        const messageLower = message.toLowerCase().trim();
        const isPositive = /^(s[ií]|yes|y|afirmativo|ok|confirmar|nuevo)$/i.test(messageLower);
        const isNegative = /^(no|n|negativo|mantener|conservar|keep)$/i.test(messageLower);

        if (isPositive) {
          // Reset to idle and start new flow
          const resetContext = createEmptyPaymentContext();

          if (products.length === 0) {
            return {
              handled: true,
              response: t('paymentNoProducts', locale),
              updatedPaymentContext: resetContext,
              shouldUseAI: false,
            };
          }

          const productsList = products
            .map((product, index) => {
              const amount = this.formatAmount(product.amountCents, product.currency);
              return `${index + 1}. ${product.name} - ${amount}`;
            })
            .join('\n\n');

          const response = t('paymentAskProduct', locale).replace('{options}', productsList);

          const updatedContext: PaymentContext = {
            ...resetContext,
            stage: 'awaiting_product',
          };

          return {
            handled: true,
            response,
            updatedPaymentContext: updatedContext,
            shouldUseAI: false,
          };
        } else if (isNegative) {
          // Show existing link
          const amount = this.formatAmount(paymentContext.amountCents!, paymentContext.currency!);
          const response = t('paymentLinkExisting', locale)
            .replace('{product}', paymentContext.productName!)
            .replace('{amount}', amount)
            .replace('{link}', paymentContext.linkUrl!);

          const updatedContext: PaymentContext = {
            ...paymentContext,
            stage: 'completed',
          };

          return {
            handled: true,
            response,
            updatedPaymentContext: updatedContext,
            shouldUseAI: false,
          };
        } else {
          // Invalid response, ask again
          const amount = this.formatAmount(paymentContext.amountCents!, paymentContext.currency!);
          const response = t('paymentNewLinkConfirmation', locale)
            .replace('{product}', paymentContext.productName!)
            .replace('{amount}', amount)
            .replace('{link}', paymentContext.linkUrl!);

          return {
            handled: true,
            response,
            updatedPaymentContext: paymentContext,
            shouldUseAI: false,
          };
        }
      }

      // Stage: idle -> Check if payment intent detected
      if (paymentContext.stage === 'idle') {
        console.log('[PaymentFlowService] 📍 Stage: IDLE - Checking for payment intent');
        if (hasPaymentIntent) {
          console.log('[PaymentFlowService] ✅ Payment intent detected in IDLE stage!');
          if (products.length === 0) {
            console.log('[PaymentFlowService] ❌ No products available');
            return {
              handled: true,
              response: t('paymentNoProducts', locale),
              updatedPaymentContext: paymentContext,
              shouldUseAI: false,
            };
          }

          const productsList = products
            .map((product, index) => {
              const amount = this.formatAmount(product.amountCents, product.currency);
              return `${index + 1}. ${product.name} - ${amount}`;
            })
            .join('\n\n');

          const response = t('paymentAskProduct', locale).replace('{options}', productsList);

          const updatedContext: PaymentContext = {
            ...paymentContext,
            stage: 'awaiting_product',
          };

          console.log('[PaymentFlowService] 📤 Returning product list response:', {
            responseLength: response.length,
            responsePreview: response.substring(0, 100),
            newStage: 'awaiting_product',
          });

          return {
            handled: true,
            response,
            updatedPaymentContext: updatedContext,
            shouldUseAI: false,
          };
        }

        console.log('[PaymentFlowService] ℹ️ No payment intent in IDLE stage, delegating to AI');
        return { handled: false, shouldUseAI: true };
      }

      // Stage: awaiting_product -> User selects product
      if (paymentContext.stage === 'awaiting_product') {
        const selection = this.extractProductSelection(message, products);

        if (!selection) {
          // Product not found, ask again
          const productsList = products
            .map((product, index) => {
              const amount = this.formatAmount(product.amountCents, product.currency);
              return `${index + 1}. ${product.name} - ${amount}`;
            })
            .join('\n\n');

          const response = t('paymentAskProduct', locale).replace('{options}', productsList);

          return {
            handled: true,
            response,
            updatedPaymentContext: paymentContext,
            shouldUseAI: false,
          };
        }

        const selectedProduct = products.find(p => p.id === selection.productId);
        if (!selectedProduct) {
          return { handled: false, shouldUseAI: true };
        }

        // Move to awaiting_name stage
        const updatedContext: PaymentContext = {
          ...paymentContext,
          stage: 'awaiting_name',
          productId: selection.productId,
          productName: selection.productName,
          amountCents: selectedProduct.amountCents,
          currency: selectedProduct.currency,
        };

        const response = t('paymentAskName', locale).replace('{product}', selection.productName);

        return {
          handled: true,
          response,
          updatedPaymentContext: updatedContext,
          shouldUseAI: false,
        };
      }

      // Stage: awaiting_name -> User provides name
      if (paymentContext.stage === 'awaiting_name') {
        if (!this.isValidName(message)) {
          const response = t('paymentAskNameRetry', locale);
          return {
            handled: true,
            response,
            updatedPaymentContext: paymentContext,
            shouldUseAI: false,
          };
        }

        const customerName = message.trim();

        // Move to awaiting_email stage
        const updatedContext: PaymentContext = {
          ...paymentContext,
          stage: 'awaiting_email',
          customerName,
          nameConfirmed: true,
        };

        const response = t('paymentAskEmail', locale).replace('{name}', customerName);

        return {
          handled: true,
          response,
          updatedPaymentContext: updatedContext,
          shouldUseAI: false,
        };
      }

      // Stage: awaiting_email -> User provides email
      if (paymentContext.stage === 'awaiting_email') {
        if (!this.isValidEmail(message)) {
          const response = t('paymentAskEmailRetry', locale);
          return {
            handled: true,
            response,
            updatedPaymentContext: paymentContext,
            shouldUseAI: false,
          };
        }

        const customerEmail = message.trim().toLowerCase();

        // Move to awaiting_confirmation stage
        const updatedContext: PaymentContext = {
          ...paymentContext,
          stage: 'awaiting_confirmation',
          customerEmail,
          emailConfirmed: true,
        };

        const amount = this.formatAmount(paymentContext.amountCents!, paymentContext.currency!);
        const response = t('paymentConfirmDetails', locale)
          .replace('{product}', paymentContext.productName!)
          .replace('{amount}', amount)
          .replace('{name}', paymentContext.customerName!)
          .replace('{email}', customerEmail);

        return {
          handled: true,
          response,
          updatedPaymentContext: updatedContext,
          shouldUseAI: false,
        };
      }

      // Stage: awaiting_confirmation -> User confirms payment details
      if (paymentContext.stage === 'awaiting_confirmation') {
        const messageLower = message.toLowerCase().trim();
        const isPositive = /^(sí|si|confirmar|confirmo|correcto|está bien|está correcto|ok|vale|perfecto|yes|y|confirm|sure|correct|that's right|that's correct|perfect)$/i.test(messageLower);
        const isNegative = /^(no|n|incorrecto|corregir|cambiar|modificar|editar|otra vez|wrong|incorrect|change|modify|edit|again)$/i.test(messageLower);

        if (isNegative) {
          // Reset to product selection
          const resetContext: PaymentContext = {
            ...createEmptyPaymentContext(),
            productId: paymentContext.productId,
            productName: paymentContext.productName,
          };

          return {
            handled: true,
            response: t('paymentFlowReset', locale),
            updatedPaymentContext: resetContext,
            shouldUseAI: false,
          };
        }

        if (!isPositive) {
          // Invalid confirmation, ask again
          const amount = this.formatAmount(paymentContext.amountCents!, paymentContext.currency!);
          const response = t('paymentConfirmDetails', locale)
            .replace('{product}', paymentContext.productName!)
            .replace('{amount}', amount)
            .replace('{name}', paymentContext.customerName!)
            .replace('{email}', paymentContext.customerEmail!);

          return {
            handled: true,
            response,
            updatedPaymentContext: paymentContext,
            shouldUseAI: false,
          };
        }

        // Confirmation received - generate payment link
        // Validate tenantId is present - required for payment configuration
        if (!tenantId) {
          console.error('[PaymentFlowService] ❌ Cannot generate payment link: tenantId is required');
          return {
            handled: true,
            response: '❌ Error: No se puede generar el enlace de pago. Se requiere configuración del tenant. Por favor contacte al administrador.',
            updatedPaymentContext: paymentContext,
            shouldUseAI: false,
          };
        }

        try {
          const baseUrl = await this.resolveTenantBaseUrl(tenantId);
          const linkResult = await this.ensurePaymentLink({
            productId: paymentContext.productId!,
            sessionId,
            tenantId, // Now guaranteed to be non-null
            customerName: paymentContext.customerName,
            customerEmail: paymentContext.customerEmail!,
            amountCents: paymentContext.amountCents!,
            currency: paymentContext.currency!,
          });

          const linkUrl = `${baseUrl}/pay/${linkResult.token}`;
          const amount = this.formatAmount(paymentContext.amountCents!, paymentContext.currency!);

          // Move to completed stage
          const updatedContext: PaymentContext = {
            ...paymentContext,
            stage: 'completed',
            confirmed: true,
            linkToken: linkResult.token,
            linkUrl,
            linkRoute: `/pay/${linkResult.token}`,
            lastGeneratedAt: new Date().toISOString(),
          };

          // If existing link, show it. If new, return empty string (Silent Mode)
          let response = '';

          if (linkResult.existing) {
            response = t('paymentLinkExisting', locale)
              .replace('{product}', paymentContext.productName!)
              .replace('{amount}', amount)
              .replace('{link}', linkUrl);
          }

          console.log('[PaymentFlowService] ✅ Payment link generated successfully:', {
            linkUrl,
            linkToken: linkResult.token,
            existing: linkResult.existing,
            responsePreview: response.substring(0, 100),
          });

          return {
            handled: true,
            response,
            updatedPaymentContext: updatedContext,
            shouldUseAI: false,
          };
        } catch (error) {
          console.error('[PaymentFlowService] ❌ Error generating payment link:', error);
          if (error instanceof Error) {
            console.error('[PaymentFlowService] Stack:', error.stack);
          }
          return {
            handled: true,
            response: t('paymentLinkError', locale),
            updatedPaymentContext: paymentContext,
            shouldUseAI: false,
          };
        }
      }

      // Other stages or unknown state - let AI handle
      return { handled: false, shouldUseAI: true };
    } catch (error) {
      console.error('[PaymentFlowService] Error handling payment flow:', error);
      // On error, let AI handle it
      return { handled: false, shouldUseAI: true };
    }
  }
}
