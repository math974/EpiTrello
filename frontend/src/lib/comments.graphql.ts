import { gql } from '@apollo/client';

export const ADD_COMMENT_MUTATION = gql`
  mutation AddComment($input: AddCommentInput!) {
    addComment(input: $input) {
      id
      content
      cardId
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
  }
`;

export const DELETE_COMMENT_MUTATION = gql`
  mutation DeleteComment($id: String!) {
    deleteComment(id: $id)
  }
`;
