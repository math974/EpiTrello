import { apolloClient } from './apollo';
import {
  BoardDocument,
  CreateCardDocument,
  UpdateCardDocument,
  ArchiveCardDocument,
  DeleteCardDocument,
  MoveCardDocument,
  SetCardDoneDocument,
  AssignUserToCardDocument,
  UnassignUserFromCardDocument,
  SetCardAssigneesDocument,
  SetCardDueDateDocument,
  ClearCardDueDateDocument,
  CreateCardMutation,
  UpdateCardMutation,
  ArchiveCardMutation,
  DeleteCardMutation,
  MoveCardMutation,
  SetCardDoneMutation,
  AssignUserToCardMutation,
  UnassignUserFromCardMutation,
  SetCardAssigneesMutation,
  SetCardDueDateMutation,
  ClearCardDueDateMutation,
  CardModel,
} from '../generated/graphql';

/**
 * Create a new card in a list
 */
export async function createCard(listId: string, title: string, boardId: string): Promise<CardModel> {
  try {
    const { data } = await apolloClient.mutate<CreateCardMutation>({
      mutation: CreateCardDocument,
      variables: {
        input: { listId, title },
      },
      refetchQueries: [{ query: BoardDocument, variables: { id: boardId } }],
    });

    if (!data?.createCard) {
      throw new Error('Card creation failed: No data returned');
    }

    return data.createCard;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Update a card (title / description / done)
 */
export async function updateCard(
  cardId: string,
  boardId: string,
  options: { title?: string; description?: string | null; done?: boolean }
): Promise<CardModel> {
  try {
    const { data } = await apolloClient.mutate<UpdateCardMutation>({
      mutation: UpdateCardDocument,
      variables: {
        input: {
          id: cardId,
          title: options.title,
          description: options.description,
          done: options.done,
        },
      },
      refetchQueries: [{ query: BoardDocument, variables: { id: boardId } }],
    });

    if (!data?.updateCard) {
      throw new Error('Card update failed: No data returned');
    }

    return data.updateCard;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Archive or unarchive a card
 */
export async function archiveCard(cardId: string, archived: boolean, boardId: string): Promise<CardModel> {
  try {
    const { data } = await apolloClient.mutate<ArchiveCardMutation>({
      mutation: ArchiveCardDocument,
      variables: {
        input: { id: cardId, archived },
      },
      refetchQueries: [{ query: BoardDocument, variables: { id: boardId } }],
    });

    if (!data?.archiveCard) {
      throw new Error('Card archive failed: No data returned');
    }

    return data.archiveCard;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Delete a card
 */
export async function deleteCard(cardId: string, boardId: string): Promise<boolean> {
  try {
    const { data } = await apolloClient.mutate<DeleteCardMutation>({
      mutation: DeleteCardDocument,
      variables: { id: cardId },
      refetchQueries: [{ query: BoardDocument, variables: { id: boardId } }],
    });

    return data?.deleteCard ?? false;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Move a card to another list / position
 */
export async function moveCard(
  cardId: string,
  toListId: string,
  toIndex: number,
  boardId: string
): Promise<CardModel> {
  try {
    const { data } = await apolloClient.mutate<MoveCardMutation>({
      mutation: MoveCardDocument,
      variables: {
        input: { cardId, toListId, toIndex },
      },
      refetchQueries: [{ query: BoardDocument, variables: { id: boardId } }],
    });

    if (!data?.moveCard) {
      throw new Error('Move card failed: No data returned');
    }

    return data.moveCard;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Set card done flag
 */
export async function setCardDone(cardId: string, done: boolean, boardId: string): Promise<CardModel> {
  try {
    const { data } = await apolloClient.mutate<SetCardDoneMutation>({
      mutation: SetCardDoneDocument,
      variables: {
        input: { cardId, done },
      },
      refetchQueries: [{ query: BoardDocument, variables: { id: boardId } }],
    });

    if (!data?.setCardDone) {
      throw new Error('Set card done failed: No data returned');
    }

    return data.setCardDone;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Assign a user to a card
 */
export async function assignUserToCard(cardId: string, userId: string, boardId: string): Promise<boolean> {
  try {
    const { data } = await apolloClient.mutate<AssignUserToCardMutation>({
      mutation: AssignUserToCardDocument,
      variables: {
        input: { cardId, userId },
      },
      refetchQueries: [{ query: BoardDocument, variables: { id: boardId } }],
    });

    return data?.assignUserToCard ?? false;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Unassign a user from a card
 */
export async function unassignUserFromCard(cardId: string, userId: string, boardId: string): Promise<boolean> {
  try {
    const { data } = await apolloClient.mutate<UnassignUserFromCardMutation>({
      mutation: UnassignUserFromCardDocument,
      variables: {
        input: { cardId, userId },
      },
      refetchQueries: [{ query: BoardDocument, variables: { id: boardId } }],
    });

    return data?.unassignUserFromCard ?? false;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Set card assignees list
 */
export async function setCardAssignees(cardId: string, userIds: string[]): Promise<boolean> {
  try {
    const { data } = await apolloClient.mutate<SetCardAssigneesMutation>({
      mutation: SetCardAssigneesDocument,
      variables: {
        input: { cardId, userIds },
      },
    });

    return data?.setCardAssignees ?? false;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Set card due date (dueDate: ISO date string, e.g. "2024-12-31T23:59:59.000Z")
 */
export async function setCardDueDate(
  cardId: string,
  dueDate: string,
  boardId: string
): Promise<CardModel> {
  try {
    const { data } = await apolloClient.mutate<SetCardDueDateMutation>({
      mutation: SetCardDueDateDocument,
      variables: {
        input: { cardId, dueDate },
      },
      refetchQueries: [{ query: BoardDocument, variables: { id: boardId } }],
    });

    if (!data?.setCardDueDate) {
      throw new Error('Set card due date failed: No data returned');
    }
    return data.setCardDueDate;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Clear card due date
 */
export async function clearCardDueDate(cardId: string, boardId: string): Promise<CardModel> {
  try {
    const { data } = await apolloClient.mutate<ClearCardDueDateMutation>({
      mutation: ClearCardDueDateDocument,
      variables: {
        input: { cardId },
      },
      refetchQueries: [{ query: BoardDocument, variables: { id: boardId } }],
    });

    if (!data?.clearCardDueDate) {
      throw new Error('Clear card due date failed: No data returned');
    }
    return data.clearCardDueDate;
  } catch (error: any) {
    throw error;
  }
}

// Re-export type for convenience
export type { CardModel } from '../generated/graphql';


