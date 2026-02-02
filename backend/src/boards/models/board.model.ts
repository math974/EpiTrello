import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserModel } from '../../users/models/user.model';
import { WorkspaceModel } from '../../workspaces/models/workspace.model';
import { ListModel } from './list.model';

@ObjectType()
export class BoardModel {
  @Field(() => ID)
  id!: string;

  @Field()
  title!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field()
  background!: string;

  @Field()
  ownerId!: string;

  @Field(() => UserModel, { nullable: true })
  owner?: UserModel;

  @Field(() => ID)
  workspaceId!: string;

  @Field(() => WorkspaceModel, { nullable: true })
  workspace?: WorkspaceModel;

  @Field(() => [ListModel], { nullable: true })
  lists?: ListModel[];

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

