import { Test, TestingModule } from '@nestjs/testing';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';
import { Request, Response } from 'express';

describe('OAuthController', () => {
  let controller: OAuthController;
  let oauthService: jest.Mocked<OAuthService>;

  const mockRequest = {
    user: {
      provider: 'google',
      providerUserId: '123456789',
      email: 'test@example.com',
      name: 'Test User',
      accessToken: 'access-token',
    },
  } as unknown as Request;

  const mockResponse = {
    redirect: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const mockOAuthService = {
      handleOAuthCallback: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OAuthController],
      providers: [
        {
          provide: OAuthService,
          useValue: mockOAuthService,
        },
      ],
    }).compile();

    controller = module.get<OAuthController>(OAuthController);
    oauthService = module.get(OAuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('googleAuth', () => {
    it('should be defined', () => {
      expect(controller.googleAuth).toBeDefined();
    });
  });

  describe('googleAuthCallback', () => {
    it('should handle Google OAuth callback and redirect with tokens', async () => {
      const mockResult = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-id',
          email: 'test@example.com',
          username: 'testuser',
          createdAt: new Date(),
          passwordHash: null,
          refreshTokenHash: null,
          tokenVersion: 0,
          avatar: null,
        },
      };

      oauthService.handleOAuthCallback.mockResolvedValue(mockResult);

      process.env.FRONTEND_URL = 'http://localhost:3000';

      await controller.googleAuthCallback(mockRequest, mockResponse);

      expect(oauthService.handleOAuthCallback).toHaveBeenCalledWith(mockRequest.user);
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/callback?accessToken=access-token&refreshToken=refresh-token'
      );
    });

    it('should use default frontend URL if FRONTEND_URL is not set', async () => {
      const mockResult = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-id',
          email: 'test@example.com',
          username: 'testuser',
          createdAt: new Date(),
          passwordHash: null,
          refreshTokenHash: null,
          tokenVersion: 0,
          avatar: null,
        },
      };

      delete process.env.FRONTEND_URL;
      oauthService.handleOAuthCallback.mockResolvedValue(mockResult);

      await controller.googleAuthCallback(mockRequest, mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/callback?accessToken=access-token&refreshToken=refresh-token'
      );
    });
  });

  describe('githubAuth', () => {
    it('should be defined', () => {
      expect(controller.githubAuth).toBeDefined();
    });
  });

  describe('githubAuthCallback', () => {
    it('should handle GitHub OAuth callback and redirect with tokens', async () => {
      const githubRequest = {
        user: {
          provider: 'github',
          providerUserId: '987654321',
          email: 'github@example.com',
          name: 'GitHub User',
          accessToken: 'github-token',
        },
      } as unknown as Request;

      const mockResult = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'github-user-id',
          email: 'github@example.com',
          username: 'githubuser',
          createdAt: new Date(),
          passwordHash: null,
          refreshTokenHash: null,
          tokenVersion: 0,
          avatar: null,
        },
      };

      oauthService.handleOAuthCallback.mockResolvedValue(mockResult);
      process.env.FRONTEND_URL = 'http://localhost:3000';

      await controller.githubAuthCallback(githubRequest, mockResponse);

      expect(oauthService.handleOAuthCallback).toHaveBeenCalledWith(githubRequest.user);
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/callback?accessToken=access-token&refreshToken=refresh-token'
      );
    });
  });
});

