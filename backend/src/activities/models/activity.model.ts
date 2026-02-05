import { Field, ID, ObjectType } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';
import { ActivityType } from './activity-type.enum';
import { BoardModel } from '../../boards/models/board.model';
import { UserModel } from '../../users/models/user.model';
import { WorkspaceModel } from '../../workspaces/models/workspace.model';

@ObjectType()
export class ActivityModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  workspaceId!: string;

  @Field(() => WorkspaceModel, { nullable: true })
  workspace?: WorkspaceModel | null;

  @Field(() => ID, { nullable: true })
  boardId?: string | null;

  @Field(() => BoardModel, { nullable: true })
  board?: BoardModel | null;

  @Field(() => ID)
  actorId!: string;

  @Field(() => UserModel, { nullable: true })
  actor?: UserModel | null;

  @Field(() => ActivityType)
  type!: ActivityType;

  @Field(() => GraphQLJSONObject, { nullable: true })
  metadata?: Record<string, any> | null;

  @Field()
  createdAt!: Date;
}

