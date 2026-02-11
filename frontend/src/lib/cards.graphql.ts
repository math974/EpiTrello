import { gql } from '@apollo/client';

// GraphQL Queries and Mutations for cards

export const CREATE_CARD_MUTATION = gql`
  mutation CreateCard($input: CreateCardInput!) {
    createCard(input: $input) {
      id
      title
      description
      position
      archived
      archivedPosition
      done
      listId
      assignees {
        id
        username
        email
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_CARD_MUTATION = gql`
  mutation UpdateCard($input: UpdateCardInput!) {
    updateCard(input: $input) {
      id
      title
      description
      position
      archived
      archivedPosition
      done
      listId
      assignees {
        id
        username
        email
      }
      createdAt
      updatedAt
    }
  }
`;

export const ARCHIVE_CARD_MUTATION = gql`
  mutation ArchiveCard($input: ArchiveCardInput!) {
    archiveCard(input: $input) {
      id
      title
      description
      position
      archived
      archivedPosition
      done
      listId
      assignees {
        id
        username
        email
      }
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_CARD_MUTATION = gql`
  mutation DeleteCard($id: String!) {
    deleteCard(id: $id)
  }
`;

export const MOVE_CARD_MUTATION = gql`
  mutation MoveCard($input: MoveCardInput!) {
    moveCard(input: $input) {
      id
      title
      description
      position
      archived
      archivedPosition
      done
      listId
      assignees {
        id
        username
        email
      }
      createdAt
      updatedAt
    }
  }
`;

export const SET_CARD_DONE_MUTATION = gql`
  mutation SetCardDone($input: SetCardDoneInput!) {
    setCardDone(input: $input) {
      id
      title
      description
      position
      archived
      archivedPosition
      done
      listId
      assignees {
        id
        username
        email
      }
      createdAt
      updatedAt
    }
  }
`;

export const ASSIGN_USER_TO_CARD_MUTATION = gql`
  mutation AssignUserToCard($input: AssignUserToCardInput!) {
    assignUserToCard(input: $input)
  }
`;

export const UNASSIGN_USER_FROM_CARD_MUTATION = gql`
  mutation UnassignUserFromCard($input: UnassignUserFromCardInput!) {
    unassignUserFromCard(input: $input)
  }
`;

export const SET_CARD_ASSIGNEES_MUTATION = gql`
  mutation SetCardAssignees($input: SetCardAssigneesInput!) {
    setCardAssignees(input: $input)
  }
`;

export const SET_CARD_DUE_DATE_MUTATION = gql`
  mutation SetCardDueDate($input: SetCardDueDateInput!) {
    setCardDueDate(input: $input) {
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
      createdAt
      updatedAt
    }
  }
`;

export const CLEAR_CARD_DUE_DATE_MUTATION = gql`
  mutation ClearCardDueDate($input: ClearCardDueDateInput!) {
    clearCardDueDate(input: $input) {
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
      createdAt
      updatedAt
    }
  }
`;

