import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from './gql-auth.guard';

export const AuthGuard = () => UseGuards(GqlAuthGuard);
