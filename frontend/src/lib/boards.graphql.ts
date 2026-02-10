import { gql } from '@apollo/client';

// GraphQL Queries and Mutations for boards
export const WORKSPACE_BOARDS_QUERY = gql`
  query WorkspaceBoards($workspaceId: String!) {
    workspaceBoards(workspaceId: $workspaceId) {
      id
      title
      description
      background
      ownerId
      workspaceId
      owner {
        id
        username
        email
      }
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_BOARD_MUTATION = gql`
  mutation CreateBoard($input: CreateBoardInput!) {
    createBoard(input: $input) {
      id
      title
      description
      background
      ownerId
      workspaceId
      owner {
        id
        username
        email
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_BOARD_MUTATION = gql`
  mutation UpdateBoard($input: UpdateBoardInput!) {
    updateBoard(input: $input) {
      id
      title
      description
      background
      ownerId
      workspaceId
      owner {
        id
        username
        email
      }
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_BOARD_MUTATION = gql`
  mutation DeleteBoard($id: String!) {
    deleteBoard(id: $id)
  }
`;

