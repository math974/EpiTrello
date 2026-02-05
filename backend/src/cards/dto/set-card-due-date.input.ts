import { Field, ID, InputType } from '@nestjs/graphql';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class SetCardDueDateInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  cardId!: string;

  @Field(() => String)
  @IsDateString()
  @IsNotEmpty()
  dueDate!: string;
}



