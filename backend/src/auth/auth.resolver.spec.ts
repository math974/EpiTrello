import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { UserModel } from '../users/models/user.model';
import { AuthPayload } from './models/auth-payload.model';

describe('AuthResolver', () => {
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
  } as unknown as AuthService;

  const createResolver = () => new AuthResolver(authService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('registers a new user', async () => {
      const resolver = createResolver();
      const input = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      };
      const payload: AuthPayload = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          username: 'testuser',
        } as UserModel,
      };

      (authService.register as jest.Mock).mockResolvedValue(payload);

      const req = {} as any;
      const res = {} as any;
      const result = await resolver.register(input, req, res);

      expect(authService.register).toHaveBeenCalledWith(input, req, res);
      expect(result).toBe(payload);
    });
  });

  describe('login', () => {
    it('logs in a user', async () => {
      const resolver = createResolver();
      const input = {
        email: 'test@example.com',
        password: 'password123',
      };
      const payload: AuthPayload = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          username: 'testuser',
        } as UserModel,
      };

      (authService.login as jest.Mock).mockResolvedValue(payload);

      const req = {} as any;
      const res = {} as any;
      const result = await resolver.login(input, req, res);

      expect(authService.login).toHaveBeenCalledWith(input, req, res);
      expect(result).toBe(payload);
    });
  });

  describe('refreshToken', () => {
    it('refreshes a token', async () => {
      const resolver = createResolver();
      const input = {
        refreshToken: 'refresh-token',
      };
      const payload: AuthPayload = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          username: 'testuser',
        } as UserModel,
      };

      (authService.refresh as jest.Mock).mockResolvedValue(payload);

      const req = {} as any;
      const res = {} as any;
      const result = await resolver.refreshToken(input, req, res);

      expect(authService.refresh).toHaveBeenCalledWith(input, req, res);
      expect(result).toBe(payload);
    });
  });

  describe('logout', () => {
    it('logs out a user', async () => {
      const resolver = createResolver();
      const input = {
        refreshToken: 'refresh-token',
      };

      (authService.logout as jest.Mock).mockResolvedValue(true);

      const req = {} as any;
      const res = {} as any;
      const result = await resolver.logout(input, req, res);

      expect(authService.logout).toHaveBeenCalledWith(input, req, res);
      expect(result).toBe(true);
    });
  });

  describe('me', () => {
    it('returns the current user when provided in context', () => {
      const resolver = createResolver();
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
      } as UserModel;
      const mockReq = {
        headers: {},
      } as any;

      expect((resolver as any).me(user, mockReq)).toBe(user);
    });

    it('returns null when no user is in context and no auth header', () => {
      const resolver = createResolver();
      const mockReq = {
        headers: {},
      } as any;

      expect((resolver as any).me(null, mockReq)).toBeNull();
    });

    it('throws UnauthorizedException when no user but auth header present', () => {
      const resolver = createResolver();
      const mockReq = {
        headers: {
          authorization: 'Bearer expired-token',
        },
      } as any;

      expect(() => (resolver as any).me(null, mockReq)).toThrow('Unauthorized');
    });
  });

  describe('meStrict', () => {
    it('returns the current user when provided in context', () => {
      const resolver = createResolver();
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
      } as UserModel;

      expect(resolver.meStrict(user)).toBe(user);
    });
  });
});

