import { gql } from '@apollo/client';

// GraphQL Queries and Mutations for workspaces
export const MY_WORKSPACES_QUERY = gql`
  query MyWorkspaces {
    myWorkspaces {
      id
      name
      ownerId
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_WORKSPACE_MUTATION = gql`
  mutation CreateWorkspace($input: CreateWorkspaceInput!) {
    createWorkspace(input: $input) {
      id
      name
      ownerId
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_WORKSPACE_MUTATION = gql`
  mutation UpdateWorkspace($input: UpdateWorkspaceInput!) {
    updateWorkspace(input: $input) {
      id
      name
      ownerId
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_WORKSPACE_MUTATION = gql`
  mutation DeleteWorkspace($id: String!) {
    deleteWorkspace(id: $id)
  }
`;

export const WORKSPACE_QUERY = gql`
  query Workspace($id: String!) {
    workspace(id: $id) {
      id
      name
      ownerId
      owner {
        id
        username
        email
      }
      members {
        userId
        workspaceId
        role
        user {
          id
          username
          email
          avatar
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export const ADD_WORKSPACE_MEMBER_MUTATION = gql`
  mutation AddWorkspaceMember($input: AddWorkspaceMemberInput!) {
    addWorkspaceMember(input: $input) {
      userId
      workspaceId
      role
      user {
        id
        username
        email
        avatar
      }
    }
  }
`;

export const REMOVE_WORKSPACE_MEMBER_MUTATION = gql`
  mutation RemoveWorkspaceMember($input: RemoveWorkspaceMemberInput!) {
    removeWorkspaceMember(input: $input)
  }
`;
