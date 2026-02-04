import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class LabelModel {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  color!: string;

  @Field(() => ID)
  workspaceId!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

