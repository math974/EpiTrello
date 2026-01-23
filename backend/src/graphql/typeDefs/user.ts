export const userTypeDefs = `#graphql
  type User {
    id: ID!
    username: String!
    email: String!
    avatar: String
    createdAt: String!
  }

  extend type Query {
    users: [User!]!
    user(id: ID!): User
  }

  extend type Mutation {
    createUser(username: String!, email: String!, avatar: String): User!
    updateUser(id: ID!, username: String, email: String, avatar: String): User
    deleteUser(id: ID!): Boolean!
  }
`;
