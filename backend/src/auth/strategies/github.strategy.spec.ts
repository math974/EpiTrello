import { ConfigService } from '@nestjs/config';
import { GitHubStrategy } from './github.strategy';

describe('GitHubStrategy', () => {
  let strategy: GitHubStrategy;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as any;

    strategy = new GitHubStrategy(configService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user object with GitHub profile data', async () => {
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      const profile = {
        id: 12345,
        emails: [{ value: 'user@example.com' }],
        displayName: 'John Doe',
        photos: [{ value: 'https://example.com/photo.jpg' }],
        username: 'johndoe',
        profileUrl: 'https://github.com/johndoe',
        provider: 'github',
      } as any;
      const done = jest.fn();

      await strategy.validate(accessToken, refreshToken, profile, done);

      expect(done).toHaveBeenCalledWith(null, {
        provider: 'github',
        providerUserId: '12345',
        email: 'user@example.com',
        name: 'John Doe',
        avatar: 'https://example.com/photo.jpg',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should use username when displayName is missing', async () => {
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      const profile = {
        id: 12345,
        emails: [{ value: 'user@example.com' }],
        displayName: undefined,
        photos: [],
        username: 'johndoe',
        profileUrl: 'https://github.com/johndoe',
        provider: 'github',
      } as any;
      const done = jest.fn();

      await strategy.validate(accessToken, refreshToken, profile, done);

      expect(done).toHaveBeenCalledWith(null, {
        provider: 'github',
        providerUserId: '12345',
        email: 'user@example.com',
        name: 'johndoe',
        avatar: undefined,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should handle missing email', async () => {
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      const profile = {
        id: 12345,
        emails: [],
        displayName: 'John Doe',
        photos: [],
        username: 'johndoe',
        profileUrl: 'https://github.com/johndoe',
        provider: 'github',
      } as any;
      const done = jest.fn();

      await strategy.validate(accessToken, refreshToken, profile, done);

      expect(done).toHaveBeenCalledWith(null, {
        provider: 'github',
        providerUserId: '12345',
        email: undefined,
        name: 'John Doe',
        avatar: undefined,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });
  });
});

