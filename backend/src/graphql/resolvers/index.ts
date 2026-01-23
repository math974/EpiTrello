import { authResolvers } from './auth.js';
import { boardResolvers } from './board.js';
import { cardResolvers } from './card.js';
import { commentResolvers } from './comment.js';
import { listResolvers } from './list.js';
import { userResolvers } from './user.js';

type ResolverMap = Record<string, Record<string, unknown>>;

const mergeResolvers = (...resolverMaps: ResolverMap[]): ResolverMap => {
  return resolverMaps.reduce<ResolverMap>((acc, resolverMap) => {
    Object.entries(resolverMap).forEach(([typeName, fields]) => {
      acc[typeName] = { ...(acc[typeName] ?? {}), ...fields };
    });
    return acc;
  }, {});
};

export const resolvers = mergeResolvers(
  authResolvers,
  userResolvers,
  boardResolvers,
  listResolvers,
  cardResolvers,
  commentResolvers
);
