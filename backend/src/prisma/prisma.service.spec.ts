import { PrismaService } from './prisma.service';
import { PrismaClient } from '@prisma/client';

describe('PrismaService', () => {
  let service: PrismaService;
  let mockConnect: jest.Mock;
  let mockDisconnect: jest.Mock;

  beforeEach(() => {
    mockConnect = jest.fn().mockResolvedValue(undefined);
    mockDisconnect = jest.fn().mockResolvedValue(undefined);

    // Create a new instance and mock the PrismaClient methods
    service = new PrismaService();
    service.$connect = mockConnect;
    service.$disconnect = mockDisconnect;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(PrismaClient);
  });

  it('should connect to database on module init', async () => {
    await service.onModuleInit();
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it('should disconnect from database on module destroy', async () => {
    await service.onModuleDestroy();
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it('should handle connection errors gracefully', async () => {
    const error = new Error('Connection failed');
    mockConnect.mockRejectedValue(error);

    await expect(service.onModuleInit()).rejects.toThrow('Connection failed');
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it('should handle disconnection errors gracefully', async () => {
    const error = new Error('Disconnection failed');
    mockDisconnect.mockRejectedValue(error);

    await expect(service.onModuleDestroy()).rejects.toThrow('Disconnection failed');
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });
});

