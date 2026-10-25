import { Injectable } from '@nestjs/common';
import { ConfigService } from './config.service';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  private hashToken(token: string) {
    return createHash('sha256').update(token).update(this.config.sessionHashSecret).digest('hex');
  }

  cookieOptions() {
    const production = process.env.NODE_ENV === 'production';
    const domain = process.env.COOKIE_DOMAIN?.trim();
    return {
      httpOnly: true,
      secure: production,
      sameSite: (production ? 'none' : 'lax') as 'none' | 'lax',
      path: '/',
      ...(domain ? { domain } : {}),
      maxAge: SESSION_TTL_MS,
    };
  }

  async login(email: string, password: string, response: Response) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.adminUser.findUnique({ where: { email: normalizedEmail } });
    // Perform a dummy bcrypt comparison for unknown users to reduce timing-based account enumeration.
    const hash = user?.passwordHash ?? '$2b$12$C6UzMDM.H6dfI/f/IKcEe.4VQ7P7gHj3tD9y3s2j7m4c9n2k2Pq6qK';
    const valid = await bcrypt.compare(password, hash).catch(() => false);
    if (!user || !user.isActive || !valid) return null;

    // Rotate sessions: delete any prior session using this browser cookie, then issue a random 256-bit token.
    const prior = response.req?.cookies?.admin_session;
    if (prior) await this.prisma.adminSession.deleteMany({ where: { tokenHash: this.hashToken(prior) } });
    const token = randomBytes(32).toString('base64url');
    await this.prisma.adminSession.create({
      data: { tokenHash: this.hashToken(token), adminId: user.id, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
    });
    response.cookie('admin_session', token, this.cookieOptions());
    return { id: user.id, email: user.email };
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
    return { id: session.admin.id, email: session.admin.email };
  }

  async logout(token: string | undefined, response: Response) {
    if (token) await this.prisma.adminSession.deleteMany({ where: { tokenHash: this.hashToken(token) } });
    response.clearCookie('admin_session', { ...this.cookieOptions(), maxAge: undefined });
    return { success: true };
  }
}
