export const cardTypeDefs = `#graphql
  type Card {
    id: ID!
    title: String!
    description: String
    position: Int!
    listId: ID!
  }

  extend type Query {
    cards(listId: ID!): [Card!]!
  }

  extend type Mutation {
    createCard(listId: ID!, title: String!, description: String): Card!
    updateCard(id: ID!, title: String, description: String, position: Int): Card
    deleteCard(id: ID!): Boolean!
  }
`;
