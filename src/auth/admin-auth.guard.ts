import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { IS_PUBLIC_KEY } from './public.decorator';
import { AuthService } from './auth.service';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])) return true;

    const gql = context.getType<string>() === 'graphql';
    const req = gql ? GqlExecutionContext.create(context).getContext().req : context.switchToHttp().getRequest();
    const res = gql ? GqlExecutionContext.create(context).getContext().res : context.switchToHttp().getResponse();

    if (req.method && !['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase())) {
      const origin = req.headers.origin;
      const allowed = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map((s) => s.trim());
      if (origin && !allowed.includes(origin)) throw new ForbiddenException('Untrusted request origin');
    }

    const token = req.cookies?.admin_session;
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
