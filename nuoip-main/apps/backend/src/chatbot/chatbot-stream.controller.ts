import {
    Controller,
    Post,
    Get,
    Body,
    Res,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AdminSystemSettingsService } from '../admin/system-settings.service';
import { PaymentFlowService } from './payment-flow.service';
import { ChatbotFlowConfigService } from './chatbot-flow-config.service';

interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface StreamRequest {
    message: string;
    sessionId?: string;
    clientId?: string;
    tenantId?: string; // Required for payment link generation
    conversationContext?: Record<string, any>;
    sessionToken?: string;
}

interface StreamChunk {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        delta: {
            role?: string;
            content?: string;
        };
        finish_reason?: string;
    }>;
}

@Controller('chatbot')
export class ChatbotStreamController {
    constructor(
        private readonly systemSettingsService: AdminSystemSettingsService,
        private readonly paymentFlowService: PaymentFlowService,
        private readonly flowConfigService: ChatbotFlowConfigService,
    ) { }

    /**
     * Get the backend-defined flow configuration
     * This is the source of truth for the actual chatbot flow implementation
     */
    @Get('flow/config')
    async getFlowConfig() {
        return {
            success: true,
            config: await this.flowConfigService.getFlowConfig(),
        };
    }

    private async getOpenRouterConfig(): Promise<{
        apiKey: string;
        baseUrl?: string;
    } | null> {
        // Try to get from database first
        const dbConfig = await this.systemSettingsService.getOpenRouterSettings();
        if (dbConfig?.apiKey) {
            return {
                apiKey: dbConfig.apiKey,
                baseUrl: dbConfig.baseUrl || 'https://openrouter.ai/api/v1',
            };
        }

        // Fallback to environment variables
        const apiKey = process.env.OPENROUTER_API_KEY;
        const baseUrl = process.env.OPENROUTER_BASE_URL;

        if (!apiKey) {
            console.warn('[ChatbotStream] OPENROUTER_API_KEY not found in database or environment variables');
            return null;
        }

        return {
            apiKey,
            baseUrl: baseUrl || 'https://openrouter.ai/api/v1',
        };
    }

    private async *streamFromOpenRouter(
        messages: Message[],
        options: {
            model?: string;
            temperature?: number;
            max_tokens?: number;
        } = {},
    ): AsyncGenerator<StreamChunk, void, unknown> {
        const config = await this.getOpenRouterConfig();
        if (!config?.apiKey) {
            throw new Error('OpenRouter API key is required but not configured');
        }

        const {
            model = 'anthropic/claude-3-haiku',
            temperature = 0.7,
            max_tokens = 2000,
        } = options;

        const response = await fetch(`${config.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://ip-nuo.vercel.app',
                'X-Title': 'IP Nuo CRM',
            },
            body: JSON.stringify({
                model,
                messages,
                temperature,
                max_tokens,
                stream: true,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            throw new Error('No response body reader available');
        }

        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data) as StreamChunk;
                            yield parsed;
                        } catch {
                            console.warn('[ChatbotStream] Invalid JSON in stream:', data);
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    @Post('stream')
    async stream(@Body() body: StreamRequest, @Res() res: Response) {
        try {
            const { message, sessionId, tenantId: bodyTenantId, conversationContext } = body;

            // Extract tenantId: prioritize top-level, fallback to conversationContext
            const tenantId = bodyTenantId || conversationContext?.tenantId || null;

            console.log('[ChatbotStream] Received request:', {
                messageLength: message?.length || 0,
                messagePreview: message?.substring(0, 50) || 'none',
                sessionId: sessionId || 'none',
                hasContext: !!conversationContext,
                tenantId: tenantId || 'none',
            });

            if (!message || typeof message !== 'string' || !message.trim()) {
                throw new HttpException('Message is required', HttpStatus.BAD_REQUEST);
            }

            // Check for payment intents BEFORE sending to AI
            console.log('[ChatbotStream] 🔍 Payment flow check:', {
                message: message.substring(0, 50),
                sessionId,
                tenantId,
                hasContext: !!conversationContext,
                paymentContext: conversationContext?.paymentContext,
                stage: conversationContext?.paymentContext?.stage || 'none',
            });

            const paymentFlowResult = await this.paymentFlowService.handlePaymentFlow(
                message,
                sessionId,
                tenantId,
                conversationContext,
            );

            console.log('[ChatbotStream] 🏁 Payment flow result:', {
                handled: paymentFlowResult.handled,
                shouldUseAI: paymentFlowResult.shouldUseAI,
                hasResponse: !!paymentFlowResult.response,
                responseLength: paymentFlowResult.response?.length || 0,
                newStage: paymentFlowResult.updatedPaymentContext?.stage,
                linkUrl: paymentFlowResult.updatedPaymentContext?.linkUrl,
            });

            // If payment flow handled the message, return the response directly
            if (paymentFlowResult.handled && !paymentFlowResult.shouldUseAI) {
                const paymentResponse = paymentFlowResult.response || '';
                const isSilent = !paymentResponse || paymentResponse.trim() === '';

                console.log('[ChatbotStream] Payment flow handled message', {
                    isSilent,
                    responseLength: paymentResponse.length,
                    handled: paymentFlowResult.handled,
                });

                // Set SSE headers
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                res.status(200);

                // Update conversation context with payment context
                const updatedContext = {
                    ...conversationContext,
                    paymentContext: paymentFlowResult.updatedPaymentContext || conversationContext?.paymentContext,
                    history: [
                        ...(conversationContext?.history || []),
                        { role: 'user', content: message.trim() },
                        // Only add assistant message to history if not silent
                        ...(isSilent ? [] : [{ role: 'assistant', content: paymentResponse }]),
                    ],
                };

                // Send the payment response as a complete message
                const completeData = JSON.stringify({
                    type: 'complete',
                    fullResponse: paymentResponse,
                    quickActions: conversationContext?.quickActions || [],
                    updatedConversationContext: updatedContext,
                    isSilent,
                });
                res.write(`data: ${completeData}\n\n`);
                res.end();
                return;
            }

            // Build message history
            const messages: Message[] = [];

            // Add system message
            if (conversationContext?.systemPrompt) {
                messages.push({
                    role: 'system',
                    content: conversationContext.systemPrompt,
                });
            } else {
                messages.push({
                    role: 'system',
                    content:
                        'Eres FlowBot, un asistente virtual amigable y útil para ayudar a clientes con pagos y servicios. Cuando un usuario solicite un link de pago, debes redirigirlo al proceso de pago. Responde de manera clara y concisa en español. Puedes ayudar a generar links de pago legítimos para productos y servicios.',
                });
            }

            // Add conversation history
            const history = conversationContext?.history || conversationContext?.messages;
            if (history && Array.isArray(history)) {
                for (const msg of history) {
                    if (msg.role && msg.content) {
                        messages.push({
                            role: msg.role as 'user' | 'assistant',
                            content: String(msg.content),
                        });
                    }
                }
            }

            // Add current user message
            messages.push({
                role: 'user',
                content: message.trim(),
            });

            // Set SSE headers
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            let fullResponse = '';

            // Stream from OpenRouter
            for await (const chunk of this.streamFromOpenRouter(messages, {
                model: 'anthropic/claude-3-haiku',
                temperature: 0.7,
                max_tokens: 2000,
            })) {
                const content = chunk.choices?.[0]?.delta?.content;
                if (content) {
                    fullResponse += content;

                    // Send chunk to client
                    const chunkData = JSON.stringify({
                        type: 'chunk',
                        content,
                    });
                    res.write(`data: ${chunkData}\n\n`);
                }

                // Check if stream is complete
                if (chunk.choices?.[0]?.finish_reason) {
                    break;
                }
            }

            // Send completion event
            // Preserve payment context from conversation context
            const updatedContext = {
                ...conversationContext,
                paymentContext: conversationContext?.paymentContext || null,
                history: [
                    ...(conversationContext?.history || []),
                    { role: 'user', content: message.trim() },
                    { role: 'assistant', content: fullResponse },
                ],
            };

            const completeData = JSON.stringify({
                type: 'complete',
                fullResponse,
                quickActions: conversationContext?.quickActions || [],
                updatedConversationContext: updatedContext,
            });
            res.write(`data: ${completeData}\n\n`);
            res.end();
        } catch (error) {
            console.error('[ChatbotStream] Error:', error);
            const errorData = JSON.stringify({
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            res.write(`data: ${errorData}\n\n`);
            res.end();
        }
    }
}
