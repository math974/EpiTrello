import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityType } from './models/activity-type.enum';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async logActivity(params: {
    workspaceId: string;
    boardId?: string | null;
    actorId: string;
    type: ActivityType;
    metadata?: Record<string, any> | null;
  }) {
    const { workspaceId, boardId, actorId, type, metadata } = params;

    const data: {
      workspaceId: string;
      boardId: string | null;
      actorId: string;
      type: ActivityType;
      metadata?: Record<string, any>;
    } = {
      workspaceId,
      boardId: boardId || null,
      actorId,
      type,
    };

    if (metadata !== undefined && metadata !== null) {
      data.metadata = metadata;
    }

    return this.prisma.activity.create({
      data,
      include: {
        workspace: true,
        board: true,
        actor: true,
      },
    });
  }
}

