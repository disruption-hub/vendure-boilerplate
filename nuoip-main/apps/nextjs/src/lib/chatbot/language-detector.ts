import { CustomOpenRouter } from '@/lib/chatbot/custom-openrouter'
import { createLogger } from '@/lib/utils/logger'

const logger = createLogger('chatbot-language-detector')

export type SupportedLanguage = 'en' | 'es'

const SPANISH_INDICATORS = [
  'hola',
  'qué',
  'como',
  'cómo',
  'cuándo',
  'dónde',
  'gracias',
  'necesito',
  'quiero',
  'ayuda',
  'precio',
  'cita',
  'horario',
  'agenda',
]

export async function detectLanguage(message: string, fallback: SupportedLanguage = 'en'): Promise<SupportedLanguage> {
  const normalized = message.toLowerCase()
  if (/[áéíóúñ¡¿]/i.test(message)) {
    return 'es'
  }
  if (SPANISH_INDICATORS.some(indicator => normalized.includes(indicator))) {
    return 'es'
  }

  if (message.length < 10) {
    return fallback
  }

  try {
    const client = new CustomOpenRouter()
    const response = await client.chat([
      {
        role: 'system',
        content:
          'Detect the language of the next message. Reply with "en" for English or "es" for Spanish. Respond with only the two-letter code.',
      },
      { role: 'user', content: message },
    ])

    const detected = response.choices[0]?.message?.content?.trim().toLowerCase()
    if (detected === 'es' || detected === 'en') {
      return detected
    }
  } catch (error) {
    logger.warn('OpenRouter language detection failed, using fallback', {
      error: error instanceof Error ? error.message : 'unknown-error',
    })
  }

  return fallback
}

export function detectLanguageSync(message: string): SupportedLanguage {
  const normalized = message.toLowerCase()
  return SPANISH_INDICATORS.some(indicator => normalized.includes(indicator)) ? 'es' : 'en'
}
