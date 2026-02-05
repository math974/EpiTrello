import { Field, ID, InputType } from '@nestjs/graphql';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class SetCardDoneInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  cardId!: string;

  @Field(() => Boolean)
  @IsBoolean()
  @IsNotEmpty()
  done!: boolean;
}

