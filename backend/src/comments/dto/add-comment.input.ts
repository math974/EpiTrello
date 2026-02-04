import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

@InputType()
export class AddCommentInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  cardId!: string;

  @Field()
  @IsString()
  @MinLength(1)
  content!: string;
}

