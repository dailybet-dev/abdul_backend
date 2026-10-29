import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * ThrottlerGuard normally reads requests through the HTTP execution context.
 * GraphQL resolvers use a different execution context, so resolve the HTTP
 * request/response from the per-operation GraphQL context instead.
 */
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext) {
    if (context.getType<string>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context).getContext();
      const req = gqlContext?.req;
      const res = gqlContext?.res ?? req?.res;

      if (!req) {
        throw new Error(
          'GraphQL request context is missing req. Ensure GraphQLModule context exposes { req, res }.',
        );
      }

      return { req, res };
    }

    return {
      req: context.switchToHttp().getRequest(),
      res: context.switchToHttp().getResponse(),
    };
  }
}
