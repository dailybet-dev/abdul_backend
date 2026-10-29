import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { IS_PUBLIC_KEY } from './public.decorator';
import { AuthService } from './auth.service';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    const gql = context.getType<string>() === 'graphql';
    const gqlContext = gql ? GqlExecutionContext.create(context).getContext() : undefined;
    const req = gql ? gqlContext.req : context.switchToHttp().getRequest();
    const res = gql ? gqlContext.res : context.switchToHttp().getResponse();

    // Check Origin on unsafe methods even for public login endpoints to reduce login-CSRF risk.
    if (req.method && !['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase())) {
      const origin = req.headers.origin;
      const allowed = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map((s) => s.trim());
      // Permit GraphiQL served from this same backend origin as well as the trusted frontend.
      const backendOrigin = `${req.protocol}://${req.get('host')}`;
      if (origin && !allowed.includes(origin) && origin !== backendOrigin) {
        throw new ForbiddenException('Untrusted request origin');
      }
    }

    if (isPublic) return true;

    // GraphQL adapters/proxies can expose the raw Cookie header before cookie-parser
    // has populated req.cookies. Read the same httpOnly session cookie as a fallback.
    const cookieHeader = String(req.headers?.cookie || '');
    const rawSessionCookie = cookieHeader.split(';').map((part) => part.trim())
      .find((part) => part.startsWith('admin_session='));
    const token = req.cookies?.admin_session || (rawSessionCookie
      ? decodeURIComponent(rawSessionCookie.slice('admin_session='.length))
      : undefined);
    if (!token) throw new UnauthorizedException('Administrator login required');

    const admin = await this.auth.validateSession(token);
    if (!admin) {
      res.clearCookie('admin_session', this.auth.cookieOptions());
      throw new UnauthorizedException('Administrator session expired');
    }
    req.admin = admin;
    return true;
  }
}
