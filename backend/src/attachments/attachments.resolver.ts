import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AttachmentsService } from './attachments.service';
import { CreateAttachmentUploadInput } from './dto/create-attachment-upload.input';
import { ConfirmAttachmentUploadInput } from './dto/confirm-attachment-upload.input';
import { DeleteAttachmentInput } from './dto/delete-attachment.input';
import { AttachmentUploadUrlModel } from './models/attachment-upload-url.model';
import { AttachmentModel } from './models/attachment.model';

@Resolver()
@UseGuards(GqlAuthGuard)
export class AttachmentsResolver {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Mutation(() => AttachmentUploadUrlModel)
  async createAttachmentUpload(
    @Args('input') input: CreateAttachmentUploadInput,
    @CurrentUser('id') userId: string
  ) {
    return this.attachmentsService.createAttachmentUpload(
      input.cardId,
      input.fileName,
      input.mimeType,
      input.size,
      userId
    );
  }

  @Mutation(() => AttachmentModel)
  async confirmAttachmentUpload(
    @Args('input') input: ConfirmAttachmentUploadInput,
    @CurrentUser('id') userId: string
  ) {
    return this.attachmentsService.confirmAttachmentUpload(
      input.cardId,
      input.objectKey,
      input.fileName,
      input.mimeType,
      input.size,
      userId
    );
  }

  @Mutation(() => Boolean)
  async deleteAttachment(
    @Args('input') input: DeleteAttachmentInput,
    @CurrentUser('id') userId: string
  ) {
    return this.attachmentsService.deleteAttachment(input.id, userId);
  }
}


