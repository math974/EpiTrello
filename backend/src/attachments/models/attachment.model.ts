import { Field, ID, ObjectType, Int } from '@nestjs/graphql';
import { UserModel } from '../../users/models/user.model';

@ObjectType()
export class AttachmentModel {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  cardId!: string;

  @Field(() => ID)
  uploaderId!: string;

  @Field(() => UserModel)
  uploader!: UserModel;

  @Field()
  objectKey!: string;

  @Field()
  fileName!: string;

  @Field()
  mimeType!: string;

  @Field(() => Int)
  size!: number;

  @Field()
  createdAt!: Date;
}


