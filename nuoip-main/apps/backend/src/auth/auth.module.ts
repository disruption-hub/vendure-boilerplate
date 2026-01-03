import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { AdminAuthController } from './controllers/admin-auth.controller'
import { ChatAuthController } from './controllers/chat-auth.controller'
import { ChatAttachmentsController } from './controllers/chat-attachments.controller'
import { ChatUploadController } from './controllers/chat-upload.controller'
import { JwtStrategy } from './jwt.strategy'
import { ChatOtpService } from './services/chat-otp.service'
import { AdminModule } from '../admin/admin.module'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [ConfigModule, AdminModule, PrismaModule],
  controllers: [AuthController, AdminAuthController, ChatAuthController, ChatAttachmentsController, ChatUploadController],
  providers: [AuthService, JwtStrategy, ChatOtpService],
  exports: [AuthService, ChatOtpService],
})
export class AuthModule { }
