import type { PrismaClient, User } from '@prisma/client';

export type AuthUser = Pick<User, 'id' | 'email' | 'username'> | null;

export type GraphQLContext = {
  prisma: PrismaClient;
  user: AuthUser;
};
