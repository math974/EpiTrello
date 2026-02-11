import { apolloClient } from './apollo';
import {
  WorkspaceActivityDocument,
  WorkspaceActivityQuery,
  ActivityFeedModel,
} from '../generated/graphql';

const DEFAULT_LIMIT = 30;

export async function getWorkspaceActivity(
  workspaceId: string,
  limit: number = DEFAULT_LIMIT,
  cursor?: string | null
): Promise<ActivityFeedModel> {
  const { data } = await apolloClient.query<WorkspaceActivityQuery>({
    query: WorkspaceActivityDocument,
    variables: { workspaceId, limit, cursor },
    fetchPolicy: 'network-only',
  });

  if (!data?.workspaceActivity) {
    throw new Error('Failed to load activity');
  }

  return data.workspaceActivity;
}
