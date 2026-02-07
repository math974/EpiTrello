import { Field, InputType, ID, Int } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsInt, Min, MaxLength } from 'class-validator';

@InputType()
export class ConfirmAttachmentUploadInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  cardId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  objectKey!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  mimeType!: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  size!: number;
}


