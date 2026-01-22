import { prisma } from '../prisma.js';

type IdArgs = { id: string };
type CreateUserArgs = { username: string; email: string; avatar?: string | null };
type UpdateUserArgs = { id: string; username?: string; email?: string; avatar?: string | null };
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

export const resolvers = {
  Query: {
    users: async () => {
      return prisma.user.findMany();
    },
    user: async (_: unknown, { id }: IdArgs) => {
      return prisma.user.findUnique({ where: { id } });
    },
    boards: async () => {
      return prisma.board.findMany({ include: { owner: true } });
    },
    board: async (_: unknown, { id }: IdArgs) => {
      return prisma.board.findUnique({ where: { id }, include: { owner: true } });
    },
  },

  Mutation: {
    createUser: async (_: unknown, { username, email, avatar }: CreateUserArgs) => {
      return prisma.user.create({
        data: { username, email, avatar: avatar ?? null },
      });
    },
    updateUser: async (_: unknown, { id, username, email, avatar }: UpdateUserArgs) => {
      return prisma.user.update({
        where: { id },
        data: {
          ...(username !== undefined ? { username } : {}),
          ...(email !== undefined ? { email } : {}),
          ...(avatar !== undefined ? { avatar } : {}),
        },
      });
    },
    deleteUser: async (_: unknown, { id }: IdArgs) => {
      await prisma.board.deleteMany({ where: { ownerId: id } });
      await prisma.user.delete({ where: { id } });
      return true;
    },

    createBoard: async (_: unknown, { title, description, background, ownerId }: CreateBoardArgs) => {
      return prisma.board.create({
        data: {
          title,
          description: description ?? null,
          background: background ?? '#0079bf',
          ownerId,
        },
        include: { owner: true },
      });
    },
    updateBoard: async (_: unknown, { id, title, description, background }: UpdateBoardArgs) => {
      return prisma.board.update({
        where: { id },
        data: {
          ...(title !== undefined ? { title } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(background !== undefined ? { background } : {}),
        },
        include: { owner: true },
      });
    },
    deleteBoard: async (_: unknown, { id }: IdArgs) => {
      await prisma.board.delete({ where: { id } });
      return true;
    },
  },

  Board: {
    owner: async (parent: { owner: unknown }) => {
      if (parent && typeof parent === 'object' && 'owner' in parent) {
        const typedParent = parent as { owner: string | { username?: string } };
        if (typeof typedParent.owner === 'object' && typedParent.owner && 'username' in typedParent.owner) {
          return typedParent.owner;
        }
        return prisma.user.findUnique({ where: { id: typedParent.owner as string } });
      }
      return null;
    },
  },
};

