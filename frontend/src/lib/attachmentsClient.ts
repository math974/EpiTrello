import { apolloClient } from './apollo';
import {
  BoardDocument,
  CreateAttachmentUploadDocument,
  ConfirmAttachmentUploadDocument,
  DeleteAttachmentDocument,
  UpdateAttachmentDocument,
  GetAttachmentDownloadUrlDocument,
  CreateAttachmentUploadMutation,
  ConfirmAttachmentUploadMutation,
  DeleteAttachmentMutation,
  UpdateAttachmentMutation,
  GetAttachmentDownloadUrlQuery,
  AttachmentModel,
} from '../generated/graphql';

/**
 * Three-step attachment upload flow:
 * 1. createAttachmentUpload → get presigned uploadUrl + objectKey
 * 2. PUT file to uploadUrl
 * 3. confirmAttachmentUpload → move from tmp to final location and create DB record
 */
export async function uploadAttachment(
  cardId: string,
  file: File,
  boardId: string
): Promise<AttachmentModel> {
  const fileName = file.name || 'file';
  const mimeType = file.type || 'application/octet-stream';
  const size = file.size;

  const { data: uploadData } = await apolloClient.mutate<CreateAttachmentUploadMutation>({
    mutation: CreateAttachmentUploadDocument,
    variables: {
      input: { cardId, fileName, mimeType, size },
    },
  });

  if (!uploadData?.createAttachmentUpload?.uploadUrl || !uploadData?.createAttachmentUpload?.objectKey) {
    throw new Error('Failed to get upload URL');
  }

  const { uploadUrl, objectKey } = uploadData.createAttachmentUpload;

  const putResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': mimeType,
    },
  });

  if (!putResponse.ok) {
    throw new Error(`Upload failed: ${putResponse.statusText}`);
  }

  const { data: confirmData } = await apolloClient.mutate<ConfirmAttachmentUploadMutation>({
    mutation: ConfirmAttachmentUploadDocument,
    variables: {
      input: { cardId, objectKey, fileName, mimeType, size },
    },
    refetchQueries: [{ query: BoardDocument, variables: { id: boardId } }],
  });

  if (!confirmData?.confirmAttachmentUpload) {
    throw new Error('Failed to confirm upload');
  }

  return confirmData.confirmAttachmentUpload;
}

export async function deleteAttachment(attachmentId: string, boardId: string): Promise<boolean> {
  const { data } = await apolloClient.mutate<DeleteAttachmentMutation>({
    mutation: DeleteAttachmentDocument,
    variables: { input: { id: attachmentId } },
    refetchQueries: [{ query: BoardDocument, variables: { id: boardId } }],
  });
  return data?.deleteAttachment ?? false;
}

export async function updateAttachmentFileName(
  attachmentId: string,
  fileName: string,
  boardId: string
): Promise<AttachmentModel> {
  const { data } = await apolloClient.mutate<UpdateAttachmentMutation>({
    mutation: UpdateAttachmentDocument,
    variables: { input: { id: attachmentId, fileName } },
    refetchQueries: [{ query: BoardDocument, variables: { id: boardId } }],
  });
  if (!data?.updateAttachment) throw new Error('Failed to update attachment');
  return data.updateAttachment;
}

export async function getAttachmentDownloadUrl(attachmentId: string): Promise<string> {
  const { data } = await apolloClient.query<GetAttachmentDownloadUrlQuery>({
    query: GetAttachmentDownloadUrlDocument,
    variables: { attachmentId },
    fetchPolicy: 'network-only',
  });
  if (!data?.getAttachmentDownloadUrl) throw new Error('Failed to get download URL');
  return data.getAttachmentDownloadUrl;
}
