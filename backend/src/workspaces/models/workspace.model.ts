import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserModel } from '../../users/models/user.model';

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

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

