
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ChatbotStreamController } from '../chatbot/chatbot-stream.controller';
import { PaymentFlowService } from '../chatbot/payment-flow.service';
import { AdminSystemSettingsService } from '../admin/system-settings.service';
import { ChatbotFlowConfigService } from '../chatbot/chatbot-flow-config.service';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Response } from 'express';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);

    // Get all required services from the DI container
    const systemSettingsService = app.get(AdminSystemSettingsService);
    const paymentFlowService = app.get(PaymentFlowService);
    const flowConfigService = app.get(ChatbotFlowConfigService);

    console.log('Services loaded:', {
        hasSystemSettings: !!systemSettingsService,
        hasPaymentFlow: !!paymentFlowService,
        hasFlowConfig: !!flowConfigService,
    });

    const controller = new ChatbotStreamController(
        systemSettingsService,
        paymentFlowService,
        flowConfigService
    );

    const sessionId = 'debug-session-' + Date.now();
    const tenantId = 'cmh9wylc60001tjs1qy2wm9ok';
    const message = 'Dame un link de pago';

    const conversationContext = {
        language: 'es',
        tenantId: tenantId,
        paymentContext: {
            stage: 'completed',
            linkUrl: 'https://flowcast.chat/pay/3d7XMysDhjJ2UtwUlraIOi3y',
            currency: 'PEN',
            confirmed: true,
            linkRoute: '/pay/3d7XMysDhjJ2UtwUlraIOi3y',
            linkToken: '3d7XMysDhjJ2UtwUlraIOi3y',
            productId: 'cmh8fgk9p0000btrmeirskn67',
            amountCents: 6000,
            productName: 'MATPASS 01',
            customerName: 'Ya',
            lastViewedAt: null,
            customerEmail: 'betosaxo@gmail.com',
            historyOffset: 0,
            nameConfirmed: true,
            emailConfirmed: true,
            historyPageSize: 5,
            lastGeneratedAt: '2025-12-01T16:57:19.041Z',
            selectedCustomerId: null,
            selectedCustomerType: null
        }
    };

    const mockRes = {
        setHeader: (name: string, value: string) => console.log(`Header: ${name}=${value}`),
        status: (code: number) => console.log(`Status: ${code}`),
        write: (chunk: any) => console.log(`Write: ${chunk}`),
        end: () => console.log('End'),
    } as unknown as Response;

    console.log('Testing ChatbotStreamController.stream with completed stage context...');

    try {
        await controller.stream({
            message,
            sessionId,
            clientId: 'debug-client',
            conversationContext
        }, mockRes);
    } catch (error) {
        console.error('Error:', error);
    }

    await app.close();
}

bootstrap();
