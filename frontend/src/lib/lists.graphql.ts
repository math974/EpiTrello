import { gql } from '@apollo/client';

// GraphQL Queries and Mutations for lists

export const BOARD_QUERY = gql`
  query Board($id: String!) {
    board(id: $id) {
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
      workspace {
        id
        labels {
          id
          name
          color
        }
      }
      lists {
        id
        title
        position
        archived
        archivedPosition
        boardId
        cards {
          id
          title
          description
          position
          archived
          archivedPosition
          done
          listId
          dueDate
          assignees {
            id
            username
            email
          }
          comments {
            id
            content
            authorId
            createdAt
            updatedAt
            author {
              id
              username
              email
              avatar
            }
          }
          labels {
            id
            name
            color
          }
          attachments {
            id
            cardId
            uploaderId
            fileName
            mimeType
            size
            createdAt
            uploader {
              id
              username
              email
            }
          }
          checklists {
            id
            cardId
            title
            position
            items {
              id
              checklistId
              content
              checked
              position
            }
            createdAt
            updatedAt
          }
        }
        createdAt
        updatedAt
      }
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_LIST_MUTATION = gql`
  mutation CreateList($input: CreateListInput!) {
    createList(input: $input) {
      id
      title
      position
      archived
      archivedPosition
      boardId
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_LIST_MUTATION = gql`
  mutation UpdateList($input: UpdateListInput!) {
    updateList(input: $input) {
      id
      title
      position
      archived
      archivedPosition
      boardId
      createdAt
      updatedAt
    }
  }
`;

export const ARCHIVE_LIST_MUTATION = gql`
  mutation ArchiveList($input: ArchiveListInput!) {
    archiveList(input: $input) {
      id
      title
      position
      archived
      archivedPosition
      boardId
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_LIST_MUTATION = gql`
  mutation DeleteList($id: String!) {
    deleteList(id: $id)
  }
`;

export const REORDER_LISTS_MUTATION = gql`
  mutation ReorderLists($input: ReorderListsInput!) {
    reorderLists(input: $input)
  }
`;

