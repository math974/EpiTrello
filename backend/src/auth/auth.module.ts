import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { AuthContextService } from './auth.context';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { GoogleStrategy } from './strategies/google.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { OAuthService } from './oauth.service';
import { OAuthController } from './oauth.controller';

@Module({
  imports: [JwtModule.register({}), PassportModule],
  providers: [
    AuthResolver,
    AuthService,
    AuthContextService,
    GqlAuthGuard,
    GoogleStrategy,
    GitHubStrategy,
    OAuthService,
  ],
  controllers: [OAuthController],
  exports: [AuthContextService, AuthService, GqlAuthGuard],
})
export class AuthModule {}
