import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OAuthService } from './oauth.service';
import { OAuthController } from './oauth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module'; // Added because AuthService uses NotificationsService

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    NotificationsModule, // Ensure this is imported for AuthService
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [AuthService, JwtStrategy, OAuthService],
  controllers: [AuthController, OAuthController],
  exports: [AuthService],
})
export class AuthModule { }
