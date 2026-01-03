import type { FlowConfig } from './types'

export const DEFAULT_FLOW_CONFIG_VERSION = 1

export const DEFAULT_FLOW_CONFIG: FlowConfig = {
  version: DEFAULT_FLOW_CONFIG_VERSION,
  states: {
    GREETING: {
      description: 'Initial greeting before intents are gathered',
    },
    AWAITING_INTENT: {
      description: 'Listening for the primary intent from the user',
    },
    COLLECTING_NAME: {
      description: 'Collecting or validating the user name before scheduling',
    },
    COLLECTING_EMAIL: {
      description: 'Collecting or validating the user email before scheduling',
    },
    COLLECTING_PHONE: {
      description: 'Optionally collecting phone number after email',
    },
    SHOWING_SLOTS: {
      description: 'Presenting available schedule slots and handling navigation',
    },
    CONFIRMING: {
      description: 'Confirming the selected slot before booking',
    },
    COMPLETED: {
      description: 'Appointment booked – conversation can continue or restart',
    },
  },
  messages: {
    greeting: {
      en: "Hi there! I'm FlowBot. I can help you schedule an appointment, look up trademarks, and answer questions. How can I help today?",
      es: '¡Hola! Soy FlowBot. Puedo ayudarte a consultar registros, reservar citas y responder dudas. ¿En qué puedo ayudarte?',
    },
    askName: {
      en: "Great! What's your name?",
      es: '¡Perfecto! ¿Cuál es tu nombre?',
    },
    askEmail: {
      en: 'Perfect, {name}! And your email?',
      es: '¡Excelente, {name}! ¿Y tu correo electrónico?',
    },
    askPhone: {
      en: 'Last thing - phone number? (You can skip this if you prefer)',
      es: 'Última cosa - ¿número de teléfono? (Puedes omitir esto si prefieres)',
    },
    phoneDeclined: {
      en: 'No problem! Moving on.',
      es: '¡Sin problema! Continuemos.',
    },
    invalidEmail: {
      en: "Hmm, that doesn't look like an email. Could you double-check it?",
      es: 'Hmm, eso no parece un correo. ¿Podrías verificarlo?',
    },
    invalidPhone: {
      en: 'That phone number seems off. Try again?',
      es: 'Ese número de teléfono parece incorrecto. ¿Intentas de nuevo?',
    },
    showingSlots: {
      en: "Here's what I have this week:",
      es: 'Esto es lo que tengo esta semana:',
    },
    confirmSlot: {
      en: 'Perfect! I have you down for {slot}. Confirm?',
      es: '¡Perfecto! Te tengo agendado para {slot}. ¿Confirmas?',
    },
    bookingConfirmed: {
      en: 'All set, {name}! 🎉\n\nYour appointment: {slot}\nConfirmation sent to: {email}\nCalendar invite sent!\n\nSee you then!',
      es: '¡Todo listo, {name}! 🎉\n\nTu cita: {slot}\nConfirmación enviada a: {email}\n¡Invitación de calendario enviada!\n\n¡Nos vemos!',
    },
    schedulePromptDecline: {
      en: 'No worries! Let me know if you need anything else.',
      es: '¡Sin problema! Si necesitas algo más, me avisas.',
    },
    pricingGuardRail: {
      en: "I'd love to discuss pricing! Best way is during an appointment where we can personalize options for you. Want to schedule?",
      es: '¡Me encantaría hablar sobre precios! La mejor manera es durante una cita donde podemos personalizar opciones para ti. ¿Quieres agendar?',
    },
    offTopicGuardRail: {
      en: "I appreciate the chat! I'm here to help you schedule an appointment and answer questions about our services. What would you like to know?",
      es: '¡Aprecio la charla! Estoy aquí para ayudarte a agendar una cita y responder preguntas sobre nuestros servicios. ¿Qué te gustaría saber?',
    },
    harmfulGuardRail: {
      en: "I'm here to help with appointment scheduling and product questions. Let's keep our conversation focused on that!",
      es: 'Estoy aquí para ayudarte con la programación de citas y preguntas sobre nuestros servicios. ¡Mantengamos la conversación enfocada en eso!',
    },
    invalidIntent: {
      en: "Let's tackle one thing at a time. Could you let me know what you'd like help with next?",
      es: 'Vamos paso a paso. ¿Podrías decirme con qué te gustaría que te ayude ahora?',
    },
    stateRecovery: {
      en: "To keep things clear, I'm returning to the main menu. Tell me if you want information or to book a time.",
      es: 'Para mantener todo claro, volvamos al punto principal. Dime si quieres información o agendar una cita.',
    },
    retryName: {
      en: [
        'Could you tell me your name again?',
        "Just want to make sure - what's your name?",
        'One more time - your name?',
      ],
      es: [
        '¿Podrías decirme tu nombre de nuevo?',
        'Solo para asegurarme - ¿cuál es tu nombre?',
        'Una vez más - ¿tu nombre?',
      ],
    },
    retryEmail: {
      en: [
        "That doesn't look quite right. Your email?",
        'Could you double-check that email?',
        'Hmm, try the email again?',
      ],
      es: [
        'Eso no parece correcto. ¿Tu correo?',
        '¿Podrías verificar ese correo?',
        'Hmm, ¿intentas el correo de nuevo?',
      ],
    },
    retryPhone: {
      en: [
        'That phone number seems off. Try again?',
        'Could you check that number?',
        'One more time with the phone?',
      ],
      es: [
        'Ese número parece incorrecto. ¿Intentas de nuevo?',
        '¿Podrías verificar ese número?',
        'Una vez más con el teléfono?',
      ],
    },
    sessionResume: {
      en: 'Hi again {name}! Let\'s pick up where we left off.',
      es: '¡Hola de nuevo {name}! Retomemos donde nos quedamos.',
    },
    paymentNoProducts: {
      en: 'I checked our catalog but there are no active products available for payment right now. Please contact support so we can get this resolved.',
      es: 'Revisé nuestro catálogo pero no hay productos activos disponibles para pago en este momento. Por favor contacta a soporte para resolverlo.',
    },
    paymentAskProduct: {
      en: '💳 **AVAILABLE PRODUCTS**\n\n{options}\n\n📋 To select, type the number (e.g., 1) or product name.',
      es: '💳 **PRODUCTOS DISPONIBLES**\n\n{options}\n\n📋 Para seleccionar, escribe el número (ej: 1) o el nombre del producto.',
    },
    paymentAskName: {
      en: 'Before I generate the link for {product}, could you share the payer’s full name?',
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
      en: "I'm not sure that was an email address. Could you share it again?",
      es: 'No estoy seguro de que eso haya sido un correo electrónico. ¿Podrías compartirlo nuevamente?',
    },
    paymentFlowReset: {
      en: "Let's restart that payment request to make sure everything is accurate. Just tell me what you'd like to pay for again.",
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
    paymentHistoryIntro: {
      en: 'Here are the latest {count} payment links:',
      es: 'Estos son los últimos {count} enlaces de pago:',
    },
    paymentHistoryEmpty: {
      en: 'You do not have any payment links yet. Create one and I will list it here instantly.',
      es: 'Aún no tienes enlaces de pago. Crea uno y lo mostraré aquí de inmediato.',
    },
    paymentHistoryMorePrompt: {
      en: 'Want more details? Say “5 more” to load additional links.',
      es: '¿Quieres ver más? Di “5 más” para cargar enlaces adicionales.',
    },
    paymentHistoryNoMore: {
      en: 'That’s everything I have for now.',
      es: 'Eso es todo lo que tengo por ahora.',
    },
    paymentHistorySummary: {
      en: 'Summary: {segments}',
      es: 'Resumen: {segments}',
    },
    paymentHistoryFieldStatus: {
      en: 'Status',
      es: 'Estado',
    },
    paymentHistoryFieldUpdated: {
      en: 'Updated',
      es: 'Actualizado',
    },
    paymentHistoryFieldCustomer: {
      en: 'Customer',
      es: 'Cliente',
    },
    paymentHistoryFieldLink: {
      en: 'Token',
      es: 'Token',
    },
    paymentHistoryFieldNone: {
      en: 'Not provided',
      es: 'Sin datos',
    },
    paymentStatusPending: {
      en: 'Pending',
      es: 'Pendiente',
    },
    paymentStatusProcessing: {
      en: 'Processing',
      es: 'Procesando',
    },
    paymentStatusCompleted: {
      en: 'Completed',
      es: 'Completado',
    },
    paymentStatusFailed: {
      en: 'Failed',
      es: 'Fallido',
    },
    paymentStatusExpired: {
      en: 'Expired',
      es: 'Vencido',
    },
    paymentStatusCancelled: {
      en: 'Cancelled',
      es: 'Cancelado',
    },
  },
  intentLabels: {
    ANY: 'Fallback',
    SCHEDULE_APPOINTMENT: 'Schedule appointment',
    CONFIRM_APPOINTMENT: 'Confirm appointment',
    PROVIDE_NAME: 'Provide name',
    PROVIDE_EMAIL: 'Provide email',
    PROVIDE_PHONE: 'Provide phone',
    DECLINE_PHONE: 'Decline phone',
    SELECT_TIME_SLOT: 'Select slot',
    REQUEST_NEXT_WEEK: 'Show next week',
    REQUEST_SPECIFIC_DATE: 'Specific date',
    ASK_QUESTION: 'Ask question',
    PRICING_QUESTION: 'Pricing question',
    TECHNICAL_SPECS: 'Technical specs',
    COMPANY_INFO: 'Company info',
    GREETING: 'Greeting',
    OFF_TOPIC: 'Off topic',
    HARMFUL_CONTENT: 'Guard rail',
    VIEW_PAYMENT_HISTORY: 'Payment history',
    UNKNOWN: 'Unknown',
  },
  categories: {
    GREETING: 'core',
    AWAITING_INTENT: 'core',
    COLLECTING_NAME: 'profile',
    COLLECTING_EMAIL: 'profile',
    COLLECTING_PHONE: 'profile',
    SHOWING_SLOTS: 'appointment',
    CONFIRMING: 'appointment',
    COMPLETED: 'core',
  },
  shapes: {
    GREETING: 'stadium',
    AWAITING_INTENT: 'diamond',
    COMPLETED: 'circle',
  },
  overlays: [
    {
      id: 'payment',
      name: 'Payment Overlay',
      description: 'Visualize the payment collection flow layered on top of the main conversation.',
      enabled: true,
      nodes: [
        {
          id: 'PAYMENT_INTENT',
          title: 'Payment Intent',
          description: 'Payment keywords detected; switch to payment context.',
          category: 'payment',
          shape: 'stadium',
        },
        {
          id: 'PAYMENT_PRODUCT',
          title: 'Select Product',
          description: 'List catalog with numeric shortcuts; enforce configured pricing.',
          category: 'payment',
        },
        {
          id: 'PAYMENT_NAME',
          title: 'Collect Payer Name',
          description: 'Reject amount-like inputs and store confirmed name.',
          category: 'payment',
        },
        {
          id: 'PAYMENT_EMAIL',
          title: 'Collect Email',
          description: 'Validate address before issuing link.',
          category: 'payment',
        },
        {
          id: 'PAYMENT_READY',
          title: 'Link Issued',
          description: 'Reuse or mint catalog-priced link and persist metadata.',
          category: 'payment',
          shape: 'circle',
        },
        {
          id: 'PAYMENT_HISTORY',
          title: 'History & Reports',
          description: 'List recent payment links with pagination inside the chatbot.',
          category: 'payment',
        },
      ],
      edges: [
        { from: 'AWAITING_INTENT', to: 'PAYMENT_INTENT', label: 'Payment keywords', category: 'payment' },
        { from: 'AWAITING_INTENT', to: 'PAYMENT_HISTORY', label: '“Links pagados” intent', category: 'payment', dashed: true },
        { from: 'PAYMENT_INTENT', to: 'PAYMENT_PRODUCT', label: 'Catalog item chosen', category: 'payment' },
        { from: 'PAYMENT_PRODUCT', to: 'PAYMENT_NAME', label: 'Awaiting confirmed name', category: 'payment' },
        { from: 'PAYMENT_NAME', to: 'PAYMENT_EMAIL', label: 'Awaiting confirmed email', category: 'payment' },
        { from: 'PAYMENT_EMAIL', to: 'PAYMENT_READY', label: 'Link generated', category: 'payment' },
        { from: 'PAYMENT_READY', to: 'COMPLETED', label: 'Link delivered', category: 'payment' },
        { from: 'PAYMENT_HISTORY', to: 'AWAITING_INTENT', label: 'User continues chat', category: 'payment', dashed: true },
      ],
    },
    {
      id: 'knowledge',
      name: 'Knowledge Overlay',
      description: 'Optional knowledge-base responses layered on the core flow.',
      enabled: true,
      nodes: [
        {
          id: 'KNOWLEDGE_RESPONSE',
          title: 'Knowledge Response',
          description: 'Resolve FAQ or info request without scheduling.',
          category: 'knowledge',
        },
      ],
      edges: [
        { from: 'AWAITING_INTENT', to: 'KNOWLEDGE_RESPONSE', label: 'FAQ detected', category: 'knowledge', dashed: true },
        { from: 'KNOWLEDGE_RESPONSE', to: 'COMPLETED', label: 'Answer satisfied user', category: 'knowledge', dashed: true },
      ],
    },
  ],
  quickActions: [
    {
      id: 'see-schedule',
      action: 'Muéstrame horarios',
      labels: {
        en: 'See available slots',
        es: 'Ver horarios disponibles',
      },
    },
    {
      id: 'see-products',
      action: 'show_products',
      labels: {
        en: 'Show available products',
        es: 'Ver productos disponibles',
      },
    },
    {
      id: 'search-trademark',
      action: 'Buscar marca',
      labels: {
        en: 'Search a trademark',
        es: 'Buscar una marca',
      },
    },
    {
      id: 'speak-agent',
      action: 'Hablar con un asesor',
      labels: {
        en: 'Talk to an advisor',
        es: 'Hablar con un asesor',
      },
    },
  ],
}
