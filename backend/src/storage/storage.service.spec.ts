import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

describe('StorageService', () => {
  let service: StorageService;
  let configService: ConfigService;
  let mockS3Client: jest.Mocked<S3Client>;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Default config values
    mockConfigService.get.mockImplementation((key: string) => {
      const defaults: Record<string, string | undefined> = {
        MINIO_ENDPOINT: 'localhost',
        MINIO_PORT: '9000',
        MINIO_USE_SSL: 'false',
        MINIO_ACCESS_KEY: 'minioadmin',
        MINIO_SECRET_KEY: 'minioadmin',
        MINIO_BUCKET_NAME: 'app-uploads',
      };
      return defaults[key];
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('initialization', () => {
    it('initializes with default values', () => {
      expect(service).toBeDefined();
      expect(service.getBucketName()).toBe('app-uploads');
    });

    it('initializes with custom endpoint', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'MINIO_ENDPOINT') return 'minio.example.com';
        if (key === 'MINIO_PORT') return '9000';
        if (key === 'MINIO_USE_SSL') return 'false';
        if (key === 'MINIO_ACCESS_KEY') return 'custom-key';
        if (key === 'MINIO_SECRET_KEY') return 'custom-secret';
        if (key === 'MINIO_BUCKET_NAME') return 'custom-bucket';
        return undefined;
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const customService = module.get<StorageService>(StorageService);
      expect(customService.getBucketName()).toBe('custom-bucket');
    });

    it('initializes with SSL enabled', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'MINIO_USE_SSL') return 'true';
        if (key === 'MINIO_ENDPOINT') return 'minio.example.com';
        if (key === 'MINIO_PORT') return '9000';
        return undefined;
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const sslService = module.get<StorageService>(StorageService);
      expect(sslService).toBeDefined();
    });
  });

  describe('getUploadUrl', () => {
    it('generates a presigned upload URL', async () => {
      const mockUrl = 'https://minio.example.com/app-uploads/test-file.jpg?signature=abc123';
      (getSignedUrl as jest.Mock).mockResolvedValue(mockUrl);

      const url = await service.getUploadUrl('test-file.jpg');

      expect(getSignedUrl).toHaveBeenCalled();
      expect(url).toBe(mockUrl);
    });

    it('generates upload URL with custom expiration', async () => {
      const mockUrl = 'https://minio.example.com/app-uploads/test-file.jpg?signature=abc123';
      (getSignedUrl as jest.Mock).mockResolvedValue(mockUrl);

      const url = await service.getUploadUrl('test-file.jpg', 7200);

      expect(getSignedUrl).toHaveBeenCalled();
      expect(url).toBe(mockUrl);
    });

    it('handles different object keys', async () => {
      const mockUrl = 'https://minio.example.com/app-uploads/path/to/file.pdf?signature=xyz789';
      (getSignedUrl as jest.Mock).mockResolvedValue(mockUrl);

      const url = await service.getUploadUrl('path/to/file.pdf');

      expect(getSignedUrl).toHaveBeenCalled();
      expect(url).toBe(mockUrl);
    });
  });

  describe('getDownloadUrl', () => {
    it('generates a presigned download URL', async () => {
      const mockUrl = 'https://minio.example.com/app-uploads/test-file.jpg?signature=def456';
      (getSignedUrl as jest.Mock).mockResolvedValue(mockUrl);

      const url = await service.getDownloadUrl('test-file.jpg');

      expect(getSignedUrl).toHaveBeenCalled();
      expect(url).toBe(mockUrl);
    });

    it('generates download URL with custom expiration', async () => {
      const mockUrl = 'https://minio.example.com/app-uploads/test-file.jpg?signature=def456';
      (getSignedUrl as jest.Mock).mockResolvedValue(mockUrl);

      const url = await service.getDownloadUrl('test-file.jpg', 1800);

      expect(getSignedUrl).toHaveBeenCalled();
      expect(url).toBe(mockUrl);
    });
  });

  describe('deleteObject', () => {
    it('deletes an object successfully', async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      (S3Client as jest.MockedClass<typeof S3Client>).mockImplementation(() => ({
        send: mockSend,
      } as any));

      // Recreate service to get new S3Client instance
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const deleteService = module.get<StorageService>(StorageService);
      await deleteService.deleteObject('test-file.jpg');

      expect(mockSend).toHaveBeenCalled();
    });

    it('handles delete errors gracefully', async () => {
      const mockSend = jest.fn().mockRejectedValue(new Error('Delete failed'));
      (S3Client as jest.MockedClass<typeof S3Client>).mockImplementation(() => ({
        send: mockSend,
      } as any));

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const deleteService = module.get<StorageService>(StorageService);

      await expect(deleteService.deleteObject('test-file.jpg')).rejects.toThrow('Delete failed');
    });
  });

  describe('getBucketName', () => {
    it('returns the configured bucket name', () => {
      expect(service.getBucketName()).toBe('app-uploads');
    });

    it('returns custom bucket name when configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'MINIO_BUCKET_NAME') return 'custom-bucket';
        return undefined;
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const customService = module.get<StorageService>(StorageService);
      expect(customService.getBucketName()).toBe('custom-bucket');
    });
  });
});

