import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

@InputType()
export class MoveCardInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  cardId!: string;

  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  toListId!: string;

  @Field(() => Int)
  @IsNumber()
  @Min(0)
  toIndex!: number;
}

