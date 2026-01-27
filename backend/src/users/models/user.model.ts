import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserModel {
  @Field(() => ID)
  id!: string;

  @Field()
  username!: string;

  @Field()
  email!: string;

  @Field(() => String, { nullable: true })
  avatar?: string | null;

  @Field()
  createdAt!: Date;
}
