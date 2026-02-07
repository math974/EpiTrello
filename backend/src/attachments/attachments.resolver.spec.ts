import { Test, TestingModule } from '@nestjs/testing';
import { AttachmentsResolver } from './attachments.resolver';
import { AttachmentsService } from './attachments.service';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AttachmentsResolver', () => {
  let resolver: AttachmentsResolver;
  let attachmentsService: jest.Mocked<AttachmentsService>;

  beforeEach(async () => {
    const mockAttachmentsService = {
      createAttachmentUpload: jest.fn(),
      confirmAttachmentUpload: jest.fn(),
      deleteAttachment: jest.fn(),
    };

    const mockAuthService = {
      validateUser: jest.fn(),
    };

    const mockPrismaService = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachmentsResolver,
        {
          provide: AttachmentsService,
          useValue: mockAttachmentsService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    })
      .overrideGuard(GqlAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    resolver = module.get<AttachmentsResolver>(AttachmentsResolver);
    attachmentsService = module.get(AttachmentsService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('createAttachmentUpload', () => {
    it('calls service with correct parameters', async () => {
      const input = {
        cardId: 'card-1',
        fileName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
      };
      const userId = 'user-1';
      const expectedResult = {
        uploadUrl: 'https://minio.example.com/upload-url',
        objectKey: 'attachments/card-1/uuid-test.jpg',
      };

      attachmentsService.createAttachmentUpload.mockResolvedValue(expectedResult);

      const result = await resolver.createAttachmentUpload(input, userId);

      expect(attachmentsService.createAttachmentUpload).toHaveBeenCalledWith(
        input.cardId,
        input.fileName,
        input.mimeType,
        input.size,
        userId
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('confirmAttachmentUpload', () => {
    it('calls service with correct parameters', async () => {
      const input = {
        cardId: 'card-1',
        objectKey: 'attachments/card-1/uuid-test.jpg',
        fileName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
      };
      const userId = 'user-1';
      const expectedResult = {
        id: 'attachment-1',
        cardId: 'card-1',
        uploaderId: 'user-1',
        objectKey: 'attachments/card-1/uuid-test.jpg',
        fileName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        createdAt: new Date(),
        uploader: {
          id: 'user-1',
          username: 'user1',
          email: 'user1@example.com',
          avatar: null,
          createdAt: new Date(),
        },
      };

      attachmentsService.confirmAttachmentUpload.mockResolvedValue(expectedResult);

      const result = await resolver.confirmAttachmentUpload(input, userId);

      expect(attachmentsService.confirmAttachmentUpload).toHaveBeenCalledWith(
        input.cardId,
        input.objectKey,
        input.fileName,
        input.mimeType,
        input.size,
        userId
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('deleteAttachment', () => {
    it('calls service with correct parameters', async () => {
      const input = {
        id: 'attachment-1',
      };
      const userId = 'user-1';

      attachmentsService.deleteAttachment.mockResolvedValue(true);

      const result = await resolver.deleteAttachment(input, userId);

      expect(attachmentsService.deleteAttachment).toHaveBeenCalledWith(input.id, userId);
      expect(result).toBe(true);
    });
  });
});

