
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);

    const contactId = 'cmig8t0iv003t01p926i0ptbr';

    const contact = await prisma.chatbotContact.findUnique({
        where: { id: contactId },
        select: { metadata: true }
    });

    console.log('Contact Metadata:', JSON.stringify(contact?.metadata, null, 2));

    await app.close();
}

bootstrap();
