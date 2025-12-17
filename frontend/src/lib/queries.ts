import { gql } from '@apollo/client';

// User Queries
export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      username
      email
      avatar
      createdAt
    }
  }
`;

export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      username
      email
      avatar
      createdAt
    }
  }
`;

// Board Queries
export const GET_BOARDS = gql`
  query GetBoards {
    boards {
      id
      title
      description
      background
      owner {
        id
        username
        avatar
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_BOARD = gql`
  query GetBoard($id: ID!) {
    board(id: $id) {
      id
      title
      description
      background
      owner {
        id
        username
        avatar
      }
      createdAt
      updatedAt
    }
  }
`;

// User Mutations
export const CREATE_USER = gql`
  mutation CreateUser($username: String!, $email: String!, $avatar: String) {
    createUser(username: $username, email: $email, avatar: $avatar) {
      id
      username
      email
      avatar
    }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

// Board Mutations
export const CREATE_BOARD = gql`
  mutation CreateBoard($title: String!, $description: String, $background: String, $ownerId: ID!) {
    createBoard(title: $title, description: $description, background: $background, ownerId: $ownerId) {
      id
      title
      description
      background
      owner {
        id
        username
      }
    }
  }
`;

export const UPDATE_BOARD = gql`
  mutation UpdateBoard($id: ID!, $title: String, $description: String, $background: String) {
    updateBoard(id: $id, title: $title, description: $description, background: $background) {
      id
      title
      description
      background
    }
  }
`;

export const DELETE_BOARD = gql`
  mutation DeleteBoard($id: ID!) {
    deleteBoard(id: $id)
  }
`;

