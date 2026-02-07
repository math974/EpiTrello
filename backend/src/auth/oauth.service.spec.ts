import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { OAuthService, OAuthUser } from './oauth.service';

jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

const bcrypt = jest.requireMock('bcryptjs').default as {
  hash: jest.Mock;
  compare: jest.Mock;
};

jest.mock('bcryptjs');

describe('OAuthService', () => {
  let service: OAuthService;
  let prisma: any;
  let jwt: any;
  let config: any;

  const mockOAuthUser: OAuthUser = {
    provider: 'google',
    providerUserId: '123456789',
    email: 'test@example.com',
    name: 'Test User',
    avatar: 'https://example.com/avatar.jpg',
    accessToken: 'access_token',
  };

  beforeEach(async () => {
    const mockPrisma = {
      oAuthAccount: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockJwt = {
      signAsync: jest.fn(),
    };

    const mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<OAuthService>(OAuthService);
    prisma = module.get(PrismaService);
    jwt = module.get(JwtService);
    config = module.get(ConfigService);

    bcrypt.hash.mockResolvedValue('hashed-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleOAuthCallback', () => {
    it('should throw BadRequestException if email is missing', async () => {
      const oauthUserWithoutEmail = { ...mockOAuthUser, email: undefined };

      await expect(service.handleOAuthCallback(oauthUserWithoutEmail as any)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should login existing user with OAuth account', async () => {
      const existingUser = {
        id: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        tokenVersion: 0,
      };

      prisma.oAuthAccount.findUnique.mockResolvedValue({
        id: 'oauth-id',
        provider: 'google',
        providerUserId: '123456789',
        userId: 'user-id',
        createdAt: new Date(),
        user: existingUser as any,
      });

      jwt.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      prisma.user.update.mockResolvedValue(existingUser as any);

      const result = await service.handleOAuthCallback(mockOAuthUser);

      expect(result).toHaveProperty('accessToken', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
      expect(result).toHaveProperty('user');
      expect(prisma.oAuthAccount.findUnique).toHaveBeenCalledWith({
        where: {
          provider_providerUserId: {
            provider: 'google',
            providerUserId: '123456789',
          },
        },
        include: { user: true },
      });
    });

    it('should link OAuth account to existing user by email', async () => {
      const existingUser = {
        id: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        tokenVersion: 0,
      };

      prisma.oAuthAccount.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(existingUser as any);
      prisma.oAuthAccount.create.mockResolvedValue({
        id: 'oauth-id',
        provider: 'google',
        providerUserId: '123456789',
        userId: 'user-id',
        createdAt: new Date(),
      });

      jwt.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      prisma.user.update.mockResolvedValue(existingUser as any);

      const result = await service.handleOAuthCallback(mockOAuthUser);

      expect(result).toHaveProperty('accessToken', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
      expect(prisma.oAuthAccount.create).toHaveBeenCalledWith({
        data: {
          provider: 'google',
          providerUserId: '123456789',
          userId: 'user-id',
        },
      });
    });

    it('should create new user and OAuth account', async () => {
      const newUser = {
        id: 'new-user-id',
        email: 'test@example.com',
        username: 'testuser',
        tokenVersion: 0,
        passwordHash: null,
        avatar: 'https://example.com/avatar.jpg',
      };

      prisma.oAuthAccount.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(newUser as any);
      prisma.oAuthAccount.create.mockResolvedValue({
        id: 'oauth-id',
        provider: 'google',
        providerUserId: '123456789',
        userId: 'new-user-id',
        createdAt: new Date(),
      });

      jwt.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      prisma.user.update.mockResolvedValue(newUser as any);

      const result = await service.handleOAuthCallback(mockOAuthUser);

      expect(result).toHaveProperty('accessToken', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          username: expect.any(String),
          passwordHash: null,
          avatar: 'https://example.com/avatar.jpg',
        },
      });
      expect(prisma.oAuthAccount.create).toHaveBeenCalledWith({
        data: {
          provider: 'google',
          providerUserId: '123456789',
          userId: 'new-user-id',
        },
      });
    });

    it('should generate unique username when username is taken', async () => {
      const newUser = {
        id: 'new-user-id',
        email: 'test@example.com',
        username: 'testuser1',
        tokenVersion: 0,
        passwordHash: null,
        avatar: 'https://example.com/avatar.jpg',
      };

      prisma.oAuthAccount.findUnique.mockResolvedValue(null);
      prisma.user.findUnique
        .mockResolvedValueOnce(null) // First call for email check
        .mockResolvedValueOnce({ id: 'existing-id' } as any) // Username 'testuser' taken
        .mockResolvedValueOnce(null); // Username 'testuser1' available

      prisma.user.create.mockResolvedValue(newUser as any);
      prisma.oAuthAccount.create.mockResolvedValue({
        id: 'oauth-id',
        provider: 'google',
        providerUserId: '123456789',
        userId: 'new-user-id',
        createdAt: new Date(),
      });

      jwt.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      prisma.user.update.mockResolvedValue(newUser as any);

      const result = await service.handleOAuthCallback({
        ...mockOAuthUser,
        name: 'Test User',
      });

      expect(result).toHaveProperty('accessToken');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          username: 'testuser1',
          passwordHash: null,
          avatar: 'https://example.com/avatar.jpg',
        },
      });
    });

    it('should handle GitHub provider', async () => {
      const githubUser: OAuthUser = {
        provider: 'github',
        providerUserId: '987654321',
        email: 'github@example.com',
        name: 'GitHub User',
        accessToken: 'github-token',
      };

      const newUser = {
        id: 'github-user-id',
        email: 'github@example.com',
        username: 'githubuser',
        tokenVersion: 0,
        passwordHash: null,
      };

      prisma.oAuthAccount.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(newUser as any);
      prisma.oAuthAccount.create.mockResolvedValue({
        id: 'oauth-id',
        provider: 'github',
        providerUserId: '987654321',
        userId: 'github-user-id',
        createdAt: new Date(),
      });

      jwt.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      prisma.user.update.mockResolvedValue(newUser as any);

      const result = await service.handleOAuthCallback(githubUser);

      expect(result).toHaveProperty('accessToken', 'access-token');
      expect(prisma.oAuthAccount.create).toHaveBeenCalledWith({
        data: {
          provider: 'github',
          providerUserId: '987654321',
          userId: 'github-user-id',
        },
      });
    });

    it('should store refresh token hash', async () => {
      const existingUser = {
        id: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        tokenVersion: 0,
      };

      prisma.oAuthAccount.findUnique.mockResolvedValue({
        id: 'oauth-id',
        provider: 'google',
        providerUserId: '123456789',
        userId: 'user-id',
        createdAt: new Date(),
        user: existingUser as any,
      });

      jwt.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      prisma.user.update.mockResolvedValue(existingUser as any);

      await service.handleOAuthCallback(mockOAuthUser);

      expect(bcrypt.hash).toHaveBeenCalledWith('refresh-token', 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: { refreshTokenHash: 'hashed-token' },
      });
    });
  });
});

