import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class DeleteChecklistInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  id!: string;
}


