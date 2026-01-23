import type { Request } from 'express';
import { prisma } from '../prisma.js';
import type { GraphQLContext } from '../types/context.js';

export const buildContext = async ({ req }: { req: Request }): Promise<GraphQLContext> => {
  const authHeader = req.headers.authorization ?? '';
  const user = null;

  if (authHeader) {
    // TODO: decode token and load user
  }

  return {
    prisma,
    user,
  };
};
