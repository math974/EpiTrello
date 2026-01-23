export const commentTypeDefs = `#graphql
  type Comment {
    id: ID!
    content: String!
    cardId: ID!
    authorId: ID!
    createdAt: String!
  }

  extend type Query {
    comments(cardId: ID!): [Comment!]!
  }

  extend type Mutation {
    createComment(cardId: ID!, content: String!): Comment!
    deleteComment(id: ID!): Boolean!
  }
`;
