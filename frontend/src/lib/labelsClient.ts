import { apolloClient } from './apollo';
import {
  WorkspaceDocument,
  BoardDocument,
  CreateLabelDocument,
  UpdateLabelDocument,
  DeleteLabelDocument,
  AddLabelToCardDocument,
  RemoveLabelFromCardDocument,
  CreateLabelMutation,
  UpdateLabelMutation,
  DeleteLabelMutation,
  AddLabelToCardMutation,
  RemoveLabelFromCardMutation,
  LabelModel,
  CardModel,
} from '../generated/graphql';

export async function createLabel(
  workspaceId: string,
  name: string,
  color: string
): Promise<LabelModel> {
  const { data } = await apolloClient.mutate<CreateLabelMutation>({
    mutation: CreateLabelDocument,
    variables: { input: { workspaceId, name, color } },
    refetchQueries: [{ query: WorkspaceDocument, variables: { id: workspaceId } }],
  });
  if (!data?.createLabel) throw new Error('Create label failed');
  return data.createLabel;
}

export async function updateLabel(
  id: string,
  workspaceId: string,
  options: { name?: string; color?: string }
): Promise<LabelModel> {
  const { data } = await apolloClient.mutate<UpdateLabelMutation>({
    mutation: UpdateLabelDocument,
    variables: { input: { id, name: options.name ?? undefined, color: options.color ?? undefined } },
    refetchQueries: [{ query: WorkspaceDocument, variables: { id: workspaceId } }],
  });
  if (!data?.updateLabel) throw new Error('Update label failed');
  return data.updateLabel;
}

export async function deleteLabel(labelId: string, workspaceId: string): Promise<boolean> {
  const { data } = await apolloClient.mutate<DeleteLabelMutation>({
    mutation: DeleteLabelDocument,
    variables: { id: labelId },
    refetchQueries: [{ query: WorkspaceDocument, variables: { id: workspaceId } }],
  });
  return data?.deleteLabel ?? false;
}

export async function addLabelToCard(
  cardId: string,
  labelId: string,
  boardId: string
): Promise<CardModel> {
  const { data } = await apolloClient.mutate<AddLabelToCardMutation>({
    mutation: AddLabelToCardDocument,
    variables: { input: { cardId, labelId } },
    refetchQueries: [{ query: BoardDocument, variables: { id: boardId } }],
  });
  if (!data?.addLabelToCard) throw new Error('Add label to card failed');
  return data.addLabelToCard;
}

export async function removeLabelFromCard(
  cardId: string,
  labelId: string,
  boardId: string
): Promise<CardModel> {
  const { data } = await apolloClient.mutate<RemoveLabelFromCardMutation>({
    mutation: RemoveLabelFromCardDocument,
    variables: { input: { cardId, labelId } },
    refetchQueries: [{ query: BoardDocument, variables: { id: boardId } }],
  });
  if (!data?.removeLabelFromCard) throw new Error('Remove label from card failed');
  return data.removeLabelFromCard;
}
