import type { GraphQLContext } from '../../types/context.js';

type IdArgs = { id: string };
type CreateBoardArgs = {
  title: string;
  description?: string | null;
  background?: string | null;
  ownerId: string;
};
type UpdateBoardArgs = {
  id: string;
  title?: string;
  description?: string | null;
  background?: string | null;
};

type ResolverParent = unknown;

type Resolver = (
  parent: ResolverParent,
  args: Record<string, unknown>,
  context: GraphQLContext
) => unknown;

export const boardResolvers: Record<string, Record<string, Resolver>> = {
  Query: {
    boards: async (_parent, _args, context) => {
      return context.prisma.board.findMany({ include: { owner: true } });
    },
    board: async (_parent, { id }, context) => {
      return context.prisma.board.findUnique({
        where: { id: id as string },
        include: { owner: true },
      });
    },
  },

  Mutation: {
    createBoard: async (_parent, args, context) => {
      const { title, description, background, ownerId } = args as CreateBoardArgs;
      return context.prisma.board.create({
        data: {
          title,
          description: description ?? null,
          background: background ?? '#0079bf',
          ownerId,
        },
        include: { owner: true },
      });
    },
    updateBoard: async (_parent, args, context) => {
      const { id, title, description, background } = args as UpdateBoardArgs;
      return context.prisma.board.update({
        where: { id },
        data: {
          ...(title !== undefined ? { title } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(background !== undefined ? { background } : {}),
        },
        include: { owner: true },
      });
    },
    deleteBoard: async (_parent, { id }, context) => {
      await context.prisma.board.delete({ where: { id: id as string } });
      return true;
    },
  },

  Board: {
    owner: async (parent, _args, context) => {
      if (parent && typeof parent === 'object' && 'owner' in parent) {
        const typedParent = parent as { owner: string | { username?: string } };
        if (typeof typedParent.owner === 'object' && typedParent.owner && 'username' in typedParent.owner) {
          return typedParent.owner;
        }
        return context.prisma.user.findUnique({ where: { id: typedParent.owner as string } });
      }
      return null;
    },
  },
};
