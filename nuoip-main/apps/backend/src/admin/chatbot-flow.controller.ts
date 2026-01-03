import {
  Controller,
  Put,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard, AdminGuard } from '../common/guards/auth.guard';
import { ChatbotFlowConfigService } from '../chatbot/chatbot-flow-config.service';
import type { ChatbotFlowConfig } from '../chatbot/chatbot-flow-config.service';

interface FlowConfigInput {
  version?: number;
  states?: Record<string, { description: string }>;
  messages?: Record<string, any>;
  intentLabels?: Record<string, string>;
  categories?: Record<string, string>;
  shapes?: Record<string, string>;
  overlays?: Array<{
    id: string;
    name: string;
    description?: string;
    enabled?: boolean;
    nodes: Array<{
      id: string;
      title?: string;
      description: string;
      category: string;
    }>;
    edges: Array<{
      from: string;
      to: string;
      label: string;
      category: string;
      dashed?: boolean;
    }>;
  }>;
  quickActions?: Array<{
    id: string;
    action: string;
    labels: Record<string, string>;
  }>;
}

@Controller('admin/chatbot/flow')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ChatbotFlowController {
  constructor(
    private readonly flowConfigService: ChatbotFlowConfigService,
  ) { }

  @Put()
  async updateFlowConfig(
    @Body() input: FlowConfigInput,
  ): Promise<{ success: boolean; config: ChatbotFlowConfig }> {
    try {
      // Transform frontend config to backend format
      const backendConfig = this.transformFrontendToBackend(input);

      // Update and persist the config
      const updatedConfig = await this.flowConfigService.updateFlowConfig(backendConfig);

      return {
        success: true,
        config: updatedConfig,
      };
    } catch (error) {
      console.error('[ChatbotFlowController] Error updating flow config:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to update flow configuration',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Transform frontend FlowConfig format to backend ChatbotFlowConfig format
   */
  private transformFrontendToBackend(input: FlowConfigInput): ChatbotFlowConfig {
    // Extract states
    const states: Record<string, { id: string; description: string; category: string }> = {};
    if (input.states) {
      Object.entries(input.states).forEach(([key, state]) => {
        const category = input.categories?.[key] || 'core';
        states[key] = {
          id: key,
          description: state.description,
          category: category as 'core' | 'profile' | 'appointment' | 'payment' | 'knowledge',
        };
      });
    }

    // Extract transitions from overlays and base edges
    const transitions: Array<{ from: string; to: string; label?: string; category?: string; dashed?: boolean }> = [];

    // Add transitions from overlays
    if (input.overlays) {
      input.overlays.forEach(overlay => {
        if (overlay.enabled !== false && overlay.edges) {
          overlay.edges.forEach(edge => {
            transitions.push({
              from: edge.from,
              to: edge.to,
              label: edge.label,
              category: edge.category,
              dashed: edge.dashed,
            });
          });
        }
      });
    }

    // Extract overlays
    const overlays = (input.overlays || []).map(overlay => ({
      id: overlay.id,
      name: overlay.name,
      description: overlay.description || '',
      enabled: overlay.enabled !== false,
      nodes: overlay.nodes.map(node => ({
        id: node.id,
        description: node.description,
        category: node.category as 'core' | 'profile' | 'appointment' | 'payment' | 'knowledge',
      })),
      edges: overlay.edges.map(edge => ({
        from: edge.from,
        to: edge.to,
        label: edge.label,
        category: edge.category,
        dashed: edge.dashed,
      })),
    }));

    return {
      version: input.version || 2,
      states: states as any,
      transitions,
      overlays,
      categories: input.categories || {},
      // Store additional fields for frontend use
      messages: input.messages || {},
      intentLabels: input.intentLabels || {},
      shapes: input.shapes || {},
      quickActions: input.quickActions || [],
    };
  }
}

