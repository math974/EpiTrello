import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import './models/workspace-role.enum';
import { WorkspacesResolver } from './workspaces.resolver';
import { WorkspacesService } from './workspaces.service';

@Module({
  imports: [AuthModule],
  providers: [WorkspacesResolver, WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}

