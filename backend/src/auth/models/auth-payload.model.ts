import { Field, ObjectType } from '@nestjs/graphql';
import { UserModel } from '../../users/models/user.model';

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken!: string;

  @Field({ nullable: true })
  refreshToken?: string; // Optional - only returned for refreshToken mutation, not for login/register

  @Field(() => UserModel)
  user!: UserModel;
}
