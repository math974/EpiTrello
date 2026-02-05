import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityType } from './models/activity-type.enum';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => WorkspacesService))
    private readonly workspacesService: WorkspacesService
  ) {}

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

  async getWorkspaceActivities(
    workspaceId: string,
    userId: string,
    limit: number,
    cursor?: string | null
  ) {
    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(workspaceId, userId);

    // Validate limit (should be between 1 and 100)
    const validLimit = Math.min(Math.max(1, limit), 100);

    // Build where clause
    const where: {
      workspaceId: string;
      createdAt?: { lt: Date };
    } = {
      workspaceId,
    };

    // If cursor is provided, decode it (cursor is ISO date string)
    if (cursor) {
      try {
        const cursorDate = new Date(cursor);
        if (!isNaN(cursorDate.getTime())) {
          where.createdAt = { lt: cursorDate };
        }
      } catch {
        // Invalid cursor format, ignore it
      }
    }

    // Fetch activities ordered by createdAt descending (most recent first)
    const activities = await this.prisma.activity.findMany({
      where,
      take: validLimit + 1, // Fetch one extra to check if there are more
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        workspace: true,
        board: true,
        actor: true,
      },
    });

    // Check if there are more activities
    const hasMore = activities.length > validLimit;
    const result = hasMore ? activities.slice(0, validLimit) : activities;

    return {
      activities: result,
      hasMore,
      nextCursor: hasMore && result.length > 0 ? result[result.length - 1].createdAt.toISOString() : null,
    };
  }
}

