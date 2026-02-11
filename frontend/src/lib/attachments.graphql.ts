import { gql } from '@apollo/client';

export const CREATE_ATTACHMENT_UPLOAD_MUTATION = gql`
  mutation CreateAttachmentUpload($input: CreateAttachmentUploadInput!) {
    createAttachmentUpload(input: $input) {
      uploadUrl
      objectKey
    }
  }
`;

export const CONFIRM_ATTACHMENT_UPLOAD_MUTATION = gql`
  mutation ConfirmAttachmentUpload($input: ConfirmAttachmentUploadInput!) {
    confirmAttachmentUpload(input: $input) {
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
  }
`;

export const DELETE_ATTACHMENT_MUTATION = gql`
  mutation DeleteAttachment($input: DeleteAttachmentInput!) {
    deleteAttachment(input: $input)
  }
`;

export const UPDATE_ATTACHMENT_MUTATION = gql`
  mutation UpdateAttachment($input: UpdateAttachmentInput!) {
    updateAttachment(input: $input) {
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
  }
`;

export const GET_ATTACHMENT_DOWNLOAD_URL_QUERY = gql`
  query GetAttachmentDownloadUrl($attachmentId: String!) {
    getAttachmentDownloadUrl(attachmentId: $attachmentId)
  }
`;
