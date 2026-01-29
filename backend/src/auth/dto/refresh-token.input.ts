import { Field, InputType } from '@nestjs/graphql';
import { IsString, MinLength } from 'class-validator';

@InputType()
export class RefreshTokenInput {
  @Field()
  @IsString()
  @MinLength(10)
  refreshToken!: string;
}
