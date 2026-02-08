import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, MinLength } from 'class-validator';

@InputType()
export class RefreshTokenInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(10)
  refreshToken?: string;
}
