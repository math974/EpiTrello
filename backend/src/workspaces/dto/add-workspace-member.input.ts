import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEmail, IsString } from 'class-validator';

@InputType()
export class AddWorkspaceMemberInput {
  @Field(() => ID)
  @IsString()
  workspaceId!: string;

  @Field()
  @IsEmail()
  email!: string;
}

