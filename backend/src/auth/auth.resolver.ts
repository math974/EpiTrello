import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Request, Response } from 'express';
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
  register(
    @Args('input', { type: () => RegisterInput }) input: RegisterInput,
    @Context('req') req: Request,
    @Context('res') res: Response
  ) {
    return this.authService.register(input, req, res);
  }

  @Mutation(() => AuthPayload)
  login(
    @Args('input', { type: () => LoginInput }) input: LoginInput,
    @Context('req') req: Request,
    @Context('res') res: Response
  ) {
    return this.authService.login(input, req, res);
  }

  @Mutation(() => AuthPayload)
  refreshToken(
    @Args('input', { type: () => RefreshTokenInput, nullable: true }) input: RefreshTokenInput = {},
    @Context('req') req: Request,
    @Context('res') res: Response
  ) {
    return this.authService.refresh(input, req, res);
  }

  @Mutation(() => Boolean)
  logout(
    @Args('input', { type: () => RefreshTokenInput, nullable: true }) input: RefreshTokenInput = {},
    @Context('req') req: Request,
    @Context('res') res: Response
  ) {
    return this.authService.logout(input, req, res);
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
