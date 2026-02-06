import { Field, ID, InputType } from '@nestjs/graphql';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class ReorderChecklistItemsInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  checklistId!: string;

  @Field(() => [ID])
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  itemIds!: string[];
}


