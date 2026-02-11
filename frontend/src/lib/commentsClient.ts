import { apolloClient } from './apollo';
import {
  BoardDocument,
  AddCommentDocument,
  DeleteCommentDocument,
  AddCommentMutation,
  DeleteCommentMutation,
  CommentModel,
} from '../generated/graphql';

/**
 * Add a comment to a card
 */
export async function addComment(
  cardId: string,
  content: string,
  boardId: string
): Promise<CommentModel> {
  const { data } = await apolloClient.mutate<AddCommentMutation>({
    mutation: AddCommentDocument,
    variables: {
      input: { cardId, content },
    },
    refetchQueries: [{ query: BoardDocument, variables: { id: boardId } }],
  });

  if (!data?.addComment) {
    throw new Error('Adding comment failed: No data returned');
  }

  return data.addComment;
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string, boardId: string): Promise<boolean> {
  const { data } = await apolloClient.mutate<DeleteCommentMutation>({
    mutation: DeleteCommentDocument,
    variables: { id: commentId },
    refetchQueries: [{ query: BoardDocument, variables: { id: boardId } }],
  });

  if (data?.deleteComment === undefined) {
    throw new Error('Delete comment failed: No data returned');
  }

  return data.deleteComment;
}
