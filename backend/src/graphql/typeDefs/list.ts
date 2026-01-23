export const listTypeDefs = `#graphql
  type List {
    id: ID!
    title: String!
    position: Int!
    boardId: ID!
  }

  extend type Query {
    lists(boardId: ID!): [List!]!
  }

  extend type Mutation {
    createList(boardId: ID!, title: String!): List!
    updateList(id: ID!, title: String, position: Int): List
    deleteList(id: ID!): Boolean!
  }
`;
