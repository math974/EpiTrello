import { Test, TestingModule } from '@nestjs/testing';
import { TmpCleanupService } from './tmp-cleanup.service';
import { StorageService } from '../storage/storage.service';

describe('TmpCleanupService', () => {
  let service: TmpCleanupService;
  let storageService: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TmpCleanupService,
        {
          provide: StorageService,
          useValue: {
            listObjects: jest.fn(),
            getObjectMetadata: jest.fn(),
            deleteObject: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TmpCleanupService>(TmpCleanupService);
    storageService = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('cleanupOrphanedFiles', () => {
    it('should delete files older than 24 hours', async () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25 hours ago
      const recentDate = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago

      const tmpObjects = [
        'tmp/user-1/old-file-1.jpg',
        'tmp/user-1/old-file-2.jpg',
        'tmp/user-2/recent-file.jpg',
      ];

      (storageService.listObjects as jest.Mock).mockResolvedValue(tmpObjects);
      (storageService.getObjectMetadata as jest.Mock)
        .mockResolvedValueOnce({ lastModified: oldDate })
        .mockResolvedValueOnce({ lastModified: oldDate })
        .mockResolvedValueOnce({ lastModified: recentDate });
      (storageService.deleteObject as jest.Mock).mockResolvedValue(undefined);

      await service.cleanupOrphanedFiles();

      expect(storageService.listObjects).toHaveBeenCalledWith('tmp/');
      expect(storageService.deleteObject).toHaveBeenCalledTimes(2);
      expect(storageService.deleteObject).toHaveBeenCalledWith('tmp/user-1/old-file-1.jpg');
      expect(storageService.deleteObject).toHaveBeenCalledWith('tmp/user-1/old-file-2.jpg');
      expect(storageService.deleteObject).not.toHaveBeenCalledWith('tmp/user-2/recent-file.jpg');
    });

    it('should handle empty tmp folder', async () => {
      (storageService.listObjects as jest.Mock).mockResolvedValue([]);

      await service.cleanupOrphanedFiles();

      expect(storageService.listObjects).toHaveBeenCalledWith('tmp/');
      expect(storageService.deleteObject).not.toHaveBeenCalled();
    });

    it('should delete files when metadata cannot be retrieved', async () => {
      const tmpObjects = ['tmp/user-1/file.jpg'];

      (storageService.listObjects as jest.Mock).mockResolvedValue(tmpObjects);
      (storageService.getObjectMetadata as jest.Mock).mockResolvedValue(null);
      (storageService.deleteObject as jest.Mock).mockResolvedValue(undefined);

      await service.cleanupOrphanedFiles();

      expect(storageService.deleteObject).toHaveBeenCalledWith('tmp/user-1/file.jpg');
    });

    it('should handle errors gracefully', async () => {
      (storageService.listObjects as jest.Mock).mockRejectedValue(new Error('Storage error'));

      // Should not throw
      await expect(service.cleanupOrphanedFiles()).resolves.not.toThrow();
    });

    it('should continue processing even if one file fails', async () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 25 * 60 * 60 * 1000);

      const tmpObjects = [
        'tmp/user-1/file-1.jpg',
        'tmp/user-1/file-2.jpg',
      ];

      (storageService.listObjects as jest.Mock).mockResolvedValue(tmpObjects);
      (storageService.getObjectMetadata as jest.Mock)
        .mockResolvedValueOnce({ lastModified: oldDate })
        .mockResolvedValueOnce({ lastModified: oldDate });
      (storageService.deleteObject as jest.Mock)
        .mockRejectedValueOnce(new Error('Delete failed'))
        .mockResolvedValueOnce(undefined);

      await service.cleanupOrphanedFiles();

      expect(storageService.deleteObject).toHaveBeenCalledTimes(2);
    });
  });

  describe('manualCleanup', () => {
    it('should return cleanup statistics', async () => {
      const now = new Date();
      const oldDate = new Date(now.getTime() - 25 * 60 * 60 * 1000);
      const recentDate = new Date(now.getTime() - 12 * 60 * 60 * 1000);

      const tmpObjects = [
        'tmp/user-1/old-file.jpg',
        'tmp/user-2/recent-file.jpg',
      ];

      (storageService.listObjects as jest.Mock).mockResolvedValue(tmpObjects);
      (storageService.getObjectMetadata as jest.Mock)
        .mockResolvedValueOnce({ lastModified: oldDate })
        .mockResolvedValueOnce({ lastModified: recentDate });
      (storageService.deleteObject as jest.Mock).mockResolvedValue(undefined);

      const result = await service.manualCleanup();

      expect(result).toEqual({
        deleted: 1,
        kept: 1,
        errors: 0,
      });
    });

    it('should handle errors and return error count', async () => {
      const tmpObjects = ['tmp/user-1/file.jpg'];

      (storageService.listObjects as jest.Mock).mockResolvedValue(tmpObjects);
      (storageService.getObjectMetadata as jest.Mock).mockRejectedValue(new Error('Metadata error'));

      const result = await service.manualCleanup();

      expect(result.errors).toBeGreaterThan(0);
    });
  });
});

