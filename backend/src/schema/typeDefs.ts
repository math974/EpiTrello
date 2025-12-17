export const typeDefs = `#graphql
  type User {
    id: ID!
    username: String!
    email: String!
    avatar: String
    createdAt: String!
  }

  type Board {
    id: ID!
    title: String!
    description: String
    background: String!
    owner: User!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    # Users
    users: [User!]!
    user(id: ID!): User

    # Boards
    boards: [Board!]!
    board(id: ID!): Board
  }

  type Mutation {
    # Users
    createUser(username: String!, email: String!, avatar: String): User!
    updateUser(id: ID!, username: String, email: String, avatar: String): User
    deleteUser(id: ID!): Boolean!

    # Boards
    createBoard(title: String!, description: String, background: String, ownerId: ID!): Board!
    updateBoard(id: ID!, title: String, description: String, background: String): Board
    deleteBoard(id: ID!): Boolean!
  }
`;

