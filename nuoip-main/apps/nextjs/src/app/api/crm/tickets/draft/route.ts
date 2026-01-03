"use server"

import { NextRequest, NextResponse } from 'next/server'

interface DraftRequest {
    tenantId: string
    currentUserId: string
    customer?: {
        id: string
        name: string
        email?: string | null
        phone?: string | null
    } | null
    existingDraft?: {
        title?: string
        description?: string
        priority?: string
        tags?: string[]
    }
    recentTickets?: Array<{
        title: string
        summary?: string | null
        status: string
        priority: string
    }>
    conversationContext?: Array<{
        role: string
        content: string
        timestamp?: string
    }>
}

interface OpenRouterConfig {
    apiKey: string
    baseUrl?: string
}

async function getOpenRouterConfigFromBackend(authToken?: string | null): Promise<OpenRouterConfig | null> {
    try {
        const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        }

        // Include authorization if provided
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`
        }

        // Use the CRM endpoint which is accessible to operators (unlike admin endpoint)
        const response = await fetch(`${backendUrl}/api/v1/crm/system/openrouter`, {
            method: 'GET',
            headers,
            cache: 'no-store',
        })

        if (!response.ok) {
            console.warn('[draft] Failed to get OpenRouter config from backend:', response.status, response.statusText)
            // Try environment variable as fallback
            return getOpenRouterConfigFromEnv()
        }

        const data = await response.json()
        if (data.config && data.config.apiKey) {
            return {
                apiKey: data.config.apiKey,
                baseUrl: data.config.baseUrl || 'https://openrouter.ai/api/v1',
            }
        }

        // Fallback to environment variable
        return getOpenRouterConfigFromEnv()
    } catch (error) {
        console.error('[draft] Error fetching OpenRouter config from backend:', error)
        // Fallback to environment variable
        return getOpenRouterConfigFromEnv()
    }
}

function getOpenRouterConfigFromEnv(): OpenRouterConfig | null {
    const apiKey = process.env.OPENROUTER_API_KEY
    const baseUrl = process.env.OPENROUTER_BASE_URL

    if (!apiKey) {
        console.warn('[draft] OPENROUTER_API_KEY not found in environment variables')
        return null
    }

    return {
        apiKey,
        baseUrl: baseUrl || 'https://openrouter.ai/api/v1',
    }
}

async function callOpenRouter(
    config: OpenRouterConfig,
    messages: Array<{ role: string; content: string }>,
    options: { temperature?: number; max_tokens?: number } = {}
): Promise<string | null> {
    const { temperature = 0.3, max_tokens = 500 } = options
    const baseUrl = config.baseUrl || 'https://openrouter.ai/api/v1'

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://ip-nuo.vercel.app',
            'X-Title': 'IP Nuo CRM'
        },
        body: JSON.stringify({
            model: 'anthropic/claude-3-haiku',
            messages,
            temperature,
            max_tokens,
            stream: false
        })
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`OpenRouter API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || null
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as DraftRequest
        const { customer, existingDraft, recentTickets, conversationContext } = body

        // Get auth token from request header for backend call
        const authHeader = request.headers.get('Authorization')
        const authToken = authHeader?.replace('Bearer ', '') || null

        console.log('[draft] Received request:', {
            hasCustomer: !!customer,
            customerName: customer?.name,
            conversationCount: conversationContext?.length ?? 0,
            recentTicketsCount: recentTickets?.length ?? 0,
            hasDraft: !!(existingDraft?.title || existingDraft?.description),
            hasAuthToken: !!authToken,
        })

        // Get OpenRouter config from database via backend (with auth) or fallback to env
        const openRouterConfig = await getOpenRouterConfigFromBackend(authToken)
        if (!openRouterConfig) {
            return NextResponse.json(
                { error: 'OpenRouter API key not configured. Please set OPENROUTER_API_KEY in environment or configure it in Admin > System Settings.' },
                { status: 400 }
            )
        }

        console.log('[draft] Using OpenRouter config with key length:', openRouterConfig.apiKey.length)

        // Build conversation summary for AI
        let conversationSummary = ''
        if (conversationContext && conversationContext.length > 0) {
            console.log('[draft] Processing conversation messages:', conversationContext.length)
            conversationSummary = conversationContext
                .map(msg => `${msg.role === 'user' ? 'Cliente' : 'Agente'}: ${msg.content}`)
                .join('\n')
            console.log('[draft] Conversation summary length:', conversationSummary.length)
        } else {
            console.log('[draft] No conversation context provided')
        }

        // Build context about recent tickets
        let recentTicketsContext = ''
        if (recentTickets && recentTickets.length > 0) {
            recentTicketsContext = recentTickets
                .map(t => `- ${t.title} (${t.status}, prioridad: ${t.priority})`)
                .join('\n')
        }

        // Build customer context
        let customerContext = ''
        if (customer) {
            customerContext = `Cliente: ${customer.name}${customer.email ? `, email: ${customer.email}` : ''}${customer.phone ? `, teléfono: ${customer.phone}` : ''}`
        }

        // Build prompt for AI
        const systemPrompt = `Eres un asistente de CRM que ayuda a crear tickets de soporte.
Tu tarea es analizar la conversación y el contexto del cliente para generar un borrador de ticket.

Responde SOLO con un objeto JSON válido con esta estructura exacta:
{
  "title": "Título breve y descriptivo del problema (máx 80 caracteres)",
  "description": "Descripción detallada del problema o solicitud basada en la conversación",
  "priority": "low|medium|high|urgent",
  "tags": ["tag1", "tag2"]
}

Criterios para prioridad:
- urgent: Cliente frustrado, problema crítico que impide uso del servicio
- high: Problema importante pero el cliente puede esperar
- medium: Solicitud o consulta normal
- low: Pregunta informativa o sin urgencia

Tags sugeridos: payment, billing, technical, membership, classes, schedule, account, general`

        const userMessage = `${customerContext ? `${customerContext}\n\n` : ''}${recentTicketsContext ? `Tickets recientes del cliente:\n${recentTicketsContext}\n\n` : ''}${existingDraft?.title || existingDraft?.description ? `Borrador actual:\nTítulo: ${existingDraft.title || '(vacío)'}\nDescripción: ${existingDraft.description || '(vacío)'}\n\n` : ''}${conversationSummary ? `Conversación reciente:\n${conversationSummary}` : 'No hay conversación disponible. Genera un ticket genérico de soporte.'}`

        // Call OpenRouter with database config
        let content: string | null = null
        try {
            content = await callOpenRouter(
                openRouterConfig,
                [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                { temperature: 0.3, max_tokens: 500 }
            )
        } catch (error) {
            console.error('[draft] OpenRouter API call failed:', error)
            return NextResponse.json(
                { error: 'AI Service temporarily unavailable. Please try again later.' },
                { status: 503 }
            )
        }

        if (!content) {
            return NextResponse.json(
                { error: 'AI returned empty response' },
                { status: 422 }
            )
        }

        // Parse the JSON response
        let suggestion
        try {
            // Extract JSON from response (in case AI adds extra text)
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                suggestion = JSON.parse(jsonMatch[0])
            } else {
                throw new Error('No JSON found in response')
            }
        } catch (parseError) {
            console.error('[draft] Failed to parse AI response:', content)
            return NextResponse.json(
                { error: 'Failed to parse AI response', raw: content },
                { status: 422 }
            )
        }

        console.log('[draft] Generated suggestion:', {
            title: suggestion.title,
            priority: suggestion.priority,
            tagsCount: suggestion.tags?.length ?? 0,
        })

        return NextResponse.json({ suggestion })
    } catch (error) {
        console.error('[draft] Error generating ticket draft:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate draft' },
            { status: 500 }
        )
    }
}
