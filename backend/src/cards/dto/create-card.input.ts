import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

@InputType()
export class CreateCardInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  listId!: string;

  @Field()
  @IsString()
  @MinLength(1)
  title!: string;
}

