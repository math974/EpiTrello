import { Field, ObjectType } from '@nestjs/graphql';
import { WorkspaceRole } from '@prisma/client';
import { UserModel } from '../../users/models/user.model';

@ObjectType()
export class WorkspaceMemberModel {
  @Field()
  userId!: string;

  @Field()
  workspaceId!: string;

  @Field(() => WorkspaceRole)
  role!: WorkspaceRole;

  @Field(() => UserModel, { nullable: true })
  user?: UserModel;
}

