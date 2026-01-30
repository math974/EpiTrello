import { AuthContextService } from './auth.context';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthContextService', () => {
  const authService = {
    getAccessPayload: jest.fn(),
  };

  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const createService = () =>
    new AuthContextService(authService as unknown as AuthService, prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null user when no token payload', async () => {
    authService.getAccessPayload.mockResolvedValue(null);
    const service = createService();

    const result = await service.buildContext({ headers: {} });

    expect(result.user).toBeNull();
  });

  it('returns null user when token version mismatches', async () => {
    authService.getAccessPayload.mockResolvedValue({ userId: 'user-1', tokenVersion: 2 });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      tokenVersion: 1,
    });

    const service = createService();

    const result = await service.buildContext({ headers: { authorization: 'Bearer token' } });

    expect(result.user).toBeNull();
  });

  it('returns user when token is valid', async () => {
    authService.getAccessPayload.mockResolvedValue({ userId: 'user-1', tokenVersion: 1 });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      tokenVersion: 1,
    });

    const service = createService();

    const result = await service.buildContext({ headers: { authorization: 'Bearer token' } });

    expect(result.user).toEqual({
      id: 'user-1',
      email: 'test@example.com',
      tokenVersion: 1,
    });
  });
});

