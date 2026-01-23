export const authTypeDefs = `#graphql
  type AuthPayload {
    token: String!
    user: User!
  }

  extend type Mutation {
    login(email: String!, password: String!): AuthPayload!
    register(username: String!, email: String!, password: String!): AuthPayload!
  }
`;
