import { Field, ID, InputType } from '@nestjs/graphql';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class SetCardAssigneesInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  cardId!: string;

  @Field(() => [ID])
  @IsArray()
  @ArrayMinSize(0)
  @IsString({ each: true })
  userIds!: string[];
}

