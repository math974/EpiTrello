import { Field, ID, ObjectType } from '@nestjs/graphql';
import { BoardModel } from '../../boards/models/board.model';
import { UserModel } from '../../users/models/user.model';
import { WorkspaceMemberModel } from './workspace-member.model';

@ObjectType()
export class WorkspaceModel {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  ownerId!: string;

  @Field(() => UserModel, { nullable: true })
  owner?: UserModel;

  @Field(() => [WorkspaceMemberModel], { nullable: true })
  members?: WorkspaceMemberModel[];

  @Field(() => [BoardModel], { nullable: true })
  boards?: BoardModel[];

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

