import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CreateChecklistItemInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  checklistId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  content!: string;
}


