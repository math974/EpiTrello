import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserModel } from '../../users/models/user.model';

@ObjectType()
export class CommentModel {
  @Field(() => ID)
  id!: string;

  @Field()
  content!: string;

  @Field(() => ID)
  cardId!: string;

  @Field(() => ID)
  authorId!: string;

  @Field(() => UserModel)
  author!: UserModel;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

