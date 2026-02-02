import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

@InputType()
export class CreateBoardInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @Field()
  @IsString()
  @MinLength(1)
  title!: string;
}

