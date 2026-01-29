import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';
import { RefreshTokenInput } from './dto/refresh-token.input';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  async register(input: RegisterInput) {
    const email = input.email.toLowerCase();

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username: input.username }],
      },
    });

    if (existing?.email === email) {
      throw new BadRequestException('Email already in use');
    }
    if (existing?.username === input.username) {
      throw new BadRequestException('Username already in use');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        username: input.username,
        passwordHash,
      },
    });

    const tokens = await this.issueTokens(user.id);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return { ...tokens, user };
  }

  async login(input: LoginInput) {
    const email = input.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user.id);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return { ...tokens, user };
  }

  async refresh(input: RefreshTokenInput) {
    const payload = await this.verifyRefreshToken(input.refreshToken);
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const valid = await bcrypt.compare(input.refreshToken, user.refreshTokenHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.issueTokens(user.id);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return { ...tokens, user };
  }

  async logout(input: RefreshTokenInput) {
    const payload = await this.verifyRefreshToken(input.refreshToken);
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const valid = await bcrypt.compare(input.refreshToken, user.refreshTokenHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: null },
    });

    return true;
  }

  async getUserIdFromAccessToken(authHeader?: string) {
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.replace('Bearer ', '').trim();
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret: this.accessSecret(),
      });
      return payload.sub;
    } catch {
      return null;
    }
  }

  private async issueTokens(userId: string) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId },
      { secret: this.accessSecret(), expiresIn: '15m' }
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: userId },
      { secret: this.refreshSecret(), expiresIn: '7d' }
    );
    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });
  }

  private async verifyRefreshToken(token: string) {
    try {
      return await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret: this.refreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private accessSecret() {
    return this.config.get<string>('JWT_SECRET') || 'change-me';
  }

  private refreshSecret() {
    return this.config.get<string>('JWT_REFRESH_SECRET') || this.accessSecret();
  }
}
