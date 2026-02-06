import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ChecklistsService } from './checklists.service';
import { ChecklistsResolver } from './checklists.resolver';

@Module({
  imports: [PrismaModule, AuthModule, WorkspacesModule],
  providers: [ChecklistsService, ChecklistsResolver],
  exports: [ChecklistsService],
})
export class ChecklistsModule {}


