import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export interface CurrentAdmin {
  id: string;
  email: string;
}

export const Admin = createParamDecorator((_data: unknown, context: ExecutionContext): CurrentAdmin | undefined => {
  if (context.getType<string>() === 'graphql') {
    return GqlExecutionContext.create(context).getContext().req.admin;
  }
  return context.switchToHttp().getRequest().admin;
});
