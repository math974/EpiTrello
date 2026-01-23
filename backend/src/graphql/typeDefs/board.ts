export const boardTypeDefs = `#graphql
  type Board {
    id: ID!
    title: String!
    description: String
    background: String!
    owner: User!
    createdAt: String!
    updatedAt: String!
  }

  extend type Query {
    boards: [Board!]!
    board(id: ID!): Board
  }

  extend type Mutation {
    createBoard(title: String!, description: String, background: String, ownerId: ID!): Board!
    updateBoard(id: ID!, title: String, description: String, background: String): Board
    deleteBoard(id: ID!): Boolean!
  }
`;
