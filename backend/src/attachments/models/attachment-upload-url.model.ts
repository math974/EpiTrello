import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AttachmentUploadUrlModel {
  @Field()
  uploadUrl!: string;

  @Field()
  objectKey!: string;
}


