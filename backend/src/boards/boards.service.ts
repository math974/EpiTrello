import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  async createBoard(workspaceId: string, title: string, userId: string) {
    // Validate workspaceId is provided
    if (!workspaceId || workspaceId.trim() === '') {
      throw new NotFoundException('Workspace ID is required');
    }

    // Check if workspace exists
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Check if user is a member of the workspace
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('User is not a member of this workspace');
    }

    // Create board with owner = creator (userId)
    return this.prisma.board.create({
      data: {
        title,
        workspaceId,
        ownerId: userId, // board owner = creator
      },
      include: {
        owner: true,
        workspace: true,
      },
    });
  }
}

