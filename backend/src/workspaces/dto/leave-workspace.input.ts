import { Field, ID, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType()
export class LeaveWorkspaceInput {
  @Field(() => ID)
  @IsString()
  workspaceId!: string;
}

