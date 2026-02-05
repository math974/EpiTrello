import { Field, ObjectType, ID } from '@nestjs/graphql';
import { ActivityModel } from './activity.model';

@ObjectType()
export class ActivityFeedModel {
  @Field(() => [ActivityModel])
  activities!: ActivityModel[];

  @Field(() => Boolean)
  hasMore!: boolean;

  @Field(() => String, { nullable: true })
  nextCursor?: string | null;
}

