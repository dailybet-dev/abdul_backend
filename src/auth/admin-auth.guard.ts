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

    if (req.method && !['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase())) {
      const origin = req.headers.origin;
      const allowed = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map((s) => s.trim());
      const backendOrigin = `${req.protocol}://${req.get('host')}`;
      if (origin && !allowed.includes(origin) && origin !== backendOrigin) {
        throw new ForbiddenException('Untrusted request origin');
      }
    }

    if (isPublic) return true;

    // A browser can temporarily send more than one same-named cookie (for
    // example after a cookie Domain/host migration). Do not let an expired
    // duplicate selected by cookie-parser mask another still-valid session.
    const candidates: string[] = [];
    const addCandidate = (value: unknown) => {
      if (typeof value === 'string' && value.trim() && !candidates.includes(value.trim())) {
        candidates.push(value.trim());
      }
    };

    addCandidate(req.cookies?.admin_session);

    const cookieHeader = String(req.headers?.cookie || '');
    for (const part of cookieHeader.split(';')) {
      const trimmed = part.trim();
      if (!trimmed.startsWith('admin_session=')) continue;
      const value = trimmed.slice('admin_session='.length);
      try { addCandidate(decodeURIComponent(value)); }
      catch { addCandidate(value); }
    }

    addCandidate(req.headers?.['x-admin-session']);
    const authorization = String(req.headers?.authorization || '');
    addCandidate(authorization.match(/^Bearer\s+(.+)$/i)?.[1]);

    if (candidates.length === 0) {
      throw new UnauthorizedException('Administrator login required');
    }

    // Validate each distinct candidate. The first valid database-backed
    // session wins; invalid duplicate/forwarded values cannot log out an
    // administrator whose other cookie value is still valid.
    for (const token of candidates) {
      const admin = await this.auth.validateSession(token);
      if (admin) {
        req.admin = admin;
        return true;
      }
    }

    const { maxAge: _maxAge, ...clearOptions } = this.auth.cookieOptions();
    res.clearCookie('admin_session', clearOptions);
    throw new UnauthorizedException('Administrator session expired');
  }
}
