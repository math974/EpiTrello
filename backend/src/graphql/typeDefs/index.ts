import { authTypeDefs } from './auth.js';
import { baseTypeDefs } from './base.js';
import { boardTypeDefs } from './board.js';
import { cardTypeDefs } from './card.js';
import { commentTypeDefs } from './comment.js';
import { listTypeDefs } from './list.js';
import { userTypeDefs } from './user.js';

export const typeDefs = [
  baseTypeDefs,
  authTypeDefs,
  userTypeDefs,
  boardTypeDefs,
  listTypeDefs,
  cardTypeDefs,
  commentTypeDefs,
];
