import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Hybrid application (HTTP + Microservice)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672'],
      queue: configService.get<string>('RABBITMQ_QUEUE') || 'booking_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  // Start microservices in background (don't block HTTP)
  app.startAllMicroservices().catch(err => {
    console.error('Failed to connect to RabbitMQ, sync will be unavailable:', err.message);
  });

  const port = configService.get<string>('PORT') || 3005;
  await app.listen(port);
  console.log(`Booking Service is running on port ${port}`);
}
bootstrap();
