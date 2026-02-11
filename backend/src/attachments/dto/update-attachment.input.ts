import { Field, InputType, ID } from '@nestjs/graphql';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

@InputType()
export class UpdateAttachmentInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  id!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;
}
