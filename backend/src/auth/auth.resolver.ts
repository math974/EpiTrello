import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/login.input';
import { RefreshTokenInput } from './dto/refresh-token.input';
import { RegisterInput } from './dto/register.input';
import { AuthPayload } from './models/auth-payload.model';
import { UserModel } from '../users/models/user.model';
import { AuthGuard } from '../common/guards/gql-auth.decorator';

@Resolver(() => UserModel)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  register(@Args('input', { type: () => RegisterInput }) input: RegisterInput) {
    return this.authService.register(input);
  }

  @Mutation(() => AuthPayload)
  login(@Args('input', { type: () => LoginInput }) input: LoginInput) {
    return this.authService.login(input);
  }

  @Mutation(() => AuthPayload)
  refreshToken(@Args('input', { type: () => RefreshTokenInput }) input: RefreshTokenInput) {
    return this.authService.refresh(input);
  }

  @Query(() => UserModel, { nullable: true })
  me(@Context('user') user: UserModel | null) {
    return user;
  }

  @Query(() => UserModel)
  @AuthGuard()
  meStrict(@Context('user') user: UserModel) {
    return user;
  }
}
