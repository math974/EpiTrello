import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  createWorkspace(ownerId: string, name: string) {
    return this.prisma.workspace.create({
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
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!membership) {
      throw new ForbiddenException('Access denied');
    }

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { owner: true },
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
      boards: [],
    };
  }

  async updateWorkspace(workspaceId: string, userId: string, name: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.ownerId !== userId) {
      throw new ForbiddenException('Only the workspace owner can update it');
    }

    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { name },
      include: {
        owner: true,
      },
    });
  }

  async deleteWorkspace(workspaceId: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.ownerId !== userId) {
      throw new ForbiddenException('Only the workspace owner can delete it');
    }

    // Delete workspace - WorkspaceMember will be deleted in cascade (onDelete: Cascade)
    // Note: Boards are not yet linked to workspace in schema, so they won't be deleted automatically
    // This will need to be handled when Board model is updated to include workspaceId
    await this.prisma.workspace.delete({
      where: { id: workspaceId },
    });

    return true;
  }

  async addWorkspaceMember(workspaceId: string, ownerId: string, email: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (workspace.ownerId !== ownerId) {
      throw new ForbiddenException('Only the workspace owner can add members');
    }

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

    return this.prisma.workspaceMember.create({
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
  }
}

