import { gql } from '@apollo/client';

export const WORKSPACE_ACTIVITY_QUERY = gql`
  query WorkspaceActivity($workspaceId: String!, $limit: Int, $cursor: String) {
    workspaceActivity(workspaceId: $workspaceId, limit: $limit, cursor: $cursor) {
      activities {
        id
        type
        actorId
        createdAt
        metadata
        actor {
          id
          username
          email
        }
        board {
          id
          title
        }
        workspace {
          id
          name
        }
      }
      hasMore
      nextCursor
    }
  }
`;
