import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ActivitiesModule } from '../activities/activities.module';
import { AttachmentsModule } from '../attachments/attachments.module';
import { CardsResolver } from './cards.resolver';
import { CardsService } from './cards.service';

@Module({
  imports: [PrismaModule, AuthModule, WorkspacesModule, ActivitiesModule, AttachmentsModule],
  providers: [CardsService, CardsResolver],
  exports: [CardsService],
})
export class CardsModule {}

