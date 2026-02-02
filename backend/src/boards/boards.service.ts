import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class BoardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService
  ) {}

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

  async workspaceBoards(workspaceId: string, userId: string) {
    // Validate workspaceId is provided
    if (!workspaceId || workspaceId.trim() === '') {
      throw new NotFoundException('Workspace ID is required');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(workspaceId, userId);

    // Return all boards for this workspace
    return this.prisma.board.findMany({
      where: { workspaceId },
      include: {
        owner: true,
        workspace: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async board(boardId: string, userId: string) {
    // Validate boardId is provided
    if (!boardId || boardId.trim() === '') {
      throw new NotFoundException('Board ID is required');
    }

    // Find the board with its workspace
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        workspace: true,
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(board.workspaceId, userId);

    // Return board with lists and cards
    return this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        owner: true,
        workspace: true,
        lists: {
          include: {
            cards: {
              orderBy: {
                position: 'asc',
              },
            },
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
    });
  }

  async updateBoard(
    boardId: string,
    title: string,
    userId: string,
    description?: string | null,
    background?: string
  ) {
    // Validate boardId is provided
    if (!boardId || boardId.trim() === '') {
      throw new NotFoundException('Board ID is required');
    }

    // Validate title is provided
    if (!title || title.trim() === '') {
      throw new NotFoundException('Title is required');
    }

    // Find the board with its workspace
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        workspace: true,
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(board.workspaceId, userId);

    // Prepare update data
    const updateData: { title: string; description?: string | null; background?: string } = {
      title,
    };

    if (description !== undefined) {
      updateData.description = description;
    }

    if (background !== undefined) {
      updateData.background = background;
    }

    // Update the board
    return this.prisma.board.update({
      where: { id: boardId },
      data: updateData,
      include: {
        owner: true,
        workspace: true,
      },
    });
  }
}

