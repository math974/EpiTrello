import { gql } from '@apollo/client';

// GraphQL Mutations and Queries for authentication
export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user {
        id
        username
        email
        avatar
        createdAt
      }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      user {
        id
        username
        email
        avatar
        createdAt
      }
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      username
      email
      avatar
      createdAt
    }
  }
`;

export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($input: RefreshTokenInput) {
    refreshToken(input: $input) {
      accessToken
      refreshToken
      user {
        id
        username
        email
        avatar
        createdAt
      }
    }
  }
`;

