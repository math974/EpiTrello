import { Field, ID, InputType } from '@nestjs/graphql';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class ReorderListsInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  boardId!: string;

  @Field(() => [ID])
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  orderedListIds!: string[];
}

