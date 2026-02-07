import { Field, InputType, ID } from '@nestjs/graphql';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class DeleteAttachmentInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  id!: string;
}


