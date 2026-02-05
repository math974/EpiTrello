import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ActivitiesModule } from '../activities/activities.module';
import { ListsResolver } from './lists.resolver';
import { ListsService } from './lists.service';

@Module({
  imports: [PrismaModule, AuthModule, WorkspacesModule, ActivitiesModule],
  providers: [ListsService, ListsResolver],
  exports: [ListsService],
})
export class ListsModule {}

