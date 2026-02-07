import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { StorageService } from '../storage/storage.service';
import { ActivitiesService } from '../activities/activities.service';
import { DeletionRetryService } from './deletion-retry.service';

describe('AttachmentsService', () => {
  let service: AttachmentsService;
  let prisma: jest.Mocked<PrismaService>;
  let workspacesService: jest.Mocked<WorkspacesService>;
  let storageService: jest.Mocked<StorageService>;
  let activitiesService: jest.Mocked<ActivitiesService>;
  let deletionRetryService: jest.Mocked<DeletionRetryService>;

  beforeEach(async () => {
    const mockPrisma = {
      card: {
        findUnique: jest.fn(),
      },
      attachment: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };

    const mockWorkspacesService = {
      requireWorkspaceAccess: jest.fn(),
    };

    const mockStorageService = {
      getUploadUrl: jest.fn(),
      deleteObject: jest.fn(),
      moveObject: jest.fn(),
    };

    const mockActivitiesService = {
      logActivity: jest.fn().mockResolvedValue(undefined),
    };

    const mockDeletionRetryService = {
      recordFailedDeletion: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachmentsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: WorkspacesService,
          useValue: mockWorkspacesService,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: ActivitiesService,
          useValue: mockActivitiesService,
        },
        {
          provide: DeletionRetryService,
          useValue: mockDeletionRetryService,
        },
      ],
    }).compile();

    service = module.get<AttachmentsService>(AttachmentsService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    workspacesService = module.get(WorkspacesService) as jest.Mocked<WorkspacesService>;
    storageService = module.get(StorageService) as jest.Mocked<StorageService>;
    activitiesService = module.get(ActivitiesService) as jest.Mocked<ActivitiesService>;
    deletionRetryService = module.get(DeletionRetryService) as jest.Mocked<DeletionRetryService>;
  });

  describe('createAttachmentUpload', () => {
    const cardWithRelations = {
      id: 'card-1',
      listId: 'list-1',
      list: {
        id: 'list-1',
        boardId: 'board-1',
        board: {
          id: 'board-1',
          workspaceId: 'workspace-1',
          workspace: {
            id: 'workspace-1',
          },
        },
      },
    };

    it('generates presigned upload URL successfully', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });
      storageService.getUploadUrl = jest.fn().mockResolvedValue('https://minio.example.com/upload-url');

      const result = await service.createAttachmentUpload(
        'card-1',
        'test-file.jpg',
        'image/jpeg',
        1024,
        'user-1'
      );

      expect(result).toHaveProperty('uploadUrl');
      expect(result).toHaveProperty('objectKey');
      expect(result.objectKey).toContain('tmp/user-1/');
      expect(result.objectKey).not.toContain('attachments/');
      expect(storageService.getUploadUrl).toHaveBeenCalled();
    });

    it('throws NotFoundException when cardId is empty', async () => {
      await expect(
        service.createAttachmentUpload('', 'test.jpg', 'image/jpeg', 1024, 'user-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when card not found', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        service.createAttachmentUpload('card-1', 'test.jpg', 'image/jpeg', 1024, 'user-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user is not workspace member', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockRejectedValue(
        new ForbiddenException('Access denied')
      );

      await expect(
        service.createAttachmentUpload('card-1', 'test.jpg', 'image/jpeg', 1024, 'user-2')
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when file size exceeds limit', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });

      await expect(
        service.createAttachmentUpload('card-1', 'test.jpg', 'image/jpeg', 100 * 1024 * 1024, 'user-1')
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when MIME type is not allowed', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });

      await expect(
        service.createAttachmentUpload('card-1', 'test.exe', 'application/x-executable', 1024, 'user-1')
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when fileName is empty', async () => {
      await expect(
        service.createAttachmentUpload('card-1', '', 'image/jpeg', 1024, 'user-1')
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when size is 0', async () => {
      await expect(
        service.createAttachmentUpload('card-1', 'test.jpg', 'image/jpeg', 0, 'user-1')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmAttachmentUpload', () => {
    const cardWithRelations = {
      id: 'card-1',
      listId: 'list-1',
      list: {
        id: 'list-1',
        boardId: 'board-1',
        board: {
          id: 'board-1',
          workspaceId: 'workspace-1',
          workspace: {
            id: 'workspace-1',
          },
        },
      },
    };

    const attachmentData = {
      id: 'attachment-1',
      cardId: 'card-1',
      uploaderId: 'user-1',
      objectKey: 'attachments/card-1/uuid-test-file.jpg',
      fileName: 'test-file.jpg',
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

    it('creates attachment record successfully and moves file from tmp to attachments', async () => {
      const tmpObjectKey = 'tmp/user-1/uuid-test-file.jpg';
      const finalObjectKey = 'attachments/card-1/uuid-test-file.jpg';
      
      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });
      storageService.moveObject = jest.fn().mockResolvedValue(undefined);
      prisma.attachment.create = jest.fn().mockResolvedValue({
        ...attachmentData,
        objectKey: finalObjectKey,
      });

      const result = await service.confirmAttachmentUpload(
        'card-1',
        tmpObjectKey,
        'test-file.jpg',
        'image/jpeg',
        1024,
        'user-1'
      );

      expect(storageService.moveObject).toHaveBeenCalledWith(tmpObjectKey, finalObjectKey);
      expect(prisma.attachment.create).toHaveBeenCalledWith({
        data: {
          cardId: 'card-1',
          uploaderId: 'user-1',
          objectKey: finalObjectKey,
          fileName: 'test-file.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
        },
        include: expect.any(Object),
      });
      expect(activitiesService.logActivity).toHaveBeenCalled();
    });

    it('throws NotFoundException when card not found', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        service.confirmAttachmentUpload(
          'card-1',
          'attachments/card-1/uuid-test.jpg',
          'test.jpg',
          'image/jpeg',
          1024,
          'user-1'
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when objectKey is not in tmp folder for user', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });

      await expect(
        service.confirmAttachmentUpload(
          'card-1',
          'attachments/card-1/uuid-test.jpg',
          'test.jpg',
          'image/jpeg',
          1024,
          'user-1'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when objectKey belongs to different user', async () => {
      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });

      await expect(
        service.confirmAttachmentUpload(
          'card-1',
          'tmp/user-2/uuid-test.jpg',
          'test.jpg',
          'image/jpeg',
          1024,
          'user-1'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when moveObject fails', async () => {
      const tmpObjectKey = 'tmp/user-1/uuid-test-file.jpg';
      
      prisma.card.findUnique = jest.fn().mockResolvedValue(cardWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });
      storageService.moveObject = jest.fn().mockRejectedValue(new Error('Storage error'));

      await expect(
        service.confirmAttachmentUpload(
          'card-1',
          tmpObjectKey,
          'test-file.jpg',
          'image/jpeg',
          1024,
          'user-1'
        )
      ).rejects.toThrow(BadRequestException);
      
      expect(prisma.attachment.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when objectKey is empty', async () => {
      await expect(
        service.confirmAttachmentUpload('card-1', '', 'test.jpg', 'image/jpeg', 1024, 'user-1')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteAttachment', () => {
    const attachmentWithRelations = {
      id: 'attachment-1',
      cardId: 'card-1',
      uploaderId: 'user-1',
      objectKey: 'attachments/card-1/uuid-test-file.jpg',
      fileName: 'test-file.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      createdAt: new Date(),
      card: {
        id: 'card-1',
        listId: 'list-1',
        list: {
          id: 'list-1',
          boardId: 'board-1',
          board: {
            id: 'board-1',
            workspaceId: 'workspace-1',
            workspace: {
              id: 'workspace-1',
              ownerId: 'user-1',
            },
          },
        },
      },
      uploader: {
        id: 'user-1',
      },
    };

    it('deletes attachment successfully when user is uploader', async () => {
      prisma.attachment.findUnique = jest.fn().mockResolvedValue(attachmentWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });
      storageService.deleteObject = jest.fn().mockResolvedValue(undefined);
      prisma.attachment.delete = jest.fn().mockResolvedValue(attachmentWithRelations);

      const result = await service.deleteAttachment('attachment-1', 'user-1');

      expect(result).toBe(true);
      expect(storageService.deleteObject).toHaveBeenCalledWith('attachments/card-1/uuid-test-file.jpg');
      expect(prisma.attachment.delete).toHaveBeenCalled();
      expect(activitiesService.logActivity).toHaveBeenCalled();
    });

    it('deletes attachment successfully when user is workspace owner', async () => {
      const attachmentWithOwner = {
        ...attachmentWithRelations,
        card: {
          ...attachmentWithRelations.card,
          list: {
            ...attachmentWithRelations.card.list,
            board: {
              ...attachmentWithRelations.card.list.board,
              workspace: {
                id: 'workspace-1',
                ownerId: 'user-2',
              },
            },
          },
        },
      };

      prisma.attachment.findUnique = jest.fn().mockResolvedValue(attachmentWithOwner);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-2', workspaceId: 'workspace-1' },
      });
      storageService.deleteObject = jest.fn().mockResolvedValue(undefined);
      prisma.attachment.delete = jest.fn().mockResolvedValue(attachmentWithOwner);

      const result = await service.deleteAttachment('attachment-1', 'user-2');

      expect(result).toBe(true);
      expect(prisma.attachment.delete).toHaveBeenCalled();
    });

    it('throws NotFoundException when attachment not found', async () => {
      prisma.attachment.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.deleteAttachment('attachment-1', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('throws ForbiddenException when user is neither uploader nor owner', async () => {
      const attachmentWithOtherUser = {
        ...attachmentWithRelations,
        card: {
          ...attachmentWithRelations.card,
          list: {
            ...attachmentWithRelations.card.list,
            board: {
              ...attachmentWithRelations.card.list.board,
              workspace: {
                id: 'workspace-1',
                ownerId: 'user-3',
              },
            },
          },
        },
      };

      prisma.attachment.findUnique = jest.fn().mockResolvedValue(attachmentWithOtherUser);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-2', workspaceId: 'workspace-1' },
      });

      await expect(service.deleteAttachment('attachment-1', 'user-2')).rejects.toThrow(
        ForbiddenException
      );
      expect(prisma.attachment.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when attachmentId is empty', async () => {
      await expect(service.deleteAttachment('', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('continues deletion even if storage delete fails and records failed deletion', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      prisma.attachment.findUnique = jest.fn().mockResolvedValue(attachmentWithRelations);
      workspacesService.requireWorkspaceAccess = jest.fn().mockResolvedValue({
        workspace: { id: 'workspace-1' },
        membership: { userId: 'user-1', workspaceId: 'workspace-1' },
      });
      const storageError = new Error('Storage error');
      storageService.deleteObject = jest.fn().mockRejectedValue(storageError);
      prisma.attachment.delete = jest.fn().mockResolvedValue(attachmentWithRelations);
      deletionRetryService.recordFailedDeletion = jest.fn().mockResolvedValue(undefined);

      const result = await service.deleteAttachment('attachment-1', 'user-1');

      expect(result).toBe(true);
      // Database deletion should always happen first
      expect(prisma.attachment.delete).toHaveBeenCalled();
      
      // Wait a bit for the async storage deletion to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should record failed deletion for retry
      expect(deletionRetryService.recordFailedDeletion).toHaveBeenCalledWith(
        'attachments/card-1/uuid-test-file.jpg',
        storageError
      );
      
      consoleErrorSpy.mockRestore();
    });
  });
});

