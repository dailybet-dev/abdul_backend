import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { AdminAuthGuard } from './admin-auth.guard';
import { ConfigService } from './config.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthResolver, AdminAuthGuard, ConfigService],
  exports: [AuthService],
})
export class AuthModule {}
