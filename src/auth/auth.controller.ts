import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put, Req, Res, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './login.dto';
import { UpdateProfileDto, ChangePasswordDto } from './account.dto';
import { Public } from './public.decorator';
import { Admin } from './current-admin.decorator';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const admin = await this.auth.login(dto.email, dto.password, req, res);
    if (!admin) throw new UnauthorizedException('Invalid email or password.');
    return { success: true, admin };
  }

  @Get('me')
  me(@Admin() admin: { id: string; email: string }) {
    return { authenticated: true, admin };
  }

  @Put('profile')
  async updateProfile(@Admin() admin: { id: string }, @Body() dto: UpdateProfileDto) {
    return { success: true, admin: await this.auth.updateProfile(admin.id, dto.displayName, dto.email) };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Admin() admin: { id: string }, @Body() dto: ChangePasswordDto) {
    await this.auth.changePassword(admin.id, dto.currentPassword, dto.newPassword);
    return { success: true, message: 'Password updated. Please sign in again.' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.auth.logout(req.cookies?.admin_session, res);
  }
}
