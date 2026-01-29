import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { UserModel } from '../users/models/user.model';

describe('AuthResolver.me', () => {
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
  };

  const createResolver = () => new AuthResolver(authService as unknown as AuthService);

  it('returns the current user when provided in context', () => {
    const resolver = createResolver();
    const user = {
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
    } as UserModel;

    expect(resolver.me(user)).toBe(user);
  });

  it('returns null when no user is in context', () => {
    const resolver = createResolver();

    expect(resolver.me(null)).toBeNull();
  });
});

