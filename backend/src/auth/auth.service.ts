import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
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

  async register(input: RegisterInput, req?: Request, res?: Response) {
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

    const tokens = await this.issueTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Set refreshToken in httpOnly cookie
    if (res) {
      this.setRefreshTokenCookie(res, tokens.refreshToken);
    }

    // Don't return refreshToken in response - it's in httpOnly cookie for security
    return { accessToken: tokens.accessToken, user };
  }

  async login(input: LoginInput, req?: Request, res?: Response) {
    const email = input.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Set refreshToken in httpOnly cookie
    if (res) {
      this.setRefreshTokenCookie(res, tokens.refreshToken);
    }

    // Don't return refreshToken in response - it's in httpOnly cookie for security
    return { accessToken: tokens.accessToken, user };
  }

  async refresh(input: RefreshTokenInput, req?: Request, res?: Response) {
    // Try to get refreshToken from cookie first, then from input
    const cookies = req?.cookies as { refreshToken?: string } | undefined;
    const refreshToken = cookies?.refreshToken || input.refreshToken;
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.issueTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Set new refreshToken in httpOnly cookie
    if (res) {
      this.setRefreshTokenCookie(res, tokens.refreshToken);
    }

    return { ...tokens, user };
  }

  async logout(input: RefreshTokenInput, req?: Request, res?: Response) {
    // Try to get refreshToken from cookie first, then from input
    const refreshToken = (req?.cookies as { refreshToken?: string })?.refreshToken || input.refreshToken;
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: null, tokenVersion: { increment: 1 } },
    });

    // Clear refreshToken cookie
    if (res) {
      this.clearRefreshTokenCookie(res);
    }

    return true;
  }

  async getAccessPayload(authHeader?: string) {
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.replace('Bearer ', '').trim();
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; tv: number }>(token, {
        secret: this.accessSecret(),
      });
      return { userId: payload.sub, tokenVersion: payload.tv ?? 0 };
    } catch {
      return null;
    }
  }

  private async issueTokens(user: { id: string; tokenVersion: number }) {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, tv: user.tokenVersion },
      { secret: this.accessSecret(), expiresIn: '15m' }
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id },
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

  /**
   * Set refreshToken in httpOnly cookie
   */
  private setRefreshTokenCookie = (res: Response, refreshToken: string) => {
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, // Prevent XSS attacks
      secure: isProduction, // Only send over HTTPS in production
      sameSite: 'lax', // CSRF protection - 'lax' allows cookies on same-site requests
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  };

  /**
   * Clear refreshToken cookie
   */
  private clearRefreshTokenCookie = (res: Response) => {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
    });
  };
}
