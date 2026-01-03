
import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'

@Module({
    imports: [
        BullModule.forRootAsync({
            useFactory: () => ({
                connection: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                    password: process.env.REDIS_PASSWORD,
                },
            }),
        }),
        BullModule.registerQueue(
            { name: 'whatsapp-incoming' },
            { name: 'whatsapp-outgoing' },
            { name: 'whatsapp-status' },
            { name: 'whatsapp-media' },
            { name: 'whatsapp-broadcast' },
        ),
    ],
    exports: [BullModule],
})
export class QueueModule { }
