import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ActivitiesModule } from '../activities/activities.module';
import { CommentsService } from './comments.service';
import { CommentsResolver } from './comments.resolver';

@Module({
  imports: [PrismaModule, AuthModule, WorkspacesModule, ActivitiesModule],
  providers: [CommentsService, CommentsResolver],
  exports: [CommentsService],
})
export class CommentsModule {}

