import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: 'RABBITMQ_SERVICE',
                useFactory: (config: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [config.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672'],
                        queue: config.get<string>('RABBITMQ_QUEUE') || 'booking_queue',
                        queueOptions: {
                            durable: true,
                        },
                    },
                }),
                inject: [ConfigService],
            },
        ]),
    ],
    controllers: [SyncController],
    providers: [SyncService, PrismaService],
})
export class SyncModule { }
