import type { GraphQLContext } from '../../types/context.js';

type IdArgs = { id: string };
type CreateUserArgs = { username: string; email: string; avatar?: string | null };
type UpdateUserArgs = { id: string; username?: string; email?: string; avatar?: string | null };

type ResolverParent = unknown;

type Resolver = (
  parent: ResolverParent,
  args: Record<string, unknown>,
  context: GraphQLContext
) => unknown;

export const userResolvers: Record<string, Record<string, Resolver>> = {
  Query: {
    users: async (_parent, _args, context) => {
      return context.prisma.user.findMany();
    },
    user: async (_parent, { id }, context) => {
      return context.prisma.user.findUnique({ where: { id: id as string } });
    },
  },

  Mutation: {
    createUser: async (_parent, args, context) => {
      const { username, email, avatar } = args as CreateUserArgs;
      return context.prisma.user.create({
        data: { username, email, avatar: avatar ?? null },
      });
    },
    updateUser: async (_parent, args, context) => {
      const { id, username, email, avatar } = args as UpdateUserArgs;
      return context.prisma.user.update({
        where: { id },
        data: {
          ...(username !== undefined ? { username } : {}),
          ...(email !== undefined ? { email } : {}),
          ...(avatar !== undefined ? { avatar } : {}),
        },
      });
    },
    deleteUser: async (_parent, { id }, context) => {
      await context.prisma.board.deleteMany({ where: { ownerId: id as string } });
      await context.prisma.user.delete({ where: { id: id as string } });
      return true;
    },
  },
};
