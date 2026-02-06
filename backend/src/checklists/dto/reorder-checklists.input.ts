import { Field, ID, InputType } from '@nestjs/graphql';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class ReorderChecklistsInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  cardId!: string;

  @Field(() => [ID])
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  checklistIds!: string[];
}


