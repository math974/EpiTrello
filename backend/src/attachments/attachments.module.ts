import { Module } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { AttachmentsResolver } from './attachments.resolver';
import { DeletionRetryService } from './deletion-retry.service';
import { TmpCleanupService } from './tmp-cleanup.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { StorageModule } from '../storage/storage.module';
import { ActivitiesModule } from '../activities/activities.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, WorkspacesModule, StorageModule, ActivitiesModule, AuthModule],
  providers: [AttachmentsService, AttachmentsResolver, DeletionRetryService, TmpCleanupService],
  exports: [AttachmentsService, DeletionRetryService, TmpCleanupService],
})
export class AttachmentsModule {}


