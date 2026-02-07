import { ConfigService } from '@nestjs/config';
import { GoogleStrategy } from './google.strategy';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as any;

    strategy = new GoogleStrategy(configService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user object with Google profile data', async () => {
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      const profile = {
        id: 'google-user-id',
        emails: [{ value: 'user@example.com' }],
        displayName: 'John Doe',
        photos: [{ value: 'https://example.com/photo.jpg' }],
      };
      const done = jest.fn();

      await strategy.validate(accessToken, refreshToken, profile, done);

      expect(done).toHaveBeenCalledWith(null, {
        provider: 'google',
        providerUserId: 'google-user-id',
        email: 'user@example.com',
        name: 'John Doe',
        avatar: 'https://example.com/photo.jpg',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should handle missing email', async () => {
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      const profile = {
        id: 'google-user-id',
        emails: [],
        displayName: 'John Doe',
        photos: [],
      };
      const done = jest.fn();

      await strategy.validate(accessToken, refreshToken, profile, done);

      expect(done).toHaveBeenCalledWith(null, {
        provider: 'google',
        providerUserId: 'google-user-id',
        email: undefined,
        name: 'John Doe',
        avatar: undefined,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should handle missing displayName', async () => {
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      const profile = {
        id: 'google-user-id',
        emails: [{ value: 'user@example.com' }],
        displayName: undefined,
        photos: [],
      };
      const done = jest.fn();

      await strategy.validate(accessToken, refreshToken, profile, done);

      expect(done).toHaveBeenCalledWith(null, {
        provider: 'google',
        providerUserId: 'google-user-id',
        email: 'user@example.com',
        name: undefined,
        avatar: undefined,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });
  });
});

