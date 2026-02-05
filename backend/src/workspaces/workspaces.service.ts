import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Workspace, WorkspaceMember, WorkspaceRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityType } from '../activities/models/activity-type.enum';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activitiesService: ActivitiesService
  ) {}

  async createWorkspace(ownerId: string, name: string) {
    const workspace = await this.prisma.workspace.create({
      data: {
        name,
        ownerId,
        members: {
          create: {
            userId: ownerId,
            role: WorkspaceRole.OWNER,
          },
        },
      },
      include: {
        owner: true,
      },
    });

    // Log activity (non-blocking)
    this.activitiesService
      .logActivity({
        workspaceId: workspace.id,
        actorId: ownerId,
        type: ActivityType.WORKSPACE_CREATED,
        metadata: { name },
      })
      .catch(() => {
        // Ignore logging errors
      });

    return workspace;
  }

  private async requireWorkspace(workspaceId: string): Promise<Workspace> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async requireWorkspaceAccess(
    workspaceId: string,
    userId: string
  ): Promise<{ workspace: Workspace; membership: WorkspaceMember }> {
    const workspace = await this.requireWorkspace(workspaceId);
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    if (!membership) {
      throw new ForbiddenException('Access denied');
    }

    return { workspace, membership };
  }

  async requireWorkspaceOwner(
    workspaceId: string,
    userId: string
  ): Promise<{ workspace: Workspace; membership: WorkspaceMember }> {
    const { workspace, membership } = await this.requireWorkspaceAccess(workspaceId, userId);

    if (membership.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('Only a workspace owner can perform this action');
    }

    return { workspace, membership };
  }
  myWorkspaces(userId: string) {
    return this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            owner: true,
          },
        },
      },
      orderBy: {
        workspace: {
          createdAt: 'desc',
        },
      },
    });
  }

  async getWorkspace(userId: string, workspaceId: string) {
    await this.requireWorkspaceAccess(workspaceId, userId);

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        owner: true,
        boards: {
          include: {
            owner: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        labels: true,
      },
    });
    if (!workspace) {
      return null;
    }

    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: true },
      orderBy: { userId: 'asc' },
    });

    return {
      ...workspace,
      members,
    };
  }

  async updateWorkspace(workspaceId: string, userId: string, name: string) {
    await this.requireWorkspaceOwner(workspaceId, userId);

    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { name },
      include: {
        owner: true,
      },
    });

    // Log activity (non-blocking)
    this.activitiesService
      .logActivity({
        workspaceId,
        actorId: userId,
        type: ActivityType.WORKSPACE_UPDATED,
        metadata: { name },
      })
      .catch(() => {
        // Ignore logging errors
      });

    return workspace;
  }

  async deleteWorkspace(workspaceId: string, userId: string) {
    await this.requireWorkspaceOwner(workspaceId, userId);

    // Delete workspace - WorkspaceMember and Boards will be deleted in cascade (onDelete: Cascade)
    await this.prisma.workspace.delete({
      where: { id: workspaceId },
    });

    return true;
  }

  async addWorkspaceMember(workspaceId: string, ownerId: string, email: string) {
    await this.requireWorkspaceOwner(workspaceId, ownerId);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User with this email not found');
    }

    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
    });

    if (existingMember) {
      throw new ForbiddenException('User is already a member of this workspace');
    }

    const membership = await this.prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId,
        role: WorkspaceRole.MEMBER,
      },
      include: {
        user: true,
        workspace: true,
      },
    });

    // Log activity (non-blocking)
    this.activitiesService
      .logActivity({
        workspaceId,
        actorId: ownerId,
        type: ActivityType.WORKSPACE_MEMBER_ADDED,
        metadata: { userId: user.id, email: user.email, username: user.username },
      })
      .catch(() => {
        // Ignore logging errors
      });

    return membership;
  }

  async removeWorkspaceMember(workspaceId: string, ownerId: string, userIdToRemove: string) {
    await this.requireWorkspaceOwner(workspaceId, ownerId);

    const memberToRemove = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: userIdToRemove,
          workspaceId,
        },
      },
    });

    if (!memberToRemove) {
      throw new NotFoundException('User is not a member of this workspace');
    }

    // Check if this is the last OWNER
    if (memberToRemove.role === WorkspaceRole.OWNER) {
      const ownerCount = await this.prisma.workspaceMember.count({
        where: {
          workspaceId,
          role: WorkspaceRole.OWNER,
        },
      });

      if (ownerCount <= 1) {
        throw new ForbiddenException('Cannot remove the last owner of the workspace');
      }
    }

    await this.prisma.workspaceMember.delete({
      where: {
        userId_workspaceId: {
          userId: userIdToRemove,
          workspaceId,
        },
      },
    });

    // Log activity (non-blocking)
    this.activitiesService
      .logActivity({
        workspaceId,
        actorId: ownerId,
        type: ActivityType.WORKSPACE_MEMBER_REMOVED,
        metadata: { userId: userIdToRemove },
      })
      .catch(() => {
        // Ignore logging errors
      });

    return true;
  }

  async leaveWorkspace(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('User is not a member of this workspace');
    }

    // Check if this is the last OWNER
    if (membership.role === WorkspaceRole.OWNER) {
      const ownerCount = await this.prisma.workspaceMember.count({
        where: {
          workspaceId,
          role: WorkspaceRole.OWNER,
        },
      });

      if (ownerCount <= 1) {
        throw new ForbiddenException('Cannot leave workspace as the last owner');
      }
    }

    await this.prisma.workspaceMember.delete({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    // Log activity (non-blocking)
    this.activitiesService
      .logActivity({
        workspaceId,
        actorId: userId,
        type: ActivityType.WORKSPACE_MEMBER_LEFT,
        metadata: {},
      })
      .catch(() => {
        // Ignore logging errors
      });

    return true;
  }
}

