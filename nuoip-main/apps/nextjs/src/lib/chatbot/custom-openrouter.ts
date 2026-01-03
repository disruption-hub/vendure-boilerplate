import { getOpenRouterConfig } from '@/lib/services/admin'

// Custom OpenRouter client to replace LangChain ChatOpenAI
export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenRouterResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface StreamChunk {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role?: string
      content?: string
    }
    finish_reason?: string
  }>
}

export class CustomOpenRouter {
  private apiKey = ''
  private baseURL = 'https://openrouter.ai/api/v1'

  constructor(apiKey?: string, baseUrl?: string) {
    if (apiKey?.trim()) {
      this.apiKey = apiKey.trim()
    }
    if (baseUrl?.trim()) {
      this.baseURL = baseUrl.trim()
    }
  }

  private async ensureConfiguration(): Promise<void> {
    if (this.apiKey) {
      return
    }

    const config = await getOpenRouterConfig()
    if (!config?.apiKey) {
      throw new Error('OpenRouter API key is required but not configured')
    }

    this.apiKey = config.apiKey
    if (config.baseUrl?.trim()) {
      this.baseURL = config.baseUrl.trim()
    }
  }

  async chat(messages: Message[], options: {
    model?: string
    temperature?: number
    max_tokens?: number
    stream?: boolean
  } = {}): Promise<OpenRouterResponse> {
    await this.ensureConfiguration()

    const {
      model = 'anthropic/claude-3-haiku',
      temperature = 0.7,
      max_tokens = 1000,
      stream = false
    } = options

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ip-nuo.vercel.app',
        'X-Title': 'IP Nuo Trademark Analytics'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
        stream
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  async *streamChat(messages: Message[], options: {
    model?: string
    temperature?: number
    max_tokens?: number
  } = {}): AsyncGenerator<StreamChunk, void, unknown> {
    await this.ensureConfiguration()

    const {
      model = 'anthropic/claude-3-haiku',
      temperature = 0.7,
      max_tokens = 1000
    } = options

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ip-nuo.vercel.app',
        'X-Title': 'IP Nuo Trademark Analytics'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
        stream: true
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('No response body reader available')
    }

    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line for next iteration

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data) as StreamChunk
              yield parsed
            } catch {
              // Skip invalid JSON
              console.warn('Invalid JSON in stream:', data)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }
}

