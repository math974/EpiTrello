import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { AuthContextService } from './auth.context';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';

@Module({
  imports: [JwtModule.register({})],
  providers: [AuthResolver, AuthService, AuthContextService, GqlAuthGuard],
  exports: [AuthContextService, GqlAuthGuard],
})
export class AuthModule {}
