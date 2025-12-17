import { Board } from '../models/Board.js';
import { User } from '../models/User.js';

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
      return User.find();
    },
    user: async (_: unknown, { id }: IdArgs) => {
      return User.findById(id);
    },
    boards: async () => {
      return Board.find().populate('owner');
    },
    board: async (_: unknown, { id }: IdArgs) => {
      return Board.findById(id).populate('owner');
    },
  },

  Mutation: {
    createUser: async (_: unknown, { username, email, avatar }: CreateUserArgs) => {
      const user = new User({ username, email, avatar });
      return user.save();
    },
    updateUser: async (_: unknown, { id, username, email, avatar }: UpdateUserArgs) => {
      const updateData: Partial<UpdateUserArgs> = {};
      if (username !== undefined) updateData.username = username;
      if (email !== undefined) updateData.email = email;
      if (avatar !== undefined) updateData.avatar = avatar;

      return User.findByIdAndUpdate(id, updateData, { new: true });
    },
    deleteUser: async (_: unknown, { id }: IdArgs) => {
      const result = await User.findByIdAndDelete(id);
      return Boolean(result);
    },

    createBoard: async (_: unknown, { title, description, background, ownerId }: CreateBoardArgs) => {
      const board = new Board({
        title,
        description: description ?? '',
        background: background ?? '#0079bf',
        owner: ownerId,
      });
      const savedBoard = await board.save();
      return Board.findById(savedBoard._id).populate('owner');
    },
    updateBoard: async (_: unknown, { id, title, description, background }: UpdateBoardArgs) => {
      const updateData: Partial<UpdateBoardArgs> = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (background !== undefined) updateData.background = background;

      return Board.findByIdAndUpdate(id, updateData, { new: true }).populate('owner');
    },
    deleteBoard: async (_: unknown, { id }: IdArgs) => {
      const result = await Board.findByIdAndDelete(id);
      return Boolean(result);
    },
  },

  Board: {
    owner: async (parent: { owner: unknown }) => {
      if (parent && typeof parent === 'object' && 'owner' in parent) {
        const typedParent = parent as { owner: string | { username?: string } };
        // If already populated
        if (typeof typedParent.owner === 'object' && typedParent.owner && 'username' in typedParent.owner) {
          return typedParent.owner;
        }
        return User.findById(typedParent.owner as string);
      }
      return null;
    },
  },
};

