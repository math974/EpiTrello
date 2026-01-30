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
}

