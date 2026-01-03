
import { Module, Global } from '@nestjs/common'
import { BroadcastService } from './services/broadcast.service'

@Global()
@Module({
    providers: [BroadcastService],
    exports: [BroadcastService],
})
export class SocketModule { }
