import { ConflictException, Injectable, NotFoundException, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from './config.service';

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

@Injectable()
export class AuthService implements OnModuleInit {
  private dummyPasswordHash = '';
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async onModuleInit() {
    // Generate a valid bcrypt hash so unknown-account logins still incur bcrypt work.
    this.dummyPasswordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).update(this.config.sessionHashSecret).digest('hex');
  }

  cookieOptions() {
    const production = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: production,
      sameSite: (production ? 'none' : 'lax') as 'none' | 'lax',
      path: '/',
      // Intentionally omit Domain: the browser receives this cookie from the
      // frontend's same-origin /api/graphql rewrite. A backend Railway domain
      // or shared Railway suffix here would make browsers reject the cookie.
      maxAge: SESSION_TTL_MS,
    };
  }

  async login(email: string, password: string, req: Request, response: Response) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.adminUser.findUnique({ where: { email: normalizedEmail } });
    // Keep unknown-account and wrong-password paths close in cost.
    const valid = await bcrypt.compare(password, user?.passwordHash ?? this.dummyPasswordHash).catch(() => false);
    if (!user || !user.isActive || !valid) return null;

    // Rotate the current browser's session to prevent session fixation.
    const prior = req.cookies?.admin_session;
    if (prior) await this.prisma.adminSession.deleteMany({ where: { tokenHash: this.hashToken(prior) } });
    const token = randomBytes(32).toString('base64url');
    await this.prisma.adminSession.create({
      data: { tokenHash: this.hashToken(token), adminId: user.id, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
    });
    response.cookie('admin_session', token, this.cookieOptions());
    return { id: user.id, email: user.email, displayName: user.displayName };
  }

  async validateSession(token: string) {
    const session = await this.prisma.adminSession.findUnique({
      where: { tokenHash: this.hashToken(token) },
      include: { admin: true },
    });
    if (!session || session.expiresAt.getTime() <= Date.now() || !session.admin.isActive) {
      if (session) await this.prisma.adminSession.deleteMany({ where: { id: session.id } });
      return null;
    }
    await this.prisma.adminSession.update({ where: { id: session.id }, data: { lastSeen: new Date() } });
    return { id: session.admin.id, email: session.admin.email, displayName: session.admin.displayName };
  }

  async updateProfile(adminId: string, displayName: string, email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const admin = await this.prisma.adminUser.update({
        where: { id: adminId },
        data: { displayName: displayName.trim(), email: normalizedEmail },
        select: { id: true, displayName: true, email: true, createdAt: true, updatedAt: true },
      });
      return admin;
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('That email address is already used by another administrator.');
      }
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new NotFoundException('Administrator account not found.');
      }
      throw error;
    }
  }

  async changePassword(adminId: string, currentPassword: string, newPassword: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: adminId } });
    if (!admin || !admin.isActive) throw new NotFoundException('Administrator account not found.');
    const matches = await bcrypt.compare(currentPassword, admin.passwordHash).catch(() => false);
    if (!matches) throw new UnauthorizedException('Current password is incorrect.');
    if (currentPassword === newPassword) throw new ConflictException('Choose a password you have not used as your current password.');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.$transaction([
      this.prisma.adminUser.update({ where: { id: adminId }, data: { passwordHash } }),
      this.prisma.adminSession.deleteMany({ where: { adminId } }),
    ]);
  }

  async logout(token: string | undefined, response: Response) {
    if (token) await this.prisma.adminSession.deleteMany({ where: { tokenHash: this.hashToken(token) } });
    const { maxAge: _maxAge, ...options } = this.cookieOptions();
    response.clearCookie('admin_session', options);
    return { success: true };
  }
}
