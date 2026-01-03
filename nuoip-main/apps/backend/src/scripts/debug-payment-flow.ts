
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
    const contactId = 'debug-contact-' + Date.now();
    const message = 'Dame un link de pago';

    console.log('Testing handlePaymentFlow with message:', message);

    try {
        const result = await paymentFlowService.handlePaymentFlow(
            message,
            sessionId,
            null, // tenantId
            { language: 'es' } // conversationContext
        );

        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }

    await app.close();
}

bootstrap();
