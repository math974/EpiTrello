import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class AssignUserToCardInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  cardId!: string;

  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  userId!: string;
}

