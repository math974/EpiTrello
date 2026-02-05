import { User } from '@prisma/client';
import { ActivitiesResolver } from './activities.resolver';
import { ActivitiesService } from './activities.service';

describe('ActivitiesResolver', () => {
  const activitiesService = {
    getWorkspaceActivities: jest.fn(),
  } as unknown as ActivitiesService;
  const resolver = new ActivitiesResolver(activitiesService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('queries workspace activities for the current user', async () => {
    const user = { id: 'user-1' } as User;
    const workspaceId = 'workspace-1';
    const limit = 20;
    const cursor = '2024-01-01T10:00:00Z';

    const feed = {
      activities: [
        {
          id: 'activity-1',
          workspaceId,
          type: 'CARD_CREATED',
          createdAt: new Date(),
        },
      ],
      hasMore: false,
      nextCursor: null,
    };

    activitiesService.getWorkspaceActivities = jest.fn().mockResolvedValue(feed);

    const result = await resolver.workspaceActivity(workspaceId, limit, cursor, user);

    expect(activitiesService.getWorkspaceActivities).toHaveBeenCalledWith(
      workspaceId,
      user.id,
      limit,
      cursor
    );
    expect(result).toBe(feed);
  });

  it('queries workspace activities without cursor', async () => {
    const user = { id: 'user-1' } as User;
    const workspaceId = 'workspace-1';
    const limit = 20;

    const feed = {
      activities: [],
      hasMore: false,
      nextCursor: null,
    };

    activitiesService.getWorkspaceActivities = jest.fn().mockResolvedValue(feed);

    const result = await resolver.workspaceActivity(workspaceId, limit, null, user);

    expect(activitiesService.getWorkspaceActivities).toHaveBeenCalledWith(
      workspaceId,
      user.id,
      limit,
      null
    );
    expect(result).toBe(feed);
  });

  it('throws error when user is not authenticated', async () => {
    await expect(
      resolver.workspaceActivity('workspace-1', 20, null, undefined)
    ).rejects.toThrow('User not authenticated');
  });
});

