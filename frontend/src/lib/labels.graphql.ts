import { gql } from '@apollo/client';

export const CREATE_LABEL_MUTATION = gql`
  mutation CreateLabel($input: CreateLabelInput!) {
    createLabel(input: $input) {
      id
      name
      color
      workspaceId
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_LABEL_MUTATION = gql`
  mutation UpdateLabel($input: UpdateLabelInput!) {
    updateLabel(input: $input) {
      id
      name
      color
      workspaceId
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_LABEL_MUTATION = gql`
  mutation DeleteLabel($id: String!) {
    deleteLabel(id: $id)
  }
`;

export const ADD_LABEL_TO_CARD_MUTATION = gql`
  mutation AddLabelToCard($input: AddLabelToCardInput!) {
    addLabelToCard(input: $input) {
      id
      title
      listId
      labels {
        id
        name
        color
      }
    }
  }
`;

export const REMOVE_LABEL_FROM_CARD_MUTATION = gql`
  mutation RemoveLabelFromCard($input: RemoveLabelFromCardInput!) {
    removeLabelFromCard(input: $input) {
      id
      title
      listId
      labels {
        id
        name
        color
      }
    }
  }
`;
