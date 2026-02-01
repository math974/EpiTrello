import { Field, ID, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType()
export class RemoveWorkspaceMemberInput {
  @Field(() => ID)
  @IsString()
  workspaceId!: string;

  @Field(() => ID)
  @IsString()
  userId!: string;
}

