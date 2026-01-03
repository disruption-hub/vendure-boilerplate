
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PaymentFlowService } from '../chatbot/payment-flow.service';
import { PrismaService } from '../prisma/prisma.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const paymentFlowService = app.get(PaymentFlowService);
    const prisma = app.get(PrismaService);

    const sessionId = 'debug-session-' + Date.now();
    const tenantId = 'cmh9wylc60001tjs1qy2wm9ok'; // From metadata
    const message = 'Dame un link de pago';

    // Mock context based on the metadata we found
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

    console.log('Testing handlePaymentFlow with completed stage context...');
    console.log('Message:', message);
    console.log('Context:', JSON.stringify(conversationContext.paymentContext, null, 2));

    try {
        // @ts-ignore
        const result = await paymentFlowService.handlePaymentFlow(
            message,
            sessionId,
            tenantId,
            conversationContext
        );

        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }

    await app.close();
}

bootstrap();
