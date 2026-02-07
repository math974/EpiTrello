import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator((data: string | undefined, context: ExecutionContext) => {
  const gqlCtx = GqlExecutionContext.create(context).getContext();
  const user = gqlCtx.user ?? null;
  
  if (!user) {
    return null;
  }
  
  // If a property name is provided (e.g., 'id'), extract that property
  if (data) {
    return user[data] ?? null;
  }
  
  // Otherwise, return the full user object
  return user;
});
