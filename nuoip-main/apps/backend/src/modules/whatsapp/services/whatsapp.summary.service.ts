import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { AdminSystemSettingsService } from '../../../admin/system-settings.service';

export interface SessionSummaryResult {
    summary: string;
    topics: string[];
    interactionType: string;
    sentiment: string;
}

@Injectable()
export class WhatsAppSummaryService {
    private readonly logger = new Logger(WhatsAppSummaryService.name);

    constructor(
        @Inject(forwardRef(() => AdminSystemSettingsService))
        private readonly systemSettingsService: AdminSystemSettingsService,
    ) { }

    async generateSummary(conversationText: string): Promise<SessionSummaryResult | null> {
        try {
            if (!conversationText.trim()) {
                return null;
            }

            // 1. Get Settings
            const settings = await this.systemSettingsService.getOpenRouterSettings();
            if (!settings || !settings.apiKey) {
                this.logger.warn('OpenRouter not configured. Skipping summary.');
                return null;
            }

            // 2. Prompt
            const prompt = `
                Analyze the following WhatsApp customer service conversation and provide a JSON summary.
                
                Conversation:
                ${conversationText}

                Output JSON structure (strictly valid JSON):
                {
                    "summary": "A very concise summary (max 2 sentences, approx 30 words) in Spanish.",
                    "topics": ["Array", "of", "3-5", "key", "topics", "in", "Spanish"],
                    "interactionType": "One of: 'Consulta', 'Venta', 'Soporte', 'Reclamo', 'Otro'",
                    "sentiment": "One of: 'positive', 'neutral', 'negative'"
                }
            `;

            // 3. Call AI
            this.logger.log(`[GenerateSummary] Sending request to OpenRouter (Prompt len: ${prompt.length}, BaseURL: ${settings.baseUrl || 'default'})`);
            const response = await fetch(settings.baseUrl || 'https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${settings.apiKey}`,
                    'HTTP-Referer': 'https://ipnuo.com',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'openai/gpt-4o-mini',
                    messages: [
                        { role: 'system', content: 'You are a helpful CRM assistant. Output strictly valid JSON. Language: Spanish.' },
                        { role: 'user', content: prompt }
                    ],
                    response_format: { type: 'json_object' }
                })
            });
            this.logger.log(`[GenerateSummary] Response status: ${response.status}`);

            if (!response.ok) {
                const errText = await response.text();
                this.logger.error(`[GenerateSummary] OpenRouter API error: ${response.status} - ${errText}`);
                throw new Error(`OpenRouter API error: ${response.status}`);
            }

            const result = await response.json();
            this.logger.log(`[GenerateSummary] AI Response received.`);
            const content = result.choices?.[0]?.message?.content;

            if (!content) throw new Error('Empty response from AI');

            let parsed;
            try {
                parsed = JSON.parse(content);
            } catch (e) {
                const cleaned = content.replace(/```json/g, '').replace(/```/g, '');
                parsed = JSON.parse(cleaned);
            }

            return {
                summary: parsed.summary || 'Resumen no disponible',
                topics: Array.isArray(parsed.topics) ? parsed.topics : [],
                interactionType: parsed.interactionType || 'Otro',
                sentiment: parsed.sentiment || 'neutral'
            };

        } catch (error) {
            this.logger.error('Failed to generate summary', error);
            return null;
        }
    }
}
