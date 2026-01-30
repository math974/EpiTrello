import { Field, ID, InputType } from '@nestjs/graphql';
import { IsString, MinLength } from 'class-validator';

@InputType()
export class UpdateWorkspaceInput {
  @Field(() => ID)
  @IsString()
  id!: string;

  @Field()
  @IsString()
  @MinLength(2)
  name!: string;
}

