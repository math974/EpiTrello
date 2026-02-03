import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class ListsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspacesService: WorkspacesService
  ) {}

  async createList(boardId: string, title: string, userId: string) {
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

    // Get the last position (highest position value) for lists in this board
    const lastList = await this.prisma.list.findFirst({
      where: { boardId },
      orderBy: { position: 'desc' },
    });

    // Calculate the new position (last position + 1, or 0 if no lists exist)
    const newPosition = lastList ? lastList.position + 1 : 0;

    // Create the list with auto-calculated position
    return this.prisma.list.create({
      data: {
        title,
        boardId,
        position: newPosition,
      },
      include: {
        board: true,
      },
    });
  }

  async updateList(listId: string, title: string, userId: string) {
    // Validate listId is provided
    if (!listId || listId.trim() === '') {
      throw new NotFoundException('List ID is required');
    }

    // Validate title is provided
    if (!title || title.trim() === '') {
      throw new NotFoundException('Title is required');
    }

    // Find the list with its board and workspace
    const list = await this.prisma.list.findUnique({
      where: { id: listId },
      include: {
        board: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    // Check if user is a member of the workspace (throws ForbiddenException if not)
    await this.workspacesService.requireWorkspaceAccess(list.board.workspaceId, userId);

    // Update the list
    return this.prisma.list.update({
      where: { id: listId },
      data: {
        title,
      },
      include: {
        board: true,
      },
    });
  }
}

