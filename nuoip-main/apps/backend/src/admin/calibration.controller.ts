import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, AdminGuard } from '../common/guards/auth.guard';
import { ChatbotFlowConfigService } from '../chatbot/chatbot-flow-config.service';
import { PrismaService } from '../prisma/prisma.service';

interface CalibrationSessionSummary {
  sessionId: string;
  tenantId: string | null;
  createdAt: Date;
  messageCount: number;
  transitionCount: number;
}

interface CalibrationReportResponse {
  sessions: CalibrationSessionSummary[];
  aggregatedReport: {
    observed: Array<{ from: string; to: string; count: number }>;
    missingFromChart: Array<{ from: string; to: string; count: number }>;
    unobservedChartTransitions: Array<{ from: string; to: string }>;
    statistics: {
      totalObserved: number;
      bySource: {
        test?: number;
        live?: number;
      };
    };
  };
  individualReports?: Array<{
    sessionId: string;
    observed: Array<{ from: string; to: string }>;
    missing: Array<{ from: string; to: string }>;
  }>;
}

@Controller('admin/calibration')
@UseGuards(JwtAuthGuard, AdminGuard)
export class CalibrationController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flowConfigService: ChatbotFlowConfigService,
  ) { }

  @Get('sessions')
  async getSessions(@Query('limit') limit?: string): Promise<{ sessions: CalibrationSessionSummary[] }> {
    const limitNum = limit ? Number.parseInt(limit, 10) : 15;

    // Get sessions with chatbot activity
    // This is a placeholder - you may need to adjust based on your actual data model
    const sessions = await this.prisma.$queryRaw<Array<{
      sessionId: string;
      tenantId: string | null;
      createdAt: Date;
      messageCount: number;
    }>>`
      SELECT 
        session_id as "sessionId",
        tenant_id as "tenantId",
        MIN(created_at) as "createdAt",
        COUNT(*) as "messageCount"
      FROM chatbot_memory_sessions
      GROUP BY session_id, tenant_id
      ORDER BY MIN(created_at) DESC
      LIMIT ${limitNum}
    `.catch(() => []);

    return {
      sessions: sessions.map(s => ({
        sessionId: s.sessionId,
        tenantId: s.tenantId,
        createdAt: s.createdAt,
        messageCount: Number(s.messageCount) || 0,
        transitionCount: 0, // Calculate from transitions if available
      })),
    };
  }

  @Get('report')
  async getReport(
    @Query('sessionId') sessionId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('mode') mode?: string,
    @Query('includeUnobservedExpected') includeUnobserved?: string,
  ): Promise<CalibrationReportResponse> {
    // Get backend-defined flow config (source of truth)
    const flowConfig = await this.flowConfigService.getFlowConfig();

    // Extract all expected transitions from backend config
    const expectedTransitions = new Set<string>();

    // Add base transitions
    (flowConfig.transitions || []).forEach(t => {
      expectedTransitions.add(`${t.from}->${t.to}`);
    });

    // Add overlay transitions (payment flow)
    (flowConfig.overlays || []).forEach(overlay => {
      overlay.edges.forEach(edge => {
        expectedTransitions.add(`${edge.from}->${edge.to}`);
      });
    });

    // Get observed transitions from memory/conversation data
    // This is a placeholder - you'll need to implement based on your actual data model
    const observedTransitions: Array<{ from: string; to: string; count: number }> = [];

    // Compare observed vs expected
    const observedSet = new Set(observedTransitions.map(t => `${t.from}->${t.to}`));
    const missingFromChart: Array<{ from: string; to: string; count: number }> = [];
    const unobservedChartTransitions: Array<{ from: string; to: string }> = [];

    observedTransitions.forEach(transition => {
      const key = `${transition.from}->${transition.to}`;
      if (!expectedTransitions.has(key)) {
        missingFromChart.push(transition);
      }
    });

    if (includeUnobserved === 'true') {
      expectedTransitions.forEach(key => {
        if (!observedSet.has(key)) {
          const [from, to] = key.split('->');
          unobservedChartTransitions.push({ from, to });
        }
      });
    }

    return {
      sessions: [],
      aggregatedReport: {
        observed: observedTransitions,
        missingFromChart,
        unobservedChartTransitions,
        statistics: {
          totalObserved: observedTransitions.length,
          bySource: {
            live: observedTransitions.length,
          },
        },
      },
    };
  }
}


