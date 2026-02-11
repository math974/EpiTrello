import { gql } from '@apollo/client';

export const CREATE_CHECKLIST_MUTATION = gql`
  mutation CreateChecklist($input: CreateChecklistInput!) {
    createChecklist(input: $input) {
      id
      cardId
      title
      position
      items { id checklistId content checked position createdAt updatedAt }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_CHECKLIST_MUTATION = gql`
  mutation UpdateChecklist($input: UpdateChecklistInput!) {
    updateChecklist(input: $input) {
      id
      cardId
      title
      position
      items { id checklistId content checked position createdAt updatedAt }
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_CHECKLIST_MUTATION = gql`
  mutation DeleteChecklist($input: DeleteChecklistInput!) {
    deleteChecklist(input: $input)
  }
`;

export const REORDER_CHECKLISTS_MUTATION = gql`
  mutation ReorderChecklists($input: ReorderChecklistsInput!) {
    reorderChecklists(input: $input)
  }
`;

export const CREATE_CHECKLIST_ITEM_MUTATION = gql`
  mutation CreateChecklistItem($input: CreateChecklistItemInput!) {
    createChecklistItem(input: $input) {
      id
      checklistId
      content
      checked
      position
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_CHECKLIST_ITEM_MUTATION = gql`
  mutation UpdateChecklistItem($input: UpdateChecklistItemInput!) {
    updateChecklistItem(input: $input) {
      id
      checklistId
      content
      checked
      position
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_CHECKLIST_ITEM_MUTATION = gql`
  mutation DeleteChecklistItem($input: DeleteChecklistItemInput!) {
    deleteChecklistItem(input: $input)
  }
`;

export const REORDER_CHECKLIST_ITEMS_MUTATION = gql`
  mutation ReorderChecklistItems($input: ReorderChecklistItemsInput!) {
    reorderChecklistItems(input: $input)
  }
`;
