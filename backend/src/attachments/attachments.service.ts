import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { StorageService } from '../storage/storage.service';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/models/activity-type.enum';
import { DeletionRetryService } from './deletion-retry.service';
import { randomUUID } from 'crypto';

// Maximum file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService,
    private readonly storageService: StorageService,
    private readonly activitiesService: ActivitiesService,
    private readonly deletionRetryService: DeletionRetryService
  ) {}

  private readonly attachmentInclude = {
    uploader: {
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        createdAt: true,
      },
    },
  };

  /**
   * Generate a presigned URL for uploading an attachment
   */
  async createAttachmentUpload(
    cardId: string,
    fileName: string,
    mimeType: string,
    size: number,
    userId: string
  ) {
    // Validate inputs
    if (!cardId || cardId.trim() === '') {
      throw new NotFoundException('Card ID is required');
    }

    if (!fileName || fileName.trim() === '') {
      throw new BadRequestException('File name is required');
    }

    if (!mimeType || mimeType.trim() === '') {
      throw new BadRequestException('MIME type is required');
    }

    // Validate file size
    if (size <= 0) {
      throw new BadRequestException('File size must be greater than 0');
    }

    if (size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException(`MIME type ${mimeType} is not allowed`);
    }

    // Find the card with its list, board and workspace
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
          include: {
            board: {
              include: {
                workspace: true,
              },
            },
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(
      card.list.board.workspaceId,
      userId
    );

    // Generate unique object key in tmp folder: tmp/{userId}/{uuid}-{fileName}
    // This will be moved to attachments/{cardId}/ when confirmed
    const fileExtension = fileName.split('.').pop() || '';
    const baseFileName = fileName.replace(/\.[^/.]+$/, '');
    const sanitizedFileName = baseFileName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const uuid = randomUUID();
    const objectKey = `tmp/${userId}/${uuid}-${sanitizedFileName}.${fileExtension}`;

    // Generate presigned upload URL (expires in 1 hour)
    const uploadUrl = await this.storageService.getUploadUrl(objectKey, 3600);

    return {
      uploadUrl,
      objectKey,
    };
  }

  /**
   * Confirm attachment upload and create attachment record
   */
  async confirmAttachmentUpload(
    cardId: string,
    objectKey: string,
    fileName: string,
    mimeType: string,
    size: number,
    userId: string
  ) {
    // Validate inputs
    if (!cardId || cardId.trim() === '') {
      throw new NotFoundException('Card ID is required');
    }

    if (!objectKey || objectKey.trim() === '') {
      throw new BadRequestException('Object key is required');
    }

    if (!fileName || fileName.trim() === '') {
      throw new BadRequestException('File name is required');
    }

    if (!mimeType || mimeType.trim() === '') {
      throw new BadRequestException('MIME type is required');
    }

    if (size <= 0) {
      throw new BadRequestException('File size must be greater than 0');
    }

    // Find the card with its list, board and workspace
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
          include: {
            board: {
              include: {
                workspace: true,
              },
            },
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(
      card.list.board.workspaceId,
      userId
    );

    // Verify objectKey is in tmp folder and belongs to this user
    if (!objectKey.startsWith(`tmp/${userId}/`)) {
      throw new BadRequestException('Invalid object key: must be in tmp folder for this user');
    }

    // Generate final object key: attachments/{cardId}/{uuid}-{fileName}
    const fileExtension = fileName.split('.').pop() || '';
    const baseFileName = fileName.replace(/\.[^/.]+$/, '');
    const sanitizedFileName = baseFileName.replace(/[^a-zA-Z0-9_-]/g, '_');
    // Extract UUID from tmp objectKey (format: tmp/{userId}/{uuid}-{fileName})
    const tmpFileName = objectKey.split('/').pop() || '';
    const finalObjectKey = `attachments/${cardId}/${tmpFileName}`;

    // Move object from tmp/ to attachments/{cardId}/
    try {
      await this.storageService.moveObject(objectKey, finalObjectKey);
    } catch (error) {
      throw new BadRequestException(
        `Failed to move uploaded file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Create attachment record with final object key
    const attachment = await this.prisma.attachment.create({
      data: {
        cardId,
        uploaderId: userId,
        objectKey: finalObjectKey,
        fileName,
        mimeType,
        size,
      },
      include: this.attachmentInclude,
    });

    // Log activity (non-blocking)
    this.activitiesService
      .logActivity({
        workspaceId: card.list.board.workspaceId,
        boardId: card.list.boardId,
        actorId: userId,
        type: ActivityType.ATTACHMENT_UPLOADED,
        metadata: {
          cardId,
          attachmentId: attachment.id,
          fileName,
          size,
        },
      })
      .catch(() => {
        // Ignore logging errors
      });

    return attachment;
  }

  /**
   * Delete an attachment
   */
  async deleteAttachment(attachmentId: string, userId: string) {
    // Validate inputs
    if (!attachmentId || attachmentId.trim() === '') {
      throw new NotFoundException('Attachment ID is required');
    }

    // Find the attachment with its card, list, board and workspace
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        card: {
          include: {
            list: {
              include: {
                board: {
                  include: {
                    workspace: true,
                  },
                },
              },
            },
          },
        },
        uploader: true,
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    const workspaceId = attachment.card.list.board.workspaceId;
    const workspaceOwnerId = attachment.card.list.board.workspace.ownerId;

    // Check if user is the uploader or workspace owner
    if (attachment.uploaderId !== userId && workspaceOwnerId !== userId) {
      throw new ForbiddenException(
        'Only the uploader or workspace owner can delete attachments'
      );
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(workspaceId, userId);

    // Delete from database first (always succeeds)
    await this.prisma.attachment.delete({
      where: { id: attachmentId },
    });

    // Delete from storage (non-blocking, record failure for retry if it fails)
    this.storageService.deleteObject(attachment.objectKey).catch((error) => {
      // Record failed deletion for later retry
      this.deletionRetryService.recordFailedDeletion(attachment.objectKey, error).catch((retryError) => {
        // Log but don't throw - we've already deleted from DB
        console.error(`Failed to record failed deletion for ${attachment.objectKey}:`, retryError);
      });
    });

    // Log activity (non-blocking)
    this.activitiesService
      .logActivity({
        workspaceId,
        boardId: attachment.card.list.boardId,
        actorId: userId,
        type: ActivityType.ATTACHMENT_DELETED,
        metadata: {
          cardId: attachment.cardId,
          attachmentId,
          fileName: attachment.fileName,
        },
      })
      .catch(() => {
        // Ignore logging errors
      });

    return true;
  }
}

