import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthContextService {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService
  ) {}

  async buildContext(req: { headers?: Record<string, string | undefined>; cookies?: Record<string, string> }) {
    const authHeader = req.headers?.authorization;
    const payload = await this.authService.getAccessPayload(authHeader);
    const user = payload
      ? await this.prisma.user.findUnique({ where: { id: payload.userId } })
      : null;
    const validUser = user && user.tokenVersion === payload?.tokenVersion ? user : null;

    return { user: validUser };
  }
}
