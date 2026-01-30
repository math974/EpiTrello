import { UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GqlAuthGuard } from './gql-auth.guard';
import { AuthService } from '../../auth/auth.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('GqlAuthGuard', () => {
  const authService = {
    getAccessPayload: jest.fn(),
  };

  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const createGuard = () =>
    new GqlAuthGuard(authService as unknown as AuthService, prisma as unknown as PrismaService);

  const createContext = () => ({
    req: { headers: { authorization: 'Bearer token' } },
    user: null,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when token payload is missing', async () => {
    const guard = createGuard();
    const gqlContext = createContext();
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => gqlContext,
    } as any);

    authService.getAccessPayload.mockResolvedValue(null);

    await expect(guard.canActivate({} as any)).rejects.toThrow(
      new UnauthorizedException('Unauthorized')
    );
  });

  it('throws when user is missing', async () => {
    const guard = createGuard();
    const gqlContext = createContext();
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => gqlContext,
    } as any);

    authService.getAccessPayload.mockResolvedValue({ userId: 'user-1', tokenVersion: 0 });
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(guard.canActivate({} as any)).rejects.toThrow(
      new UnauthorizedException('Unauthorized')
    );
  });

  it('throws when token version mismatches', async () => {
    const guard = createGuard();
    const gqlContext = createContext();
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => gqlContext,
    } as any);

    authService.getAccessPayload.mockResolvedValue({ userId: 'user-1', tokenVersion: 2 });
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', tokenVersion: 1 });

    await expect(guard.canActivate({} as any)).rejects.toThrow(
      new UnauthorizedException('Unauthorized')
    );
  });

  it('sets context user when valid', async () => {
    const guard = createGuard();
    const gqlContext = createContext();
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => gqlContext,
    } as any);

    const user = { id: 'user-1', tokenVersion: 1 };
    authService.getAccessPayload.mockResolvedValue({ userId: 'user-1', tokenVersion: 1 });
    prisma.user.findUnique.mockResolvedValue(user);

    await expect(guard.canActivate({} as any)).resolves.toBe(true);
    expect(gqlContext.user).toBe(user);
  });
});

