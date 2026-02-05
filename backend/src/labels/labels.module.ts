import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ActivitiesModule } from '../activities/activities.module';
import { LabelsService } from './labels.service';
import { LabelsResolver } from './labels.resolver';

@Module({
  imports: [PrismaModule, AuthModule, WorkspacesModule, ActivitiesModule],
  providers: [LabelsService, LabelsResolver],
  exports: [LabelsService],
})
export class LabelsModule {}

