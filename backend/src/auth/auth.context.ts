import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthContextService {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService
  ) {}

  async buildContext(req: { headers?: Record<string, string | undefined> }) {
    const authHeader = req.headers?.authorization;
    const userId = await this.authService.getUserIdFromAccessToken(authHeader);
    const user = userId ? await this.prisma.user.findUnique({ where: { id: userId } }) : null;

    return { req, user };
  }
}
