import { Args, Context, Int, Query, Resolver } from '@nestjs/graphql';
import { User } from '@prisma/client';
import { AuthGuard } from '../common/guards/gql-auth.decorator';
import { ActivitiesService } from './activities.service';
import { ActivityFeedModel } from './models/activity-feed.model';

@Resolver(() => ActivityFeedModel)
export class ActivitiesResolver {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Query(() => ActivityFeedModel)
  @AuthGuard()
  async workspaceActivity(
    @Args('workspaceId') workspaceId: string,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('cursor', { type: () => String, nullable: true }) cursor?: string | null,
    @Context('user') user?: User
  ) {
    if (!user) {
      throw new Error('User not authenticated');
    }

    return this.activitiesService.getWorkspaceActivities(workspaceId, user.id, limit, cursor);
  }
}

