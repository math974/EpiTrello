import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

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

describe('AuthService.register', () => {
  const prisma = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const jwt = {
    signAsync: jest.fn(),
  };

  const config = {
    get: jest.fn(),
  };

  const createService = () => new AuthService(prisma as any, jwt as any, config as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a new user and returns tokens', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
    });

    bcrypt.hash.mockResolvedValueOnce('password-hash').mockResolvedValueOnce('refresh-hash');
    jwt.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');

    const service = createService();

    const result = await service.register({
      email: 'Test@Example.com',
      username: 'testuser',
      password: 'StrongPassword123!',
    });

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { OR: [{ email: 'test@example.com' }, { username: 'testuser' }] },
    });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'password-hash',
      },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { refreshTokenHash: 'refresh-hash' },
    });
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
      },
    });
  });

  it('throws when email already exists', async () => {
    prisma.user.findFirst.mockResolvedValue({
      email: 'test@example.com',
      username: 'someone',
    });

    const service = createService();

    await expect(
      service.register({
        email: 'TEST@EXAMPLE.COM',
        username: 'testuser',
        password: 'StrongPassword123!',
      })
    ).rejects.toThrow(new BadRequestException('Email already in use'));
  });

  it('throws when username already exists', async () => {
    prisma.user.findFirst.mockResolvedValue({
      email: 'other@example.com',
      username: 'testuser',
    });

    const service = createService();

    await expect(
      service.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'StrongPassword123!',
      })
    ).rejects.toThrow(new BadRequestException('Username already in use'));
  });
});


