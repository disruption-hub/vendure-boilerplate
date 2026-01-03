import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Backend chatbot flow configuration
 * This defines the actual states and transitions used by the backend chatbot
 */
export interface FlowState {
  id: string;
  description: string;
  category: 'core' | 'profile' | 'appointment' | 'payment' | 'knowledge';
}

export interface FlowTransition {
  from: string;
  to: string;
  label?: string;
  category?: string;
  dashed?: boolean;
}

export interface FlowOverlay {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  nodes: FlowState[];
  edges: FlowTransition[];
}

export interface ChatbotFlowConfig {
  version: number;
  states: Record<string, FlowState>;
  transitions: FlowTransition[];
  overlays: FlowOverlay[];
  categories: Record<string, string>;
  // Additional fields for frontend use
  messages?: Record<string, any>;
  intentLabels?: Record<string, string>;
  shapes?: Record<string, string>;
  quickActions?: Array<{
    id: string;
    action: string;
    labels: Record<string, string>;
  }>;
}

@Injectable()
export class ChatbotFlowConfigService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get the complete flow configuration used by the backend
   * This reflects the actual implementation, not a frontend definition
   * Checks database first, falls back to hardcoded default
   */
  async getFlowConfig(): Promise<ChatbotFlowConfig> {
    // Try to load from database first
    const dbConfig = await this.getFlowConfigFromDatabase();
    if (dbConfig) {
      return dbConfig;
    }
    
    // Fallback to hardcoded default
    return this.getDefaultFlowConfig();
  }

  /**
   * Get flow config from database
   */
  async getFlowConfigFromDatabase(): Promise<ChatbotFlowConfig | null> {
    try {
      const config = await this.prisma.systemConfig.findUnique({
        where: { key: 'chatbot_flow_config' },
      });

      if (!config || !config.value || typeof config.value !== 'object') {
        return null;
      }

      // Validate and return the stored config
      const value = config.value as any;
      if (value.version && value.states && value.transitions && value.overlays) {
        return value as ChatbotFlowConfig;
      }

      return null;
    } catch (error) {
      console.error('[ChatbotFlowConfigService] Error loading flow config from database:', error);
      return null;
    }
  }

  /**
   * Update and persist flow configuration
   */
  async updateFlowConfig(config: ChatbotFlowConfig): Promise<ChatbotFlowConfig> {
    try {
      // Store the config in database
      await this.prisma.systemConfig.upsert({
        where: { key: 'chatbot_flow_config' },
        update: {
          value: config as any,
          updatedAt: new Date(),
        },
        create: {
          key: 'chatbot_flow_config',
          value: config as any,
        },
      });

      return config;
    } catch (error) {
      console.error('[ChatbotFlowConfigService] Error updating flow config:', error);
      throw error;
    }
  }

  /**
   * Get the default hardcoded flow configuration
   * This is the fallback when no database config exists
   */
  private getDefaultFlowConfig(): ChatbotFlowConfig {
    return {
      version: 2,
      states: {
        GREETING: {
          id: 'GREETING',
          description: 'Initial greeting before intents are gathered',
          category: 'core',
        },
        AWAITING_INTENT: {
          id: 'AWAITING_INTENT',
          description: 'Listening for the primary intent from the user',
          category: 'core',
        },
        COLLECTING_NAME: {
          id: 'COLLECTING_NAME',
          description: 'Collecting or validating the user name before scheduling',
          category: 'profile',
        },
        COLLECTING_EMAIL: {
          id: 'COLLECTING_EMAIL',
          description: 'Collecting or validating the user email before scheduling',
          category: 'profile',
        },
        COLLECTING_PHONE: {
          id: 'COLLECTING_PHONE',
          description: 'Optionally collecting phone number after email',
          category: 'profile',
        },
        SHOWING_SLOTS: {
          id: 'SHOWING_SLOTS',
          description: 'Presenting available schedule slots and handling navigation',
          category: 'appointment',
        },
        CONFIRMING: {
          id: 'CONFIRMING',
          description: 'Confirming the selected slot before booking',
          category: 'appointment',
        },
        COMPLETED: {
          id: 'COMPLETED',
          description: 'Appointment booked – conversation can continue or restart',
          category: 'core',
        },
      },
      transitions: [
        // Core transitions
        { from: 'GREETING', to: 'AWAITING_INTENT', category: 'core' },
        { from: 'AWAITING_INTENT', to: 'AWAITING_INTENT', category: 'core' },
        { from: 'AWAITING_INTENT', to: 'COLLECTING_NAME', category: 'appointment' },
        { from: 'COLLECTING_NAME', to: 'COLLECTING_EMAIL', category: 'appointment' },
        { from: 'COLLECTING_EMAIL', to: 'COLLECTING_PHONE', category: 'appointment' },
        { from: 'COLLECTING_PHONE', to: 'SHOWING_SLOTS', category: 'appointment' },
        { from: 'SHOWING_SLOTS', to: 'CONFIRMING', category: 'appointment' },
        { from: 'CONFIRMING', to: 'COMPLETED', category: 'appointment' },
        { from: 'COMPLETED', to: 'AWAITING_INTENT', category: 'core' },
      ],
      overlays: [
        {
          id: 'payment',
          name: 'Payment Overlay',
          description: 'Visualize the payment collection flow layered on top of the main conversation.',
          enabled: true,
          nodes: [
            {
              id: 'payment_idle',
              description: 'No active payment flow',
              category: 'payment',
            },
            {
              id: 'payment_awaiting_product',
              description: 'User requested payment link, showing available products',
              category: 'payment',
            },
            {
              id: 'payment_awaiting_name',
              description: 'Product selected, collecting payer name',
              category: 'payment',
            },
            {
              id: 'payment_awaiting_email',
              description: 'Name collected, collecting email for receipt',
              category: 'payment',
            },
            {
              id: 'payment_awaiting_confirmation',
              description: 'Email collected, showing summary for confirmation',
              category: 'payment',
            },
            {
              id: 'payment_awaiting_new_link_confirmation',
              description: 'User has existing link, asking if they want a new one',
              category: 'payment',
            },
            {
              id: 'payment_completed',
              description: 'Payment link generated and delivered',
              category: 'payment',
            },
          ],
          edges: [
            {
              from: 'AWAITING_INTENT',
              to: 'payment_awaiting_product',
              label: 'Payment keywords detected (e.g., "dame un link de pago")',
              category: 'payment',
            },
            {
              from: 'payment_awaiting_product',
              to: 'payment_awaiting_name',
              label: 'Product selected',
              category: 'payment',
            },
            {
              from: 'payment_awaiting_name',
              to: 'payment_awaiting_email',
              label: 'Name provided',
              category: 'payment',
            },
            {
              from: 'payment_awaiting_email',
              to: 'payment_awaiting_confirmation',
              label: 'Email provided',
              category: 'payment',
            },
            {
              from: 'payment_awaiting_confirmation',
              to: 'payment_completed',
              label: 'Confirmed',
              category: 'payment',
            },
            {
              from: 'payment_completed',
              to: 'payment_awaiting_new_link_confirmation',
              label: 'New payment request',
              category: 'payment',
              dashed: true,
            },
            {
              from: 'payment_awaiting_new_link_confirmation',
              to: 'payment_awaiting_product',
              label: 'User wants new link',
              category: 'payment',
            },
            {
              from: 'payment_awaiting_new_link_confirmation',
              to: 'payment_completed',
              label: 'User keeps existing link',
              category: 'payment',
            },
            {
              from: 'payment_completed',
              to: 'AWAITING_INTENT',
              label: 'Continue conversation',
              category: 'payment',
              dashed: true,
            },
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
              description: 'Resolve FAQ or info request without scheduling',
              category: 'knowledge',
            },
          ],
          edges: [
            {
              from: 'AWAITING_INTENT',
              to: 'KNOWLEDGE_RESPONSE',
              label: 'FAQ detected',
              category: 'knowledge',
              dashed: true,
            },
            {
              from: 'KNOWLEDGE_RESPONSE',
              to: 'COMPLETED',
              label: 'Answer satisfied user',
              category: 'knowledge',
              dashed: true,
            },
          ],
        },
      ],
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
    };
  }

  /**
   * Get payment flow stages (for reference)
   */
  getPaymentFlowStages(): string[] {
    return [
      'idle',
      'awaiting_product',
      'awaiting_name',
      'awaiting_email',
      'awaiting_confirmation',
      'awaiting_new_link_confirmation',
      'completed',
    ];
  }
}

