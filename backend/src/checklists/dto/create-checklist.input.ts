import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CreateChecklistInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  cardId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  title!: string;
}


