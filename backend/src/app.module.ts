import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthContextService } from './auth/auth.context';
import { validateEnv } from './config/env.validation';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { BoardsModule } from './boards/boards.module';
import { ListsModule } from './lists/lists.module';
import { CardsModule } from './cards/cards.module';
import { CommentsModule } from './comments/comments.module';
import { LabelsModule } from './labels/labels.module';
import { ActivitiesModule } from './activities/activities.module';
import { ChecklistsModule } from './checklists/checklists.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [AuthModule],
      inject: [ConfigService, AuthContextService],
      useFactory: async (_config: ConfigService, authContext: AuthContextService) => ({
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        sortSchema: true,
        playground: true,
        context: async ({ req }: { req: { headers?: Record<string, string | undefined> } }) =>
          authContext.buildContext(req),
      }),
    }),
    PrismaModule,
    AuthModule,
    ActivitiesModule,
    WorkspacesModule,
    BoardsModule,
    ListsModule,
    CardsModule,
    CommentsModule,
    LabelsModule,
    ChecklistsModule,
    HealthModule,
  ],
})
export class AppModule {}
