import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

export interface OAuthUser {
  provider: string;
  providerUserId: string;
  email?: string;
  name?: string;
  avatar?: string;
  accessToken: string;
  refreshToken?: string;
}

@Injectable()
export class OAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  async handleOAuthCallback(oauthUser: OAuthUser) {
    if (!oauthUser.email) {
      throw new BadRequestException('Email is required for OAuth authentication');
    }

    const email = oauthUser.email.toLowerCase();

    // Check if OAuth account already exists
    const existingOAuthAccount = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider: oauthUser.provider,
          providerUserId: oauthUser.providerUserId,
        },
      },
      include: { user: true },
    });

    if (existingOAuthAccount) {
      // User already exists, login
      const user = existingOAuthAccount.user;
      const tokens = await this.issueTokens(user);
      await this.storeRefreshToken(user.id, tokens.refreshToken);
      return { ...tokens, user };
    }

    // Check if user with this email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Link OAuth account to existing user
      await this.prisma.oAuthAccount.create({
        data: {
          provider: oauthUser.provider,
          providerUserId: oauthUser.providerUserId,
          userId: existingUser.id,
        },
      });

      const tokens = await this.issueTokens(existingUser);
      await this.storeRefreshToken(existingUser.id, tokens.refreshToken);
      return { ...tokens, user: existingUser };
    }

    // Create new user
    const username = await this.generateUniqueUsername(oauthUser.name || email.split('@')[0]);
    const newUser = await this.prisma.user.create({
      data: {
        email,
        username,
        passwordHash: null, // OAuth users don't have passwords
        avatar: oauthUser.avatar,
      },
    });

    // Create OAuth account
    await this.prisma.oAuthAccount.create({
      data: {
        provider: oauthUser.provider,
        providerUserId: oauthUser.providerUserId,
        userId: newUser.id,
      },
    });

    const tokens = await this.issueTokens(newUser);
    await this.storeRefreshToken(newUser.id, tokens.refreshToken);
    return { ...tokens, user: newUser };
  }

  private async generateUniqueUsername(baseUsername: string): Promise<string> {
    let username = baseUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (username.length === 0) {
      username = 'user';
    }
    if (username.length > 20) {
      username = username.substring(0, 20);
    }

    let finalUsername = username;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.user.findUnique({
        where: { username: finalUsername },
      });

      if (!existing) {
        return finalUsername;
      }

      finalUsername = `${username}${counter}`;
      counter++;

      if (counter > 1000) {
        // Fallback to UUID-based username
        const { randomUUID } = await import('crypto');
        return `user${randomUUID().substring(0, 8)}`;
      }
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

  private accessSecret() {
    return this.config.get<string>('JWT_SECRET') || 'change-me';
  }

  private refreshSecret() {
    return this.config.get<string>('JWT_REFRESH_SECRET') || this.accessSecret();
  }
}


