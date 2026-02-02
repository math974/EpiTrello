import { Field, ID, InputType } from '@nestjs/graphql';
import { IsString, MinLength } from 'class-validator';

@InputType()
export class CreateBoardInput {
  @Field(() => ID)
  @IsString()
  workspaceId!: string;

  @Field()
  @IsString()
  @MinLength(1)
  title!: string;
}

