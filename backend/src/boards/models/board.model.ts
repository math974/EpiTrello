import { Field, ID, ObjectType } from '@nestjs/graphql';

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

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

