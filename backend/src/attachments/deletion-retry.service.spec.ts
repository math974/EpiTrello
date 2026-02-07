import { Test, TestingModule } from '@nestjs/testing';
import { DeletionRetryService } from './deletion-retry.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

describe('DeletionRetryService', () => {
  let service: DeletionRetryService;
  let prismaService: PrismaService;
  let storageService: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeletionRetryService,
        {
          provide: PrismaService,
          useValue: {
            failedDeletion: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: StorageService,
          useValue: {
            deleteObject: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DeletionRetryService>(DeletionRetryService);
    prismaService = module.get<PrismaService>(PrismaService);
    storageService = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordFailedDeletion', () => {
    it('should create a new failed deletion record', async () => {
      const objectKey = 'attachments/card-1/test-file.jpg';
      const error = new Error('Storage error');

      (prismaService.failedDeletion.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.failedDeletion.create as jest.Mock).mockResolvedValue({
        id: 'failed-deletion-id',
        objectKey,
        retryCount: 1,
        lastError: error.message,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.recordFailedDeletion(objectKey, error);

      expect(prismaService.failedDeletion.findUnique).toHaveBeenCalledWith({
        where: { objectKey },
      });
      expect(prismaService.failedDeletion.create).toHaveBeenCalledWith({
        data: {
          objectKey,
          retryCount: 1,
          lastError: error.message,
        },
      });
    });

    it('should update existing failed deletion record', async () => {
      const objectKey = 'attachments/card-1/test-file.jpg';
      const error = new Error('Storage error');
      const existing = {
        id: 'failed-deletion-id',
        objectKey,
        retryCount: 2,
        lastError: 'Previous error',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaService.failedDeletion.findUnique as jest.Mock).mockResolvedValue(existing);
      (prismaService.failedDeletion.update as jest.Mock).mockResolvedValue({
        ...existing,
        retryCount: 3,
        lastError: error.message,
      });

      await service.recordFailedDeletion(objectKey, error);

      expect(prismaService.failedDeletion.findUnique).toHaveBeenCalledWith({
        where: { objectKey },
      });
      expect(prismaService.failedDeletion.update).toHaveBeenCalledWith({
        where: { objectKey },
        data: {
          retryCount: 3,
          lastError: error.message,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should handle errors gracefully', async () => {
      const objectKey = 'attachments/card-1/test-file.jpg';
      const error = new Error('Storage error');

      (prismaService.failedDeletion.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      // Should not throw
      await expect(service.recordFailedDeletion(objectKey, error)).resolves.not.toThrow();
    });
  });

  describe('retryFailedDeletions', () => {
    it('should retry failed deletions successfully', async () => {
      const failedDeletions = [
        {
          id: 'failed-deletion-1',
          objectKey: 'attachments/card-1/test-file-1.jpg',
          retryCount: 1,
          lastError: 'Storage error',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'failed-deletion-2',
          objectKey: 'attachments/card-2/test-file-2.jpg',
          retryCount: 2,
          lastError: 'Storage error',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prismaService.failedDeletion.findMany as jest.Mock).mockResolvedValue(failedDeletions);
      (storageService.deleteObject as jest.Mock).mockResolvedValue(undefined);
      (prismaService.failedDeletion.delete as jest.Mock).mockResolvedValue({});

      await service.retryFailedDeletions();

      expect(prismaService.failedDeletion.findMany).toHaveBeenCalledWith({
        where: {
          retryCount: {
            lt: 5, // MAX_RETRIES
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      expect(storageService.deleteObject).toHaveBeenCalledTimes(2);
      expect(storageService.deleteObject).toHaveBeenCalledWith('attachments/card-1/test-file-1.jpg');
      expect(storageService.deleteObject).toHaveBeenCalledWith('attachments/card-2/test-file-2.jpg');

      expect(prismaService.failedDeletion.delete).toHaveBeenCalledTimes(2);
    });

    it('should handle retry failures and update retry count', async () => {
      const failedDeletion = {
        id: 'failed-deletion-1',
        objectKey: 'attachments/card-1/test-file-1.jpg',
        retryCount: 1,
        lastError: 'Storage error',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaService.failedDeletion.findMany as jest.Mock).mockResolvedValue([failedDeletion]);
      (storageService.deleteObject as jest.Mock).mockRejectedValue(new Error('Storage still failing'));

      await service.retryFailedDeletions();

      expect(storageService.deleteObject).toHaveBeenCalledWith(failedDeletion.objectKey);
      expect(prismaService.failedDeletion.update).toHaveBeenCalledWith({
        where: { id: failedDeletion.id },
        data: {
          retryCount: 2,
          lastError: 'Storage still failing',
          updatedAt: expect.any(Date),
        },
      });
      expect(prismaService.failedDeletion.delete).not.toHaveBeenCalled();
    });

    it('should not retry if no failed deletions exist', async () => {
      (prismaService.failedDeletion.findMany as jest.Mock).mockResolvedValue([]);

      await service.retryFailedDeletions();

      expect(storageService.deleteObject).not.toHaveBeenCalled();
    });

    it('should handle errors during retry process', async () => {
      (prismaService.failedDeletion.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      // Should not throw
      await expect(service.retryFailedDeletions()).resolves.not.toThrow();
    });
  });

  describe('retryDeletion', () => {
    it('should successfully retry a specific deletion', async () => {
      const objectKey = 'attachments/card-1/test-file.jpg';
      const failedDeletion = {
        id: 'failed-deletion-id',
        objectKey,
        retryCount: 2,
        lastError: 'Storage error',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaService.failedDeletion.findUnique as jest.Mock).mockResolvedValue(failedDeletion);
      (storageService.deleteObject as jest.Mock).mockResolvedValue(undefined);
      (prismaService.failedDeletion.delete as jest.Mock).mockResolvedValue({});

      const result = await service.retryDeletion(objectKey);

      expect(result).toBe(true);
      expect(prismaService.failedDeletion.findUnique).toHaveBeenCalledWith({
        where: { objectKey },
      });
      expect(storageService.deleteObject).toHaveBeenCalledWith(objectKey);
      expect(prismaService.failedDeletion.delete).toHaveBeenCalledWith({
        where: { id: failedDeletion.id },
      });
    });

    it('should handle retry failure and update retry count', async () => {
      const objectKey = 'attachments/card-1/test-file.jpg';
      const failedDeletion = {
        id: 'failed-deletion-id',
        objectKey,
        retryCount: 2,
        lastError: 'Storage error',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaService.failedDeletion.findUnique as jest.Mock).mockResolvedValue(failedDeletion);
      (storageService.deleteObject as jest.Mock).mockRejectedValue(new Error('Still failing'));

      const result = await service.retryDeletion(objectKey);

      expect(result).toBe(false);
      expect(prismaService.failedDeletion.update).toHaveBeenCalledWith({
        where: { id: failedDeletion.id },
        data: {
          retryCount: 3,
          lastError: 'Still failing',
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should throw if no failed deletion record exists', async () => {
      const objectKey = 'attachments/card-1/test-file.jpg';

      (prismaService.failedDeletion.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.retryDeletion(objectKey)).rejects.toThrow(
        `No failed deletion record found for ${objectKey}`
      );
    });
  });
});


