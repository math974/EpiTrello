import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

@InputType()
export class CreateListInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  boardId!: string;

  @Field()
  @IsString()
  @MinLength(1)
  title!: string;
}

