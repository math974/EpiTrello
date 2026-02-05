import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ActivitiesModule } from '../activities/activities.module';
import { BoardsResolver } from './boards.resolver';
import { BoardsService } from './boards.service';

@Module({
  imports: [PrismaModule, AuthModule, WorkspacesModule, ActivitiesModule],
  providers: [BoardsService, BoardsResolver],
  exports: [BoardsService],
})
export class BoardsModule {}

