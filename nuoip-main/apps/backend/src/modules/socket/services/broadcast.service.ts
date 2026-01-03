
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import Pusher from 'pusher'

@Injectable()
export class BroadcastService implements OnModuleInit {
    private pusher: Pusher
    private readonly logger = new Logger(BroadcastService.name)

    constructor() {
        // Support both SOKETI_* (production) and PUSHER_* (legacy) env vars
        // Priority: SOKETI_* -> PUSHER_* -> defaults
        const appId = process.env.SOKETI_APP_ID || process.env.SOKETI_DEFAULT_APP_ID || process.env.PUSHER_APP_ID || 'soketi'
        const key = process.env.SOKETI_APP_KEY || process.env.SOKETI_DEFAULT_APP_KEY || process.env.PUSHER_APP_KEY || 'soketi'
        const secret = process.env.SOKETI_APP_SECRET || process.env.SOKETI_DEFAULT_APP_SECRET || process.env.PUSHER_APP_SECRET || 'soketi'
        const cluster = process.env.PUSHER_APP_CLUSTER || 'mt1'

        // Host resolution: PUBLIC_HOST > HOST > INTERNAL_HOST > PUSHER_HOST > localhost
        const host = process.env.SOKETI_PUBLIC_HOST || process.env.SOKETI_HOST || process.env.SOKETI_INTERNAL_HOST || process.env.PUSHER_HOST || '127.0.0.1'

        // Port resolution with TLS-aware defaults
        const portStr = process.env.SOKETI_PUBLIC_PORT || process.env.SOKETI_PORT || process.env.SOKETI_INTERNAL_PORT || process.env.PUSHER_PORT

        // TLS: default to true for production (SOKETI_USE_TLS not explicitly 'false'), false for local
        const useTLS = process.env.SOKETI_USE_TLS !== 'false' && (
            !!process.env.SOKETI_PUBLIC_HOST ||
            !!process.env.SOKETI_HOST ||
            process.env.PUSHER_APP_USE_TLS === 'true'
        )

        // Default port: 443 for TLS, 6001 for non-TLS
        const port = portStr || (useTLS ? '443' : '6001')

        this.pusher = new Pusher({
            appId,
            key,
            secret,
            cluster,
            useTLS,
            host,
            port,
        })
    }

    onModuleInit() {
        // Log configuration on startup for debugging
        const host = process.env.SOKETI_PUBLIC_HOST || process.env.SOKETI_HOST || process.env.SOKETI_INTERNAL_HOST || process.env.PUSHER_HOST || '127.0.0.1'
        const usingSoketi = !!process.env.SOKETI_APP_ID || !!process.env.SOKETI_DEFAULT_APP_ID

        this.logger.log(`BroadcastService initialized: host=${host}, usingSoketi=${usingSoketi}`)
    }

    async broadcast(channel: string, event: string, data: any) {
        this.logger.debug(`Broadcasting event: channel=${channel}, event=${event}`)
        try {
            const result = await this.pusher.trigger(channel, event, data)
            this.logger.debug(`Broadcast successful: channel=${channel}, event=${event}`)
            return result
        } catch (error) {
            this.logger.error(`Broadcast failed: channel=${channel}, event=${event}`, error)
            throw error
        }
    }
}
